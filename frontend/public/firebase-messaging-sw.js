importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// To receive background push notifications from FCM, provide your Firebase config here.
// These values should match your web app's configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title || 'CarePath Alert';
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.svg',
        data: payload.data,
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
} catch (e) {
  console.log('Firebase SW initialization error:', e);
}

// Fallback manual push event listener if FCM is not configured but a push event is triggered
self.addEventListener('push', function(event) {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") return; // FCM handles it

  const payload = event.data ? event.data.json() : { notification: { title: 'Notification', body: 'You have a new alert.' } };
  
  const title = payload.notification?.title || 'CarePath Alert';
  const options = {
    body: payload.notification?.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Focus the window or navigate to a specific URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      if (windowClients.length > 0) {
        windowClients[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
