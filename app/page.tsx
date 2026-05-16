"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function HomePage() {

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("Login Success");
    } catch (error) {
      console.log(error);
      alert("Login Failed");
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center">
      
      <h1 className="text-pink-500 text-6xl font-bold mb-10">
        MYCHOICEPLAY
      </h1>

      <button
        onClick={login}
        className="bg-white text-black px-10 py-4 rounded-full text-2xl font-bold"
      >
        LOGIN WITH GOOGLE
      </button>

    </main>
  );
}