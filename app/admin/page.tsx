"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

export default function Home() {
  const [showQR, setShowQR] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [utr, setUtr] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upi, setUpi] = useState("");

  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);

  useEffect(() => {
    const unsubWallet = onSnapshot(doc(db, "wallets", "mainUser"), (snap) => {
      if (snap.exists()) setBalance(snap.data().balance || 0);
    });

    const unsubDeposit = onSnapshot(collection(db, "balanceRequests"), (snap) => {
      const data: any[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setDeposits(data);
    });

    const unsubWithdraw = onSnapshot(collection(db, "withdrawRequests"), (snap) => {
      const data: any[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setWithdraws(data);
    });

    return () => {
      unsubWallet();
      unsubDeposit();
      unsubWithdraw();
    };
  }, []);

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

    alert("Request Sent");
    setAmount("");
    setName("");
    setUtr("");
    setShowQR(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !upi) {
      alert("Withdraw amount and UPI enter pannunga");
      return;
    }

    if (Number(withdrawAmount) > balance) {
      alert("Insufficient Balance");
      return;
    }

    await addDoc(collection(db, "withdrawRequests"), {
      amount: Number(withdrawAmount),
      upi,
      walletId: "mainUser",
      status: "pending",
      createdAt: new Date(),
    });

    alert("Withdraw Request Sent");
    setWithdrawAmount("");
    setUpi("");
    setShowWithdraw(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center gap-8 p-5">
      <h1 className="text-5xl font-bold text-pink-500 mt-10">MY CHOICE PLAY</h1>

      <div className="bg-zinc-900 p-8 rounded-3xl border border-pink-500 text-center w-full max-w-md">
        <h2 className="text-2xl text-zinc-400">Wallet Balance</h2>
        <h1 className="text-5xl font-bold text-green-400 mt-4">₹{balance}</h1>

        <button onClick={() => setShowQR(true)} className="mt-8 bg-green-500 px-8 py-4 rounded-full font-bold text-black w-full">
          ADD BALANCE
        </button>

        <button onClick={() => setShowWithdraw(true)} className="mt-4 bg-pink-500 px-8 py-4 rounded-full font-bold text-white w-full">
          WITHDRAW
        </button>
      </div>

      <div className="w-full max-w-md bg-zinc-900 border border-pink-500 rounded-3xl p-5">
        <h2 className="text-3xl font-bold text-green-400">Deposit History</h2>
        {deposits.map((d) => (
          <div key={d.id} className="border-b border-zinc-700 py-3">
            <p>Amount: ₹{d.amount}</p>
            <p>Status: {d.status}</p>
            <p>UTR: {d.utr}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md bg-zinc-900 border border-pink-500 rounded-3xl p-5">
        <h2 className="text-3xl font-bold text-pink-500">Withdraw History</h2>
        {withdraws.map((w) => (
          <div key={w.id} className="border-b border-zinc-700 py-3">
            <p>Amount: ₹{w.amount}</p>
            <p>UPI: {w.upi}</p>
            <p>Status: {w.status}</p>
          </div>
        ))}
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm text-center border border-pink-500">
            <h2 className="text-3xl font-bold text-pink-500">Add Balance</h2>

            <input type="text" placeholder="Your Name" className="w-full mt-5 px-4 py-3 rounded bg-white text-black" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="number" placeholder="Enter Amount" className="w-full mt-3 px-4 py-3 rounded bg-white text-black" value={amount} onChange={(e) => setAmount(e.target.value)} />

            <img src="/qr.jpeg.jpeg" alt="Payment QR" className="w-64 h-64 object-contain mx-auto mt-5 bg-white rounded-xl p-3" />

            <input type="text" placeholder="Enter UTR / Transaction ID" className="w-full mt-4 px-4 py-3 rounded bg-white text-black" value={utr} onChange={(e) => setUtr(e.target.value)} />

            <button onClick={handlePaid} className="mt-5 bg-green-500 w-full py-3 rounded-full font-bold text-black">I PAID</button>
            <button onClick={() => setShowQR(false)} className="mt-3 bg-red-500 w-full py-3 rounded-full font-bold">CLOSE</button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm text-center border border-pink-500">
            <h2 className="text-3xl font-bold text-pink-500">Withdraw</h2>

            <input type="number" placeholder="Withdraw Amount" className="w-full mt-5 px-4 py-3 rounded bg-white text-black" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <input type="text" placeholder="Enter UPI ID" className="w-full mt-3 px-4 py-3 rounded bg-white text-black" value={upi} onChange={(e) => setUpi(e.target.value)} />

            <button onClick={handleWithdraw} className="mt-5 bg-pink-500 w-full py-3 rounded-full font-bold">REQUEST WITHDRAW</button>
            <button onClick={() => setShowWithdraw(false)} className="mt-3 bg-red-500 w-full py-3 rounded-full font-bold">CLOSE</button>
          </div>
        </div>
      )}
    </main>
  );
}