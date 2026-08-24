export class NotificationService {
  private static originalTitle = "Kyeto Chat";

  static async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Trình duyệt không hỗ trợ Web Push Notifications.");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  static sendDesktopNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      onClick?: () => void;
    }
  ) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    if (document.hidden) {
      const notification = new Notification(title, {
        body: options?.body || "Bạn có thông báo mới",
        icon: options?.icon || "/kyeto.png",
      });

      if (options?.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
        };
      }
    }
  }

  // Audio API notification sound
  static playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5 note

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.warn("Could not play notification sound:", err);
    }
  }

  // Audio API mention notification sound (Urgent dual-tone chime overriding mute)
  static playMentionNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(659.25, now, 0.18);       // E5
      playTone(880, now + 0.15, 0.2);     // A5
      playTone(1046.50, now + 0.3, 0.35); // C6 high alert note
    } catch (err) {
      console.warn("Could not play mention notification sound:", err);
    }
  }

  // Update browser tab document title with badge count: "(N) Kyeto Chat"
  static updateDocumentTitleBadge(unreadCount: number) {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${this.originalTitle}`;
    } else {
      document.title = this.originalTitle;
    }
  }
}
