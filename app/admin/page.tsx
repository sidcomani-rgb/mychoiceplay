"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";

import { onAuthStateChanged, signOut } from "firebase/auth";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const ADMIN_EMAIL = "manidesigner8489@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert("LOGIN FIRST");
        window.location.href = "/";
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        alert("ACCESS DENIED ❌");
        window.location.href = "/";
        return;
      }

      setLoading(false);

      onSnapshot(collection(db, "depositRequests"), (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setDepositRequests(data);
      });

      onSnapshot(collection(db, "withdrawRequests"), (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setWithdrawRequests(data);
      });

      onSnapshot(collection(db, "users"), (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setUsers(data);
      });
    });

    return () => unsubscribe();
  }, []);

  const approveDeposit = async (request: any) => {
    const userRef = doc(db, "users", request.email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("USER NOT FOUND ❌");
      return;
    }

    const currentBalance = Number(userSnap.data().balance || 0);
    const depositAmount = Number(request.amount || 0);

    await updateDoc(userRef, {
      balance: currentBalance + depositAmount,
    });

    await updateDoc(doc(db, "depositRequests", request.id), {
      status: "approved",
    });

    alert("DEPOSIT APPROVED ✅");
  };

  const rejectDeposit = async (request: any) => {
    await updateDoc(doc(db, "depositRequests", request.id), {
      status: "rejected",
    });

    alert("DEPOSIT REJECTED ❌");
  };

  const approveWithdraw = async (request: any) => {
    const userRef = doc(db, "users", request.email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("USER NOT FOUND ❌");
      return;
    }

    const currentBalance = Number(userSnap.data().balance || 0);
    const withdrawAmount = Number(request.amount || 0);

    if (currentBalance < withdrawAmount) {
      alert("LOW BALANCE ❌");
      return;
    }

    await updateDoc(userRef, {
      balance: currentBalance - withdrawAmount,
    });

    await updateDoc(doc(db, "withdrawRequests", request.id), {
      status: "approved",
    });

    alert("WITHDRAW APPROVED ✅");
  };

  const rejectWithdraw = async (request: any) => {
    await updateDoc(doc(db, "withdrawRequests", request.id), {
      status: "rejected",
    });

    alert("WITHDRAW REJECTED ❌");
  };

  const uniqueUsers = Array.from(
    new Map(users.map((user) => [user.email, user])).values()
  );

  const pendingDeposits = depositRequests.filter(
    (item) => item.status === "pending"
  );

  const pendingWithdraws = withdrawRequests.filter(
    (item) => item.status === "pending"
  );

  if (loading) {
    return (
      <div
        style={{
          background: "black",
          color: "white",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "30px",
        }}
      >
        LOADING...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "black",
        minHeight: "100vh",
        padding: "20px",
        color: "white",
      }}
    >
      <h1 style={{ color: "#00e5ff", fontSize: "50px" }}>
        ADMIN PANEL 🔥
      </h1>

      <button
        onClick={() => signOut(auth)}
        style={{
          background: "red",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "12px",
          marginBottom: "25px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        LOGOUT
      </button>

      <div
        style={{
          background: "#111",
          borderRadius: "18px",
          padding: "20px",
          marginBottom: "25px",
        }}
      >
        <p>Total Users: {uniqueUsers.length}</p>
        <p>Pending Deposit Requests: {pendingDeposits.length}</p>
        <p>Pending Withdraw Requests: {pendingWithdraws.length}</p>
      </div>

      <h2 style={{ color: "#ff00aa" }}>Deposit Requests</h2>

      {depositRequests.map((item, index) => (
        <div
          key={index}
          style={{
            border: "2px solid #ff00aa",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "20px",
            background: "#050505",
          }}
        >
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UTR ID: {item.utr}</p>
          <p>
            Status:{" "}
            <span
              style={{
                color:
                  item.status === "approved"
                    ? "lime"
                    : item.status === "rejected"
                    ? "red"
                    : "yellow",
              }}
            >
              {item.status}
            </span>
          </p>

          {item.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => approveDeposit(item)}
                style={{
                  background: "lime",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                APPROVE
              </button>

              <button
                onClick={() => rejectDeposit(item)}
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                REJECT
              </button>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ color: "yellow" }}>Withdraw Requests</h2>

      {withdrawRequests.map((item, index) => (
        <div
          key={index}
          style={{
            border: "2px solid yellow",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "20px",
            background: "#050505",
          }}
        >
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UPI ID: {item.upi}</p>
          <p>
            Status:{" "}
            <span
              style={{
                color:
                  item.status === "approved"
                    ? "lime"
                    : item.status === "rejected"
                    ? "red"
                    : "yellow",
              }}
            >
              {item.status}
            </span>
          </p>

          {item.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => approveWithdraw(item)}
                style={{
                  background: "orange",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                APPROVE
              </button>

              <button
                onClick={() => rejectWithdraw(item)}
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                REJECT
              </button>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ color: "#00ff99" }}>Users List</h2>

      {uniqueUsers.map((user: any, index) => (
        <div
          key={index}
          style={{
            border: "2px solid #00ff99",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "20px",
            background: "#050505",
          }}
        >
          <p>{user.name}</p>
          <p>{user.email}</p>
          <p>Balance: ₹{user.balance || 0}</p>
        </div>
      ))}
    </div>
  );
}