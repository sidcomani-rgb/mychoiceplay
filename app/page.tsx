"use client";

import { useEffect, useState } from "react";
import {
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    getRedirectResult(auth).catch(console.log);

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const walletRef = doc(db, "wallets", currentUser.uid);

        onSnapshot(walletRef, (snap) => {
          setBalance(snap.exists() ? snap.data().balance || 0 : 0);
        });
      }
    });

    return () => unsub();
  }, []);

  const login = async () => {
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const submitDeposit = async () => {
    if (!amount || !utr || !user) {
      alert("Enter amount and UTR");
      return;
    }

    await addDoc(collection(db, "deposits"), {
      uid: user.uid,
      name: user.displayName || "User",
      email: user.email,
      amount: Number(amount),
      utr,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    alert("Deposit Request Sent ✅");
    setAmount("");
    setUtr("");
    setShowAdd(false);
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center">
        <h1 className="text-pink-500 text-6xl font-bold mb-10">
          MY CHOICE PLAY
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

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <h1 className="text-pink-500 text-5xl font-bold mb-6">
        MY CHOICE PLAY
      </h1>

      <div className="border border-pink-500 bg-zinc-900 rounded-2xl p-6 text-center">
        <p className="text-2xl">Wallet Balance</p>
        <h2 className="text-5xl text-green-400 mt-2">₹{balance}</h2>
        <p className="text-gray-400 mt-3">{user.email}</p>

        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-green-500 text-black py-4 rounded-full text-2xl font-bold mt-6"
        >
          ADD BALANCE
        </button>

        <button
          onClick={logout}
          className="w-full bg-red-500 py-3 rounded-full font-bold mt-4"
        >
          LOGOUT
        </button>
      </div>

      {showAdd && (
        <div className="mt-8 border border-pink-500 p-5 rounded-2xl bg-zinc-900 text-center">
          <h2 className="text-pink-500 text-5xl mb-5">Add Balance</h2>

          <img
            src="/qr.jpg"
            alt="QR"
            className="mx-auto rounded-xl w-[300px] h-[300px] object-cover"
          />

          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-4 rounded-xl text-black mt-5 text-2xl"
          />

          <input
            type="text"
            placeholder="Enter UTR Number"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            className="w-full p-4 rounded-xl text-black mt-5 text-2xl"
          />

          <button
            onClick={submitDeposit}
            className="w-full bg-pink-500 py-4 rounded-full text-2xl mt-5 text-white"
          >
            SUBMIT
          </button>

          <button
            onClick={() => setShowAdd(false)}
            className="w-full bg-red-500 py-4 rounded-full text-2xl mt-5 text-white"
          >
            CLOSE
          </button>
        </div>
      )}
    </main>
  );
}