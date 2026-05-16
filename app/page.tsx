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
  const [showAdd, setShowAdd] = useState(true);

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
        utr: utr,
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
    <div className="min-h-screen bg-black flex items-center justify-center">
      {showAdd && (
        <div className="border border-pink-500 p-5 rounded-2xl bg-zinc-900 w-[350px] text-center">

          <h1 className="text-pink-500 text-5xl mb-5">
            Add Balance
          </h1>

          <Image
            src="/qr.jpeg"
            alt="QR"
            width={300}
            height={300}
            className="mx-auto rounded-xl"
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
    </div>
  );
}