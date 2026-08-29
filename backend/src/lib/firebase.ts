import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let isFirebaseInitialized = false;

try {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log('[FIREBASE] Admin SDK initialized with credentials.');
    } else {
      console.warn('[FIREBASE] No FIREBASE_SERVICE_ACCOUNT provided. FCM push notifications will be mocked.');
    }
  } else {
    isFirebaseInitialized = true;
  }
} catch (error) {
  console.error('[FIREBASE] Failed to initialize Firebase Admin SDK:', error);
}

export const sendPushNotification = async (token: string, title: string, body: string, data?: Record<string, string>) => {
  if (!isFirebaseInitialized) {
    console.log(`[FCM MOCK] Push Notification sent to token ${token}: ${title} - ${body}`);
    return { success: true, mocked: true };
  }

  try {
    const message = {
      notification: { title, body },
      data: data || {},
      token,
    };
    
    const response = await getMessaging().send(message);
    console.log('[FCM] Successfully sent message:', response);
    return { success: true, response };
  } catch (error) {
    console.error('[FCM] Error sending message:', error);
    return { success: false, error };
  }
};
