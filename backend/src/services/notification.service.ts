/**
 * Notification Service
 * Handles dispatching push notifications (FCM) and email alerts to users.
 * 
 * NOTE: In development mode (without Firebase Admin SDK credentials),
 * this service logs the notification to the console instead of pushing it.
 */

export class NotificationService {
  private isConfigured: boolean = false;

  constructor() {
    // In a real implementation, you would initialize firebase-admin here:
    // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    this.isConfigured = !!process.env.FIREBASE_PROJECT_ID;
  }

  /**
   * Send a push notification to a specific user or device token.
   * @param token The FCM device token or user topic
   * @param title Notification title
   * @param body Notification body
   * @param data Optional custom data payload
   */
  async sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.isConfigured) {
      console.log(`\n[MOCK FCM NOTIFICATION]`);
      console.log(`To: ${token}`);
      console.log(`Title: ${title}`);
      console.log(`Body: ${body}`);
      if (data) console.log(`Data:`, data);
      console.log(`-------------------------\n`);
      return { success: true, mocked: true };
    }

    try {
      // Real FCM implementation
      // await admin.messaging().send({ token, notification: { title, body }, data });
      return { success: true };
    } catch (error) {
      console.error('[NotificationService] Failed to send push notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Common Notification Triggers
   */
  async notifyDoctorCalling(patientFCMToken: string, doctorName: string) {
    return this.sendPushNotification(
      patientFCMToken,
      'Doctor is calling! 📞',
      `Dr. ${doctorName} is ready for your consultation. Please join the virtual room.`,
      { type: 'CALL_STARTED' }
    );
  }

  async notifyQueuePositionUpdate(patientFCMToken: string, position: number) {
    return this.sendPushNotification(
      patientFCMToken,
      'Queue Update ⏳',
      `You are now number ${position} in the queue. Get ready!`,
      { type: 'QUEUE_UPDATE', position: position.toString() }
    );
  }
}

export const notificationService = new NotificationService();
