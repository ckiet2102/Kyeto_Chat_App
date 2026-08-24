import { keyStoreService } from "./keyStoreService";
import api from "@/lib/axios";

export class CryptoService {
  private static sharedKeysCache = new Map<string, CryptoKey>();

  // 1. Generate local ECDH Key Pair (P-256)
  static async initUserKeys(userId: string): Promise<string> {
    try {
      let stored = await keyStoreService.getKeys(userId);

      // Check key rotation (> 30 days)
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (stored && Date.now() - stored.createdAt > THIRTY_DAYS_MS) {
        console.log("[E2EE] Keys are older than 30 days. Rotating keys...");
        await keyStoreService.deleteKeys(userId);
        stored = null;
      }

      if (stored) {
        return JSON.stringify(stored.publicKeyJWK);
      }

      // Generate ECDH Key Pair
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );

      const publicKeyJWK = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
      const privateKeyJWK = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

      await keyStoreService.saveKeys(userId, publicKeyJWK, privateKeyJWK);

      const pubKeyStr = JSON.stringify(publicKeyJWK);
      // Upload public key to backend
      await api.post("/users/keys", { publicKey: pubKeyStr }, { withCredentials: true });
      return pubKeyStr;
    } catch (error) {
      console.error("[E2EE] Failed to initialize user keys:", error);
      return "";
    }
  }

  // 2. Derive Shared AES-GCM Key with recipient's ECDH Public Key
  static async getSharedKey(currentUserId: string, recipientUserId: string): Promise<CryptoKey | null> {
    const cacheKey = `${currentUserId}_${recipientUserId}`;
    if (this.sharedKeysCache.has(cacheKey)) {
      return this.sharedKeysCache.get(cacheKey)!;
    }

    try {
      let myKeys = await keyStoreService.getKeys(currentUserId);
      if (!myKeys) {
        await this.initUserKeys(currentUserId);
        myKeys = await keyStoreService.getKeys(currentUserId);
        if (!myKeys) return null;
      }

      // Fetch recipient's public key from server
      const res = await api.get(`/users/${recipientUserId}/key`, { withCredentials: true });
      const recipientPubKeyStr = res.data?.publicKey;
      if (!recipientPubKeyStr) {
        console.warn(`[E2EE] Recipient ${recipientUserId} has no ECDH public key yet.`);
        return null;
      }

      const recipientPubKeyJWK = JSON.parse(recipientPubKeyStr);

      // Import recipient's public key
      const recipientPubKey = await window.crypto.subtle.importKey(
        "jwk",
        recipientPubKeyJWK,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
      );

      // Import my private key
      const myPrivateKey = await window.crypto.subtle.importKey(
        "jwk",
        myKeys.privateKeyJWK,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"]
      );

      // Derive shared AES-GCM 256 key
      const sharedKey = await window.crypto.subtle.deriveKey(
        { name: "ECDH", public: recipientPubKey },
        myPrivateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      this.sharedKeysCache.set(cacheKey, sharedKey);
      return sharedKey;
    } catch (error) {
      console.error("[E2EE] Failed to derive shared key:", error);
      return null;
    }
  }

  // Legacy PBKDF2 Fallback Key
  private static async getDerivedKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as any,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // 3. Encrypt Message using ECDH Shared Key or Fallback Passphrase
  static async encryptMessage(
    text: string,
    secretPassphrase = "moji-default-key",
    currentUserId?: string,
    recipientUserId?: string
  ): Promise<string> {
    try {
      const enc = new TextEncoder();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      let key: CryptoKey | null = null;
      if (currentUserId && recipientUserId) {
        key = await this.getSharedKey(currentUserId, recipientUserId);
      }

      if (key) {
        const encryptedContent = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          enc.encode(text)
        );

        const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedContent), iv.length);

        return "ECDH:" + btoa(String.fromCharCode(...combined));
      }

      // Fallback PBKDF2
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      key = await this.getDerivedKey(secretPassphrase, salt);
      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(text)
      );

      const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

      return "E2EE:" + btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error("Lỗi mã hóa E2EE:", error);
      return text;
    }
  }

  // 4. Decrypt Message
  static async decryptMessage(
    encryptedStr: string,
    secretPassphrase = "moji-default-key",
    currentUserId?: string,
    otherUserId?: string
  ): Promise<string> {
    if (!encryptedStr || (!encryptedStr.startsWith("E2EE:") && !encryptedStr.startsWith("ECDH:"))) {
      return encryptedStr;
    }

    try {
      const dec = new TextDecoder();

      if (encryptedStr.startsWith("ECDH:")) {
        const base64Data = encryptedStr.replace("ECDH:", "");
        const combined = new Uint8Array(
          atob(base64Data)
            .split("")
            .map((char) => char.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        if (currentUserId && otherUserId) {
          const key = await this.getSharedKey(currentUserId, otherUserId);
          if (key) {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
              { name: "AES-GCM", iv },
              key,
              data
            );
            return dec.decode(decryptedBuffer);
          }
        }
      }

      // Fallback PBKDF2
      const base64Data = encryptedStr.replace("E2EE:", "");
      const combined = new Uint8Array(
        atob(base64Data)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const key = await this.getDerivedKey(secretPassphrase, salt);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );

      return dec.decode(decryptedBuffer);
    } catch (error) {
      console.error("Lỗi giải mã E2EE:", error);
      return "[Tin nhắn đã được mã hóa End-to-End]";
    }
  }
}
