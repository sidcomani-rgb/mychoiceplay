import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";



const firebaseConfig = {
  apiKey: "AIzaSyBTOonTN3bH-jr8hEinlgaZ1QUjXZBJu2w",
  authDomain: "mychoiceplay-3cc9d.firebaseapp.com",
  projectId: "mychoiceplay-3cc9d",
  storageBucket: "mychoiceplay-3cc9d.firebasestorage.app",
  messagingSenderId: "817877334454",
  appId: "1:817877334454:web:beeb1941529a02a1f7a917"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);