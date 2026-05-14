"use client";

import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function Home() {
  const [showQR, setShowQR] = useState(false);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [utr, setUtr] = useState("");
  const [balance, setBalance] = useState(0);

  const handlePaid = async () => {
    if (!amount || !name || !utr) {
      alert("Name, Amount, UTR ellam enter pannunga");
      return;
    }

    await addDoc(collection(db, "balanceRequests"), {
      name,
      amount: Number(amount),
      utr,
      walletId: "mainUser",
      status: "pending",
      createdAt: new Date(),
    });

    alert("Payment request submitted ✅ Admin verify pannum");
    setShowQR(false);
    setAmount("");
    setName("");
    setUtr("");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-5">
      <h1 className="text-5xl font-bold text-pink-500">MY CHOICE PLAY</h1>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-pink-500 text-center w-full max-w-md">
        <h2 className="text-2xl text-zinc-400">Wallet Balance</h2>
        <h1 className="text-5xl font-bold text-green-400 mt-4">₹{balance}</h1>

        <button
          onClick={() => setShowQR(true)}
          className="mt-8 bg-green-500 px-8 py-4 rounded-full font-bold text-black"
        >
          ADD BALANCE
        </button>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm text-center border border-pink-500">
            <h2 className="text-3xl font-bold text-pink-500">Add Balance</h2>

            <input
              type="text"
              placeholder="Your Name"
              className="w-full mt-5 px-4 py-3 rounded bg-white text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Enter Amount"
              className="w-full mt-3 px-4 py-3 rounded bg-white text-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <img
              src="/qr.jpeg.jpeg"
              alt="Payment QR"
              className="w-64 h-64 object-contain mx-auto mt-5 bg-white rounded-xl p-3"
            />

            <input
              type="text"
              placeholder="Enter UTR / Transaction ID"
              className="w-full mt-4 px-4 py-3 rounded bg-white text-black"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />

            <button
              onClick={handlePaid}
              className="mt-5 bg-green-500 w-full py-3 rounded-full font-bold text-black"
            >
              I PAID
            </button>

            <button
              onClick={() => setShowQR(false)}
              className="mt-3 bg-red-500 w-full py-3 rounded-full font-bold"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </main>
  );
}