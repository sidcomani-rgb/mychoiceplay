"use client";

import { useState } from "react";
import Image from "next/image";

import { db } from "./firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Home() {
  const [balance] = useState(1370);

  const [showAdd, setShowAdd] = useState(false);

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");

  const submitDeposit = async () => {
    if (!amount || !utr) {
      alert("Enter amount and UTR");
      return;
    }

    try {
      await addDoc(collection(db, "deposits"), {
        name: "Sanghavi",
        amount: Number(amount),
        utr,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Deposit Request Sent ✅");

      setAmount("");
      setUtr("");
      setShowAdd(false);
    } catch (error) {
      console.log(error);
      alert("Error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-6xl text-pink-500 font-bold mt-10 text-center">
        MY CHOICE PLAY
      </h1>

      <div className="bg-zinc-900 border border-pink-500 rounded-3xl p-8 mt-10 w-full max-w-md">
        <h2 className="text-4xl text-center text-gray-300">
          Wallet Balance
        </h2>

        <h1 className="text-7xl text-green-400 text-center mt-6 font-bold">
          ₹{balance}
        </h1>

        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-green-500 text-black py-5 rounded-full text-3xl font-bold mt-10"
        >
          ADD BALANCE
        </button>

        <button className="w-full bg-pink-500 text-white py-5 rounded-full text-3xl font-bold mt-6">
          WITHDRAW
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5">
          <div className="bg-zinc-900 border border-pink-500 rounded-3xl p-8 w-full max-w-md">
            <h1 className="text-5xl text-pink-500 text-center font-bold">
              Add Balance
            </h1>

            <div className="flex justify-center mt-8">
              <Image
                src="/qr.jpeg.jpeg"
                alt="QR"
                width={250}
                height={250}
                className="rounded-2xl"
              />
            </div>

            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 rounded-xl text-black mt-8 text-2xl"
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
              className="w-full bg-pink-500 py-4 rounded-full text-2xl font-bold mt-8"
            >
              SUBMIT
            </button>

            <button
              onClick={() => setShowAdd(false)}
              className="w-full bg-red-500 py-4 rounded-full text-2xl font-bold mt-5"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}