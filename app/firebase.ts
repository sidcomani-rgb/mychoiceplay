import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEXnPWszKzZ7fStwrdMhIxWSitrJETX3Y",
  authDomain: "mychoiceplay-ed7ec.firebaseapp.com",
  projectId: "mychoiceplay-ed7ec",
  storageBucket: "mychoiceplay-ed7ec.firebasestorage.app",
  messagingSenderId: "711595930226",
  appId: "1:711595930226:web:b468843f3590318ced08eb",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);