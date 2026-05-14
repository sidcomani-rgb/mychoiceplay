"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function AdminPage() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "balanceRequests"),
      (snapshot) => {
        const data: any[] = [];

        snapshot.forEach((docu) => {
          data.push({
            id: docu.id,
            ...docu.data(),
          });
        });

        setRequests(data);
      }
    );

    return () => unsub();
  }, []);

  const approveRequest = async (id: string) => {
    await updateDoc(doc(db, "balanceRequests", id), {
      status: "approved",
    });

    alert("Approved Successfully");
  };

  const rejectRequest = async (id: string) => {
    await updateDoc(doc(db, "balanceRequests", id), {
      status: "rejected",
    });

    alert("Rejected");
  };

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <h1 className="text-5xl font-bold text-pink-500 mb-10">
        Admin Panel
      </h1>

      <div className="flex flex-col gap-5">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-zinc-900 border border-pink-500 rounded-3xl p-8"
          >
            <h1 className="text-4xl font-bold">
              Amount: ₹{req.amount}
            </h1>

            <p className="mt-3 text-xl">
              Name: {req.name}
            </p>

            <p className="mt-2 text-xl">
              UTR: {req.utr}
            </p>

            <p className="mt-2 text-yellow-400 text-2xl">
              Status: {req.status}
            </p>

            <div className="flex gap-4 mt-5">
              <button
                onClick={() => approveRequest(req.id)}
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