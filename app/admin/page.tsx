"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");

    if (adminLoggedIn !== "true") {
      alert("PLEASE LOGIN FIRST");
      router.push("/admin-login");
      return;
    }

    setLoading(false);

    const unsubDeposit = onSnapshot(collection(db, "depositRequests"), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setDepositRequests(data);
    });

    const unsubWithdraw = onSnapshot(collection(db, "withdrawRequests"), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setWithdrawRequests(data);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });

    return () => {
      unsubDeposit();
      unsubWithdraw();
      unsubUsers();
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin-login");
  };

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

  const pendingDeposits = depositRequests.filter((item) => item.status === "pending");
  const pendingWithdraws = withdrawRequests.filter((item) => item.status === "pending");

  if (loading) {
    return (
      <div style={styles.loading}>LOADING...</div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>ADMIN PANEL 🔥</h1>

      <button onClick={handleLogout} style={styles.logoutBtn}>
        LOGOUT
      </button>

      <div style={styles.summaryBox}>
        <p>Total Users: {uniqueUsers.length}</p>
        <p>Pending Deposit Requests: {pendingDeposits.length}</p>
        <p>Pending Withdraw Requests: {pendingWithdraws.length}</p>
      </div>

      <h2 style={{ color: "#ff00aa" }}>Deposit Requests</h2>

      {depositRequests.map((item, index) => (
        <div key={index} style={styles.depositCard}>
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UTR ID: {item.utr}</p>
          <p>Status: <b style={{ color: getStatusColor(item.status) }}>{item.status}</b></p>

          {item.status === "pending" && (
            <div style={styles.btnRow}>
              <button onClick={() => approveDeposit(item)} style={styles.approveBtn}>
                APPROVE
              </button>
              <button onClick={() => rejectDeposit(item)} style={styles.rejectBtn}>
                REJECT
              </button>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ color: "yellow" }}>Withdraw Requests</h2>

      {withdrawRequests.map((item, index) => (
        <div key={index} style={styles.withdrawCard}>
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UPI ID: {item.upi}</p>
          <p>Status: <b style={{ color: getStatusColor(item.status) }}>{item.status}</b></p>

          {item.status === "pending" && (
            <div style={styles.btnRow}>
              <button onClick={() => approveWithdraw(item)} style={styles.withdrawApproveBtn}>
                APPROVE
              </button>
              <button onClick={() => rejectWithdraw(item)} style={styles.rejectBtn}>
                REJECT
              </button>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ color: "#00ff99" }}>Users List</h2>

      {uniqueUsers.map((user: any, index) => (
        <div key={index} style={styles.userCard}>
          <p>{user.name}</p>
          <p>{user.email}</p>
          <p>Balance: ₹{user.balance || 0}</p>
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string) {
  if (status === "approved") return "lime";
  if (status === "rejected") return "red";
  return "yellow";
}

const styles: any = {
  page: {
    background: "black",
    minHeight: "100vh",
    padding: "20px",
    color: "white",
  },
  loading: {
    background: "black",
    color: "white",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
  },
  title: {
    color: "#00e5ff",
    fontSize: "50px",
  },
  logoutBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    marginBottom: "25px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  summaryBox: {
    background: "#111",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "25px",
  },
  depositCard: {
    border: "2px solid #ff00aa",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
    background: "#050505",
  },
  withdrawCard: {
    border: "2px solid yellow",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
    background: "#050505",
  },
  userCard: {
    border: "2px solid #00ff99",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
    background: "#050505",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
  },
  approveBtn: {
    background: "lime",
    border: "none",
    padding: "12px 22px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  withdrawApproveBtn: {
    background: "orange",
    border: "none",
    padding: "12px 22px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  rejectBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "12px 22px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};