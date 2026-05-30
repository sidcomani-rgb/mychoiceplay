"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);

  const [depositAmount, setDepositAmount] = useState("");
  const [utr, setUtr] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upi, setUpi] = useState("");

  const [history, setHistory] = useState<any[]>([]);

  const ADMIN_EMAIL = "manidesigner8489@gmail.com";

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);

      const userRef = doc(db, "users", currentUser.email!);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          name: currentUser.displayName,
          email: currentUser.email,
          balance: 0,
        });
      }

      onSnapshot(userRef, (s) => {
        if (s.exists()) setBalance(Number(s.data().balance || 0));
      });

      const dq = query(
        collection(db, "depositRequests"),
        where("email", "==", currentUser.email)
      );

      const wq = query(
        collection(db, "withdrawRequests"),
        where("email", "==", currentUser.email)
      );

      onSnapshot(dq, (depositSnap) => {
        const deposits = depositSnap.docs.map((d) => ({
          id: d.id,
          type: "DEPOSIT",
          ...d.data(),
        }));

        onSnapshot(wq, (withdrawSnap) => {
          const withdraws = withdrawSnap.docs.map((d) => ({
            id: d.id,
            type: "WITHDRAW",
            ...d.data(),
          }));

          setHistory(
            [...deposits, ...withdraws].sort(
              (a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
            )
          );
        });
      });
    });

    return () => unsubAuth();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("LOGIN SUCCESS ✅");
    } catch (error: any) {
      alert(error.code || "LOGIN FAILED ❌");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendDeposit = async () => {
    if (!user) return;

    if (!depositAmount || !utr) {
      alert("ENTER DEPOSIT DETAILS ❌");
      return;
    }

    await addDoc(collection(db, "depositRequests"), {
      name: user.displayName,
      email: user.email,
      amount: Number(depositAmount),
      utr,
      status: "pending",
      createdAt: Date.now(),
    });

    setDepositAmount("");
    setUtr("");

    alert("DEPOSIT REQUEST SENT ✅");
  };

  const sendWithdraw = async () => {
    if (!user) return;

    if (!withdrawAmount || !upi) {
      alert("ENTER WITHDRAW DETAILS ❌");
      return;
    }

    if (Number(withdrawAmount) > balance) {
      alert("INSUFFICIENT BALANCE ❌");
      return;
    }

    await addDoc(collection(db, "withdrawRequests"), {
      name: user.displayName,
      email: user.email,
      amount: Number(withdrawAmount),
      upi,
      status: "pending",
      createdAt: Date.now(),
    });

    setWithdrawAmount("");
    setUpi("");

    alert("WITHDRAW REQUEST SENT ✅");
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "lime";
    if (status === "rejected") return "red";
    return "yellow";
  };

  const formatDate = (time: any) => {
    if (!time) return "-";
    return new Date(Number(time)).toLocaleString();
  };

  if (!user) {
    return (
      <div style={styles.loginPage}>
        <h1 style={styles.title}>MY CHOICE PLAY</h1>

        <button onClick={login} style={styles.loginBtn}>
          LOGIN WITH GOOGLE
        </button>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>MY CHOICE PLAY</h1>

      <section style={styles.card}>
        <p>Welcome, {user.displayName}</p>
        <p>{user.email}</p>

        <h1 style={styles.balance}>Balance: ₹{balance}</h1>

        <div style={styles.grid}>
          <div style={styles.depositBox}>
            <h3 style={{ color: "#ff1493" }}>Add Balance Request</h3>

            <input
              placeholder="Enter Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Enter UTR Number"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              style={styles.input}
            />

            <button onClick={sendDeposit} style={styles.depositBtn}>
              SEND DEPOSIT
            </button>
          </div>

          <div style={styles.withdrawBox}>
            <h3 style={{ color: "gold" }}>Withdraw Request</h3>

            <input
              placeholder="Withdraw Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Enter UPI ID"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              style={styles.input}
            />

            <button onClick={sendWithdraw} style={styles.withdrawBtn}>
              SEND WITHDRAW
            </button>
          </div>
        </div>

        <h2 style={styles.historyTitle}>TRANSACTION HISTORY</h2>

        {history.length === 0 ? (
          <p>No Transactions</p>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              style={{
                ...styles.historyCard,
                borderColor: item.type === "DEPOSIT" ? "#ff1493" : "gold",
              }}
            >
              <h3>{item.type}</h3>
              <p>Amount: ₹{item.amount}</p>

              {item.type === "DEPOSIT" ? (
                <p>UTR: {item.utr}</p>
              ) : (
                <p>UPI: {item.upi}</p>
              )}

              <p>
                Status:{" "}
                <b style={{ color: statusColor(item.status) }}>
                  {item.status}
                </b>
              </p>

              <p>Date: {formatDate(item.createdAt)}</p>
            </div>
          ))
        )}

        <div style={styles.btnRow}>
          {user.email === ADMIN_EMAIL && (
            <button
              onClick={() => (window.location.href = "/admin")}
              style={styles.adminBtn}
            >
              ADMIN
            </button>
          )}

          <button onClick={logout} style={styles.logoutBtn}>
            LOGOUT
          </button>
        </div>
      </section>
    </main>
  );
}

const styles: any = {
  loginPage: {
    background: "black",
    minHeight: "100vh",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    background: "black",
    minHeight: "100vh",
    color: "white",
    padding: "20px",
  },
  title: {
    color: "#ff1493",
    fontSize: "60px",
    fontWeight: "bold",
  },
  loginBtn: {
    padding: "20px 45px",
    fontSize: "28px",
    borderRadius: "50px",
    border: "3px solid white",
    background: "black",
    color: "white",
    cursor: "pointer",
  },
  card: {
    background: "#111",
    padding: "25px",
    borderRadius: "20px",
    marginTop: "20px",
  },
  balance: {
    color: "#00ff99",
    fontSize: "55px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  depositBox: {
    border: "2px solid #ff1493",
    padding: "20px",
    borderRadius: "20px",
  },
  withdrawBox: {
    border: "2px solid gold",
    padding: "20px",
    borderRadius: "20px",
  },
  input: {
    width: "100%",
    padding: "15px",
    marginTop: "15px",
    background: "#000",
    color: "white",
    border: "1px solid gray",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  depositBtn: {
    marginTop: "20px",
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "#ff1493",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  withdrawBtn: {
    marginTop: "20px",
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "gold",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
  },
  historyTitle: {
    color: "#00e5ff",
    marginTop: "35px",
  },
  historyCard: {
    border: "2px solid",
    padding: "18px",
    borderRadius: "15px",
    marginTop: "15px",
    background: "#050505",
  },
  btnRow: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
  },
  adminBtn: {
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "#00e5ff",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
  },
  logoutBtn: {
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "red",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};