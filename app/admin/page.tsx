"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type UserData = {
  id: string;
  name?: string;
  email?: string;
  balance?: number;
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];

      setUsers(list);
    });

    return () => unsub();
  }, []);

  const totalBalance = users.reduce(
    (total, user) => total + Number(user.balance || 0),
    0
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-cyan-400 text-6xl font-bold">ADMIN PANEL 🔥</h1>

      <div className="bg-zinc-900 p-8 rounded-2xl mt-8">
        <h2 className="text-2xl">Total Users: {users.length}</h2>
        <h2 className="text-2xl mt-2">Total Balance: ₹{totalBalance}</h2>
      </div>

      <h2 className="text-pink-500 text-4xl font-bold mt-10">Users List</h2>

      <div className="mt-6 grid gap-5">
        {users.map((user) => (
          <div key={user.id} className="bg-zinc-900 p-6 rounded-2xl border border-pink-500">
            <h3 className="text-2xl font-bold">{user.name || "No Name"}</h3>
            <p className="text-xl mt-2">{user.email}</p>
            <p className="text-3xl text-green-400 mt-4">
              Balance: ₹{user.balance || 0}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}