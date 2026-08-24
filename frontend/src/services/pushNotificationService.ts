import api from "@/lib/axios";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  static async registerAndSubscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Web Push Notifications are not supported in this browser.");
      return false;
    }

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Push notification permission denied.");
        return false;
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 3. Get VAPID Public Key from backend
      const res = await api.get("/notifications/vapid-key", { withCredentials: true });
      const vapidPublicKey = res.data.publicKey;
      if (!vapidPublicKey) return false;

      // 4. Subscribe
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 5. Send subscription payload to backend
      await api.post(
        "/notifications/subscribe",
        {
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        },
        { withCredentials: true }
      );

      console.log("[PushService] Successfully subscribed to Web Push Notifications.");
      return true;
    } catch (error) {
      console.error("[PushService] Error subscribing to push:", error);
      return false;
    }
  }
}
