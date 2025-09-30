// Firebase configuration (firebase.js or similar file)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfCa-u2XDUSDpHW6iY4FSbjKD84-NVj_8",
  authDomain: "admin-58408.firebaseapp.com",
  projectId: "admin-58408",
  storageBucket: "admin-58408.appspot.com",
  messagingSenderId: "669531223876",
  appId: "1:669531223876:web:93b215e3266560163d0911",
  measurementId: "G-N05V1TH7QV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, auth, storage, db, analytics };


