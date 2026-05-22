"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);

  // LOAD DATA
  const loadData = async () => {
    // USERS
    const usersSnap = await getDocs(collection(db, "users"));

    const usersData: any[] = [];

    usersSnap.forEach((docu) => {
      usersData.push({
        id: docu.id,
        ...docu.data(),
      });
    });

    setUsers(usersData);

    // WITHDRAW REQUESTS
    const withdrawSnap = await getDocs(
      collection(db, "withdrawRequests")
    );

    const withdrawData: any[] = [];

    withdrawSnap.forEach((docu) => {
      withdrawData.push({
        id: docu.id,
        ...docu.data(),
      });
    });

    setWithdrawRequests(withdrawData);

    // DEPOSIT REQUESTS
    const depositSnap = await getDocs(
      collection(db, "depositRequests")
    );

    const depositData: any[] = [];

    depositSnap.forEach((docu) => {
      depositData.push({
        id: docu.id,
        ...docu.data(),
      });
    });

    setDepositRequests(depositData);
  };

  useEffect(() => {
    loadData();
  }, []);

  // APPROVE DEPOSIT
  const approveDeposit = async (request: any) => {
    // UPDATE REQUEST STATUS
    await updateDoc(
      doc(db, "depositRequests", request.id),
      {
        status: "approved",
      }
    );

    // FIND USER
    const user = users.find(
      (u) => u.email === request.email
    );

    if (user) {
      await updateDoc(doc(db, "users", user.id), {
        balance:
          Number(user.balance || 0) +
          Number(request.amount || 0),
      });
    }

    alert("DEPOSIT APPROVED ✅");

    loadData();
  };

  // REJECT DEPOSIT
  const rejectDeposit = async (request: any) => {
    await updateDoc(
      doc(db, "depositRequests", request.id),
      {
        status: "rejected",
      }
    );

    alert("DEPOSIT REJECTED ❌");

    loadData();
  };

  // APPROVE WITHDRAW
  const approveWithdraw = async (request: any) => {
    await updateDoc(
      doc(db, "withdrawRequests", request.id),
      {
        status: "approved",
      }
    );

    const user = users.find(
      (u) => u.email === request.email
    );

    if (user) {
      await updateDoc(doc(db, "users", user.id), {
        balance:
          Number(user.balance || 0) -
          Number(request.amount || 0),
      });
    }

    alert("WITHDRAW APPROVED ✅");

    loadData();
  };

  // REJECT WITHDRAW
  const rejectWithdraw = async (request: any) => {
    await updateDoc(
      doc(db, "withdrawRequests", request.id),
      {
        status: "rejected",
      }
    );

    alert("WITHDRAW REJECTED ❌");

    loadData();
  };

  const pendingWithdraws = withdrawRequests.filter(
    (r) => r.status === "pending"
  );

  const pendingDeposits = depositRequests.filter(
    (r) => r.status === "pending"
  );

  const totalBalance = users.reduce(
    (sum, user) =>
      sum + Number(user.balance || 0),
    0
  );

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        padding: "30px",
        color: "white",
      }}
    >
      <h1
        style={{
          color: "#00e5ff",
          fontSize: "60px",
          fontWeight: "bold",
        }}
      >
        ADMIN PANEL 🔥
      </h1>

      {/* TOP CARD */}
      <div
        style={{
          background: "#111",
          padding: "25px",
          borderRadius: "20px",
          marginTop: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>Total Users: {users.length}</h2>

        <h2>Total Balance: ₹{totalBalance}</h2>

        <h2>
          Pending Withdraw Requests:{" "}
          {pendingWithdraws.length}
        </h2>

        <h2>
          Pending Deposit Requests:{" "}
          {pendingDeposits.length}
        </h2>
      </div>

      {/* DEPOSIT REQUESTS */}
      <h1
        style={{
          color: "#ff00aa",
          marginBottom: "20px",
        }}
      >
        Deposit Requests
      </h1>

      {pendingDeposits.length === 0 ? (
        <div
          style={{
            background: "#111",
            padding: "20px",
            borderRadius: "15px",
            border: "1px solid #ff00aa",
            marginBottom: "40px",
          }}
        >
          No pending deposit requests ✅
        </div>
      ) : (
        pendingDeposits.map((req, index) => (
          <div
            key={index}
            style={{
              background: "#111",
              padding: "20px",
              borderRadius: "15px",
              border: "1px solid #ff00aa",
              marginBottom: "20px",
            }}
          >
            <h1>Amount: ₹{req.amount}</h1>

            <p>Name: {req.name}</p>

            <p>Email: {req.email}</p>

            <p>UTR ID: {req.utr}</p>

            <p>Status: {req.status}</p>

            <button
              onClick={() =>
                approveDeposit(req)
              }
              style={{
                background: "lime",
                color: "#000",
                border: "none",
                padding: "12px 25px",
                borderRadius: "10px",
                fontWeight: "bold",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              APPROVE
            </button>

            <button
              onClick={() =>
                rejectDeposit(req)
              }
              style={{
                background: "red",
                color: "#fff",
                border: "none",
                padding: "12px 25px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              REJECT
            </button>
          </div>
        ))
      )}

      {/* WITHDRAW REQUESTS */}
      <h1
        style={{
          color: "gold",
          marginBottom: "20px",
        }}
      >
        Withdraw Requests
      </h1>

      {pendingWithdraws.length === 0 ? (
        <div
          style={{
            background: "#111",
            padding: "20px",
            borderRadius: "15px",
            border: "1px solid gold",
            marginBottom: "40px",
          }}
        >
          No pending withdraw requests ✅
        </div>
      ) : (
        pendingWithdraws.map((req, index) => (
          <div
            key={index}
            style={{
              background: "#111",
              padding: "20px",
              borderRadius: "15px",
              border: "1px solid gold",
              marginBottom: "20px",
            }}
          >
            <h1>Amount: ₹{req.amount}</h1>

            <p>Name: {req.name}</p>

            <p>Email: {req.email}</p>

            <p>UPI ID: {req.upi}</p>

            <p>Status: {req.status}</p>

            <button
              onClick={() =>
                approveWithdraw(req)
              }
              style={{
                background: "lime",
                color: "#000",
                border: "none",
                padding: "12px 25px",
                borderRadius: "10px",
                fontWeight: "bold",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              APPROVE
            </button>

            <button
              onClick={() =>
                rejectWithdraw(req)
              }
              style={{
                background: "red",
                color: "#fff",
                border: "none",
                padding: "12px 25px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              REJECT
            </button>
          </div>
        ))
      )}

      {/* USERS */}
      <h1
        style={{
          color: "#ff00aa",
          marginTop: "40px",
          marginBottom: "20px",
        }}
      >
        Users List
      </h1>

      {users.map((user, index) => (
        <div
          key={index}
          style={{
            background: "#111",
            padding: "20px",
            borderRadius: "15px",
            border: "1px solid #ff00aa",
            marginBottom: "20px",
          }}
        >
          <h2>{user.name}</h2>

          <p>{user.email}</p>

          <h1
            style={{
              color: "#00ff88",
            }}
          >
            Balance: ₹{user.balance || 0}
          </h1>
        </div>
      ))}
    </div>
  );
}