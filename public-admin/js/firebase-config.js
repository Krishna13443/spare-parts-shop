// Firebase Configuration Reference: https://firebase.google.com/docs/auth/web/phone-auth
// IMPORTANT: Replace the placeholders below with your actual Firebase project keys!

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// This will be used in app.js and auth.js
window.firebaseConfig = firebaseConfig;
