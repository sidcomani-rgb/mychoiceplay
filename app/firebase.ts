import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBEXnPWsZkzZ7fStwrdMhIxWSitrJETX3Y",
  authDomain: "mychoiceplay-ed7ec.firebaseapp.com",
  projectId: "mychoiceplay-ed7ec",
  storageBucket: "mychoiceplay-ed7ec.firebasestorage.app",
  messagingSenderId: "711595930226",
  appId: "1:711595930226:web:b468843f3590318ced08eb"
};

export const app = initializeApp(firebaseConfig);