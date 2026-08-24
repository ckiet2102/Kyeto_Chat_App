import webPush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

// Setup VAPID keys
let publicVapidKey = process.env.VAPID_PUBLIC_KEY;
let privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (!publicVapidKey || !privateVapidKey) {
  // Generate volatile fallback VAPID keys for local dev
  const vapidKeys = webPush.generateVAPIDKeys();
  publicVapidKey = vapidKeys.publicKey;
  privateVapidKey = vapidKeys.privateKey;
  console.log("[PushService] Generated dev VAPID Public Key:", publicVapidKey);
}

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:support@kyeto.chat",
  publicVapidKey,
  privateVapidKey
);

export const getVapidPublicKey = () => publicVapidKey;

export const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) return;

    const notificationData = JSON.stringify({
      title: payload.title || "Kyeto Chat",
      body: payload.body || "Bạn có tin nhắn mới",
      icon: payload.icon || "/kyeto.png",
      url: payload.url || "/",
      data: payload.data || {},
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          notificationData
        );
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid -> clean up
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`[PushService] Failed to send push to sub ${sub._id}:`, error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("[PushService Error]:", error);
  }
};
