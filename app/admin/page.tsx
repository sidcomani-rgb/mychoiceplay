"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  increment,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AdminPage() {
  const [logged, setLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!logged) return;

    const unsub = onSnapshot(
      collection(db, "balanceRequests"),
      (snapshot) => {
        const data: any[] = [];

        snapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setRequests(data);
      }
    );

    return () => unsub();
  }, [logged]);

  const loginAdmin = () => {
    if (password === "mani123") {
      setLogged(true);
    } else {
      alert("Wrong Password");
    }
  };

  const approveRequest = async (req: any) => {
  await setDoc(
    doc(db, "wallets", req.walletId || "mainUser"),
    {
      balance: increment(Number(req.amount)),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "balanceRequests", req.id), {
    status: "approved",
  });

  alert("Approved & Balance Added ✅");
};

  const rejectRequest = async (id: string) => {
    await updateDoc(doc(db, "balanceRequests", id), {
      status: "rejected",
    });

    alert("Rejected");
  };

  if (!logged) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-5">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-pink-500 w-full max-w-sm">
          <h1 className="text-4xl font-bold text-pink-500 text-center">
            ADMIN LOGIN
          </h1>

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-6 px-4 py-3 rounded-xl bg-white text-black"
          />

          <button
            onClick={loginAdmin}
            className="w-full mt-5 bg-green-500 text-black py-3 rounded-full font-bold"
          >
            LOGIN
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <h1 className="text-6xl font-bold text-pink-500 mb-10">
        Admin Panel
      </h1>

      <div className="space-y-5">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-zinc-900 border border-pink-500 rounded-3xl p-8"
          >
            <h1 className="text-5xl font-bold">
              Amount: ₹{req.amount}
            </h1>

            <p className="text-3xl mt-4">
              Status: {req.status}
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => approveRequest(req)}
                className="bg-green-500 text-black px-5 py-2 rounded-full font-bold"
              >
                APPROVE
              </button>

              <button
                onClick={() => rejectRequest(req.id)}
                className="bg-red-500 px-5 py-2 rounded-full font-bold"
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