"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";

import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

type Deposit = {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  amount?: number;
  utr?: string;
  status?: string;
};

export default function AdminPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    const q = query(collection(db, "deposits"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Deposit[];

      setDeposits(list);
    });

    return () => unsub();
  }, []);

  const approveDeposit = async (dep: Deposit) => {
    if (!dep.uid || !dep.amount) {
      alert("UID or amount missing");
      return;
    }

    await updateDoc(doc(db, "deposits", dep.id), {
      status: "approved",
    });

    await setDoc(
      doc(db, "wallets", dep.uid),
      {
        balance: increment(dep.amount),
        email: dep.email || "",
        name: dep.name || "User",
      },
      { merge: true }
    );

    alert("Deposit Approved ✅");
  };

  const rejectDeposit = async (id: string) => {
    await updateDoc(doc(db, "deposits", id), {
      status: "rejected",
    });

    alert("Deposit Rejected ❌");
  };

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <h1 className="text-5xl text-pink-500 font-bold mb-10">
        Admin Panel
      </h1>

      <h2 className="text-3xl text-green-400 mb-5">
        Add Balance Requests
      </h2>

      <div className="space-y-5">
        {deposits.map((dep) => (
          <div
            key={dep.id}
            className="border border-pink-500 p-5 rounded-2xl bg-zinc-900"
          >
            <h3 className="text-4xl font-bold">Amount: ₹{dep.amount}</h3>

            <p className="text-2xl mt-3">Name: {dep.name}</p>
            <p className="text-2xl mt-2">Email: {dep.email}</p>
            <p className="text-2xl mt-2">UTR: {dep.utr}</p>
            <p className="text-2xl mt-2">Status: {dep.status}</p>

            <div className="flex gap-4 mt-5">
              <button
                onClick={() => approveDeposit(dep)}
                disabled={dep.status === "approved"}
                className="bg-green-500 text-black px-6 py-3 rounded-full font-bold"
              >
                APPROVE
              </button>

              <button
                onClick={() => rejectDeposit(dep.id)}
                disabled={dep.status === "rejected"}
                className="bg-red-500 text-white px-6 py-3 rounded-full font-bold"
              >
                REJECT
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}