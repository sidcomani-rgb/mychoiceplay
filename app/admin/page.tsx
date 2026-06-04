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

const ROUND_TIME = 5 * 60;

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [currentRoundBets, setCurrentRoundBets] = useState(0);
  const [redTotal, setRedTotal] = useState(0);
  const [greenTotal, setGreenTotal] = useState(0);
  const [pinkTotal, setPinkTotal] = useState(0);

  const getCurrentRoundId = () =>
    Math.floor(Date.now() / (ROUND_TIME * 1000)).toString();

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");

    if (adminLoggedIn !== "true") {
      alert("PLEASE LOGIN FIRST");
      router.push("/admin-login");
      return;
    }

    setLoading(false);

    const unsubDeposit = onSnapshot(collection(db, "depositRequests"), (snap) => {
      const data: any[] = [];
      let total = 0;

      snap.forEach((d) => {
        const item: any = { id: d.id, ...d.data() };
        data.push(item);
        if (item.status === "approved") total += Number(item.amount || 0);
      });

      setDepositRequests(
        data.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
      );
      setTotalDeposits(total);
    });

    const unsubWithdraw = onSnapshot(collection(db, "withdrawRequests"), (snap) => {
      const data: any[] = [];
      let total = 0;

      snap.forEach((d) => {
        const item: any = { id: d.id, ...d.data() };
        data.push(item);
        if (item.status === "approved") total += Number(item.amount || 0);
      });

      setWithdrawRequests(
        data.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
      );
      setTotalWithdrawals(total);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const data: any[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setUsers(data);
    });

    const unsubBets = onSnapshot(collection(db, "bets"), (snap) => {
      const data: any[] = [];
      let currentTotal = 0;
      let r = 0;
      let g = 0;
      let p = 0;

      const currentRoundId = getCurrentRoundId();

      snap.forEach((d) => {
        const item: any = { id: d.id, ...d.data() };
        data.push(item);

        if (item.status === "pending" && item.roundId === currentRoundId) {
          const amt = Number(item.amount || 0);
          currentTotal += amt;

          if (item.color === "RED") r += amt;
          if (item.color === "GREEN") g += amt;
          if (item.color === "PINK") p += amt;
        }
      });

      setBets(data.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      setCurrentRoundBets(currentTotal);
      setRedTotal(r);
      setGreenTotal(g);
      setPinkTotal(p);
    });

    const unsubResults = onSnapshot(collection(db, "results"), (snap) => {
      const data: any[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setResults(data.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
    });

    return () => {
      unsubDeposit();
      unsubWithdraw();
      unsubUsers();
      unsubBets();
      unsubResults();
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin-login");
  };

  const approveDeposit = async (request: any) => {
    if (request.status !== "pending") return alert("ALREADY UPDATED ❌");

    const userRef = doc(db, "users", request.email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return alert("USER NOT FOUND ❌");

    await updateDoc(userRef, {
      balance: Number(userSnap.data().balance || 0) + Number(request.amount || 0),
    });

    await updateDoc(doc(db, "depositRequests", request.id), {
      status: "approved",
    });

    alert("DEPOSIT APPROVED ✅");
  };

  const rejectDeposit = async (request: any) => {
    if (request.status !== "pending") return alert("ALREADY UPDATED ❌");

    await updateDoc(doc(db, "depositRequests", request.id), {
      status: "rejected",
    });

    alert("DEPOSIT REJECTED ❌");
  };

  const approveWithdraw = async (request: any) => {
    if (request.status !== "pending") return alert("ALREADY UPDATED ❌");

    const userRef = doc(db, "users", request.email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return alert("USER NOT FOUND ❌");

    const currentBalance = Number(userSnap.data().balance || 0);
    const withdrawAmount = Number(request.amount || 0);

    if (currentBalance < withdrawAmount) return alert("LOW BALANCE ❌");

    await updateDoc(userRef, {
      balance: currentBalance - withdrawAmount,
    });

    await updateDoc(doc(db, "withdrawRequests", request.id), {
      status: "approved",
    });

    alert("WITHDRAW APPROVED ✅");
  };

  const rejectWithdraw = async (request: any) => {
    if (request.status !== "pending") return alert("ALREADY UPDATED ❌");

    await updateDoc(doc(db, "withdrawRequests", request.id), {
      status: "rejected",
    });

    alert("WITHDRAW REJECTED ❌");
  };

  const uniqueUsers = Array.from(new Map(users.map((u) => [u.email, u])).values());
  const pendingDeposits = depositRequests.filter((x) => x.status === "pending");
  const pendingWithdraws = withdrawRequests.filter((x) => x.status === "pending");
  const recentDeposits = depositRequests.filter((x) => x.status !== "pending").slice(0, 5);
  const recentWithdraws = withdrawRequests.filter((x) => x.status !== "pending").slice(0, 5);
  const profit = totalDeposits - totalWithdrawals;

  if (loading) return <div style={styles.loading}>LOADING...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>ADMIN PANEL 🔥</h1>

      <button onClick={handleLogout} style={styles.logoutBtn}>
        LOGOUT
      </button>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Total Users</h3>
          <h1>{uniqueUsers.length}</h1>
        </div>

        <div style={styles.statCard}>
          <h3>Total Deposits</h3>
          <h1>₹{totalDeposits}</h1>
        </div>

        <div style={styles.statCard}>
          <h3>Total Withdrawals</h3>
          <h1>₹{totalWithdrawals}</h1>
        </div>

        <div style={styles.statCard}>
          <h3>Total Profit</h3>
          <h1 style={{ color: profit >= 0 ? "lime" : "red" }}>₹{profit}</h1>
        </div>
      </div>

      <div style={styles.roundBox}>
        <h2>Current Round Monitor</h2>
        <p>Round ID: {getCurrentRoundId()}</p>
        <h3>Total Current Bets: ₹{currentRoundBets}</h3>

        <div style={styles.colorGrid}>
          <div style={styles.redBox}>RED: ₹{redTotal}</div>
          <div style={styles.greenBox}>GREEN: ₹{greenTotal}</div>
          <div style={styles.pinkBox}>PINK: ₹{pinkTotal}</div>
        </div>
      </div>

      <h2 style={{ color: "cyan" }}>Live Bet Monitor</h2>

      <div style={styles.liveBetBox}>
        {bets.length === 0 ? (
          <p>No bets yet</p>
        ) : (
          bets.slice(0, 10).map((bet) => (
            <div key={bet.id} style={styles.liveBetCard}>
              <p><b>Round:</b> {bet.roundId}</p>
              <p><b>User:</b> {bet.name}</p>
              <p><b>Email:</b> {bet.email}</p>
              <p><b>Color:</b> {bet.color}</p>
              <p><b>Amount:</b> ₹{bet.amount}</p>
              <p>
                <b>Status:</b>{" "}
                <span style={{ color: getBetStatusColor(bet.status) }}>
                  {bet.status}
                </span>
              </p>
              <p><b>Result:</b> {bet.result || "-"}</p>
            </div>
          ))
        )}
      </div>

      <div style={styles.summaryBox}>
        <p>Total Users: {uniqueUsers.length}</p>
        <p>Pending Deposit Requests: {pendingDeposits.length}</p>
        <p>Pending Withdraw Requests: {pendingWithdraws.length}</p>
      </div>

      <h2 style={{ color: "#ff00aa" }}>Pending Deposit Requests</h2>

      {pendingDeposits.length === 0 && <p>No pending deposit requests ✅</p>}

      {pendingDeposits.map((item) => (
        <div key={item.id} style={styles.depositCard}>
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UTR ID: {item.utr}</p>
          <p>
            Status: <b style={{ color: getStatusColor(item.status) }}>{item.status}</b>
          </p>

          <div style={styles.btnRow}>
            <button onClick={() => approveDeposit(item)} style={styles.approveBtn}>
              APPROVE
            </button>
            <button onClick={() => rejectDeposit(item)} style={styles.rejectBtn}>
              REJECT
            </button>
          </div>
        </div>
      ))}

      <h2 style={{ color: "yellow" }}>Pending Withdraw Requests</h2>

      {pendingWithdraws.length === 0 && <p>No pending withdraw requests ✅</p>}

      {pendingWithdraws.map((item) => (
        <div key={item.id} style={styles.withdrawCard}>
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UPI ID: {item.upi}</p>
          <p>
            Status: <b style={{ color: getStatusColor(item.status) }}>{item.status}</b>
          </p>

          <div style={styles.btnRow}>
            <button onClick={() => approveWithdraw(item)} style={styles.withdrawApproveBtn}>
              APPROVE
            </button>
            <button onClick={() => rejectWithdraw(item)} style={styles.rejectBtn}>
              REJECT
            </button>
          </div>
        </div>
      ))}

      <h2 style={{ color: "#ff00aa" }}>Recent Deposits</h2>

      {recentDeposits.map((item) => (
        <div key={item.id} style={styles.depositCard}>
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UTR ID: {item.utr}</p>
          <p>
            Status: <b style={{ color: getStatusColor(item.status) }}>{item.status}</b>
          </p>
        </div>
      ))}

      <h2 style={{ color: "yellow" }}>Recent Withdrawals</h2>

      {recentWithdraws.map((item) => (
        <div key={item.id} style={styles.withdrawCard}>
          <p>Amount: ₹{item.amount}</p>
          <p>Name: {item.name}</p>
          <p>Email: {item.email}</p>
          <p>UPI ID: {item.upi}</p>
          <p>
            Status: <b style={{ color: getStatusColor(item.status) }}>{item.status}</b>
          </p>
        </div>
      ))}

      <h2 style={{ color: "lime" }}>Result History</h2>

      {results.slice(0, 20).map((r) => (
        <div key={r.id} style={styles.resultCard}>
          <p>Round: {r.roundId}</p>
          <p>
            Winner: <b style={{ color: "lime" }}>{r.winner}</b>
          </p>
          <p>RED Total: ₹{r.totalRed || 0}</p>
          <p>GREEN Total: ₹{r.totalGreen || 0}</p>
          <p>PINK Total: ₹{r.totalPink || 0}</p>
          <p>Date: {new Date(Number(r.createdAt)).toLocaleString()}</p>
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

function getBetStatusColor(status: string) {
  if (status === "win") return "lime";
  if (status === "loss") return "red";
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    background: "#111",
    padding: "20px",
    borderRadius: "15px",
    border: "2px solid cyan",
    color: "white",
  },
  roundBox: {
    background: "#111",
    padding: "20px",
    borderRadius: "15px",
    border: "2px solid orange",
    marginBottom: "30px",
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
    gap: "15px",
  },
  redBox: {
    background: "red",
    padding: "18px",
    borderRadius: "12px",
    fontWeight: "bold",
    textAlign: "center",
  },
  greenBox: {
    background: "green",
    padding: "18px",
    borderRadius: "12px",
    fontWeight: "bold",
    textAlign: "center",
  },
  pinkBox: {
    background: "pink",
    color: "black",
    padding: "18px",
    borderRadius: "12px",
    fontWeight: "bold",
    textAlign: "center",
  },
  liveBetBox: {
    border: "2px solid cyan",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "30px",
    background: "#111",
  },
  liveBetCard: {
    border: "1px solid #333",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    background: "#050505",
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
  resultCard: {
    border: "2px solid lime",
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