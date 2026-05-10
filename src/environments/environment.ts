// Firebase configuration for DPRMS
// INSTRUCTIONS: Replace these values with YOUR Firebase project credentials
// 1. Go to https://console.firebase.google.com
// 2. Create a new project named "DPRMS" (or use existing)
// 3. Go to Project Settings > Your Apps > Add Web App
// 4. Copy the firebaseConfig values and paste them here
// 5. Enable Authentication (Email/Password) in Firebase Console
// 6. Enable Firestore Database in Firebase Console

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyB-CE-BEYLzZNUgb3ZxVjFW_DYWY4UFoTo",
    authDomain: "dprms-d33ba.firebaseapp.com",
    projectId: "dprms-d33ba",
    storageBucket: "dprms-d33ba.firebasestorage.app",
    messagingSenderId: "596044025879",
    appId: "1:596044025879:web:ce8299046d4c3790b20c52",
    measurementId: "G-VLYW34X4YQ"
  }
};

// ============================================================
// FIREBASE SETUP CHECKLIST:
// ============================================================
// [ ] 1. Create Firebase project at console.firebase.google.com
// [ ] 2. Enable Email/Password Authentication
// [ ] 3. Create Firestore Database (start in test mode for development)
// [ ] 4. Replace the values above with your actual config
// [ ] 5. Add a user in Firebase Authentication:
//        - Go to Authentication > Users > Add User
//        - Email: admin@dprms.com  Password: admin123
// [ ] 6. Set Firestore Rules (for production):
//        rules_version = '2';
//        service cloud.firestore {
//          match /databases/{database}/documents {
//            match /{document=**} {
//              allow read, write: if request.auth != null;
//            }
//          }
//        }
// ============================================================
