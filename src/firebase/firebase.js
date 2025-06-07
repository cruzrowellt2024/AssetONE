import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUaIRaYz4UA0_AzeeT_rVY-gJVzveORrQ",
  authDomain: "assetone-ams.firebaseapp.com",
  projectId: "assetone-ams",
  storageBucket: "assetone-ams.firebasestorage.app",
  messagingSenderId: "853391291458",
  appId: "1:853391291458:web:89e05881c8db59243c69db",
  measurementId: "G-4L3J74CHMM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

let secondaryApp;
if (getApps().length < 2) {
  secondaryApp = initializeApp(firebaseConfig, "Secondary");
}

const secondaryAuth = getAuth(secondaryApp);

export { auth, db, secondaryAuth };