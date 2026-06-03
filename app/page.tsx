"use client";

import { useEffect, useRef, useState } from "react";
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
  updateDoc,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

const ROUND_TIME = 5 * 60;

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [betAmount, setBetAmount] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [bets, setBets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);

  const autoResultRoundRef = useRef("");
  const ADMIN_EMAIL = "manidesigner8489@gmail.com";

  const getCurrentRoundId = () =>
    Math.floor(Date.now() / (ROUND_TIME * 1000)).toString();

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
              (a: any, b: any) =>
                Number(b.createdAt || 0) - Number(a.createdAt || 0)
            )
          );
        });
      });

      onSnapshot(collection(db, "bets"), (snap) => {
        const data: any[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
        setBets(data);
      });

      onSnapshot(collection(db, "results"), (snap) => {
        const data: any[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));

        const sorted = data.sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );

        setResults(sorted);
        if (sorted.length > 0) setResult(sorted[0].winner);
      });
    });

    return () => unsubAuth();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("LOGIN SUCCESS ✅");
    } catch {
      alert("LOGIN FAILED ❌");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendDeposit = async () => {
    if (!depositAmount || !utr) return alert("ENTER DEPOSIT DETAILS ❌");

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
    if (!withdrawAmount || !upi) return alert("ENTER WITHDRAW DETAILS ❌");
    if (Number(withdrawAmount) > balance)
      return alert("INSUFFICIENT BALANCE ❌");

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

  const placeBet = async () => {
    if (!selectedColor) return alert("SELECT COLOR ❌");
    if (!betAmount) return alert("ENTER BET AMOUNT ❌");
    if (Number(betAmount) < 10) return alert("MINIMUM BET ₹10 ❌");
    if (Number(betAmount) > balance) return alert("LOW BALANCE ❌");

    const userRef = doc(db, "users", user.email);

    await updateDoc(userRef, {
      balance: balance - Number(betAmount),
    });

    await addDoc(collection(db, "bets"), {
      name: user.displayName,
      email: user.email,
      color: selectedColor,
      amount: Number(betAmount),
      status: "pending",
      result: "",
      roundId: getCurrentRoundId(),
      createdAt: Date.now(),
    });

    setBetAmount("");
    setSelectedColor("");
    alert("BET PLACED ✅");
  };

  const settleRound = async (roundId: string, showAlert = false) => {
    const oldResultSnap = await getDoc(doc(db, "results", roundId));
    if (oldResultSnap.exists()) return;

    const pendingBets = bets.filter(
      (b) => b.status === "pending" && b.roundId === roundId
    );

    if (pendingBets.length === 0) return;

    const totals: any = {};

    pendingBets.forEach((b) => {
      totals[b.color] = (totals[b.color] || 0) + Number(b.amount || 0);
    });

    const activeColors = Object.keys(totals);

    const winnerColor = activeColors.reduce((a, b) =>
      totals[a] <= totals[b] ? a : b
    );

    await setDoc(doc(db, "results", roundId), {
      roundId,
      winner: winnerColor,
      totalRed: totals.RED || 0,
      totalGreen: totals.GREEN || 0,
      totalPink: totals.PINK || 0,
      createdAt: Date.now(),
    });

    setResult(winnerColor);

    for (const bet of pendingBets) {
      const betRef = doc(db, "bets", bet.id);

      if (bet.color === winnerColor) {
        const userRef = doc(db, "users", bet.email);
        const userSnap = await getDoc(userRef);
        const currentBalance = Number(userSnap.data()?.balance || 0);

        await updateDoc(userRef, {
          balance: currentBalance + Number(bet.amount) * 2,
        });

        await updateDoc(betRef, {
          status: "win",
          result: winnerColor,
        });
      } else {
        await updateDoc(betRef, {
          status: "loss",
          result: winnerColor,
        });
      }
    }

    if (showAlert) alert(`AUTO RESULT: ${winnerColor} ✅`);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const left = ROUND_TIME - (now % ROUND_TIME);
      setTimeLeft(left);

      if (user?.email !== ADMIN_EMAIL) return;

      const currentRoundId = getCurrentRoundId();

      const oldPendingRoundIds = Array.from(
        new Set(
          bets
            .filter(
              (b) =>
                b.status === "pending" &&
                b.roundId &&
                Number(b.roundId) < Number(currentRoundId)
            )
            .map((b) => b.roundId)
        )
      );

      oldPendingRoundIds.forEach((roundId) => {
        settleRound(roundId, false);
      });

      if (left <= 2 && autoResultRoundRef.current !== currentRoundId) {
        autoResultRoundRef.current = currentRoundId;
        settleRound(currentRoundId, true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, bets]);

  const statusColor = (status: string) => {
    if (status === "approved" || status === "win") return "lime";
    if (status === "rejected" || status === "loss") return "red";
    return "yellow";
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

        <h2 style={styles.gameTitle}>3 COLOR GAME</h2>

        <h2 style={{ color: "yellow" }}>
          Time Left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </h2>

        {result && <h2 style={{ color: "lime" }}>Last Result: {result}</h2>}

        <div style={styles.colorRow}>
          {["RED", "GREEN", "PINK"].map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                ...styles.colorBtn,
                background: color.toLowerCase(),
                border: selectedColor === color ? "4px solid white" : "none",
              }}
            >
              {color}
            </button>
          ))}
        </div>

        <input
          placeholder="Enter Bet Amount"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          style={styles.input}
        />

        <button onClick={placeBet} style={styles.betBtn}>
          PLACE BET
        </button>

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
              <p>{item.type === "DEPOSIT" ? `UTR: ${item.utr}` : `UPI: ${item.upi}`}</p>
              <p>
                Status: <b style={{ color: statusColor(item.status) }}>{item.status}</b>
              </p>
              <p>Date: {new Date(Number(item.createdAt)).toLocaleString()}</p>
            </div>
          ))
        )}

        <h2 style={styles.historyTitle}>BET HISTORY</h2>

        {bets
          .filter((b) => b.email === user.email)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
          .map((bet, index) => (
            <div key={index} style={styles.betHistory}>
              <p>Round: {bet.roundId}</p>
              <p>Color: {bet.color}</p>
              <p>Amount: ₹{bet.amount}</p>
              <p>
                Status: <b style={{ color: statusColor(bet.status) }}>{bet.status}</b>
              </p>
              <p>Result: {bet.result || "-"}</p>
            </div>
          ))}

        <h2 style={styles.historyTitle}>RESULT HISTORY</h2>

        {results.slice(0, 10).map((r, index) => (
          <div key={index} style={styles.resultCard}>
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

        <div style={styles.btnRow}>
          {user.email === ADMIN_EMAIL && (
            <button
              onClick={() => (window.location.href = "/admin-login")}
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
    fontSize: "55px",
    fontWeight: "bold",
  },
  card: {
    background: "#111",
    padding: "25px",
    borderRadius: "20px",
  },
  balance: {
    color: "#00ff99",
    fontSize: "50px",
  },
  loginBtn: {
    padding: "18px 40px",
    borderRadius: "40px",
    fontSize: "25px",
    background: "black",
    color: "white",
    border: "2px solid white",
  },
  gameTitle: {
    color: "cyan",
  },
  colorRow: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
  },
  colorBtn: {
    color: "white",
    padding: "20px 35px",
    borderRadius: "15px",
    fontWeight: "bold",
    cursor: "pointer",
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
  betBtn: {
    marginTop: "15px",
    padding: "14px 30px",
    background: "cyan",
    border: "none",
    borderRadius: "20px",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "25px",
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
  depositBtn: {
    marginTop: "20px",
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "#ff1493",
    color: "white",
    fontWeight: "bold",
  },
  withdrawBtn: {
    marginTop: "20px",
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "gold",
    color: "black",
    fontWeight: "bold",
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
  betHistory: {
    border: "2px solid cyan",
    padding: "15px",
    borderRadius: "15px",
    marginTop: "15px",
    background: "#050505",
  },
  resultCard: {
    border: "2px solid lime",
    padding: "15px",
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
  },
  logoutBtn: {
    padding: "14px 28px",
    borderRadius: "50px",
    border: "none",
    background: "red",
    color: "white",
    fontWeight: "bold",
  },
};