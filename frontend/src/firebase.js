// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAen06_VB2yH_RkazVQdhsNil1mPejo0go",
  authDomain: "new-restaurant-system.firebaseapp.com",
  projectId: "new-restaurant-system",
  storageBucket: "new-restaurant-system.firebasestorage.app",
  messagingSenderId: "337795412553",
  appId: "1:337795412553:web:fa8b1cc3fe7bff35aa8598",
  measurementId: "G-RGLXY7H8RC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Safely initialize Analytics (only in browser environments where supported)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
export default app;
