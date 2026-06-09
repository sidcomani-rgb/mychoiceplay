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
  deleteDoc,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

const ROUND_TIME = 5 * 60;

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [betAmount, setBetAmount] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [bets, setBets] = useState<any[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [winnerTicker, setWinnerTicker] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [winPopup, setWinPopup] = useState<any>(null);
  const [lossPopup, setLossPopup] = useState<any>(null);

  const autoResultRoundRef = useRef("");
  const shownBetIdsRef = useRef<Set<string>>(new Set());
  const firstBetsLoadRef = useRef(true);

  const ADMIN_EMAIL = "manidesigner8489@gmail.com";
  const isBetLocked = timeLeft <= 10;

  const getCurrentRoundId = () =>
    Math.floor(Date.now() / (ROUND_TIME * 1000)).toString();

  const currentRoundId = getCurrentRoundId();

  const currentRoundPendingBets = bets.filter(
    (b) => b.status === "pending" && b.roundId === currentRoundId
  );

  const myActiveBets = user
    ? currentRoundPendingBets.filter((b) => b.email === user.email)
    : [];

  const myRedActive = myActiveBets
    .filter((b) => b.color === "RED")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const myGreenActive = myActiveBets
    .filter((b) => b.color === "GREEN")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const myPinkActive = myActiveBets
    .filter((b) => b.color === "PINK")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const myTotalActive = myRedActive + myGreenActive + myPinkActive;

  const redLiveTotal = currentRoundPendingBets
    .filter((b) => b.color === "RED")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const greenLiveTotal = currentRoundPendingBets
    .filter((b) => b.color === "GREEN")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const pinkLiveTotal = currentRoundPendingBets
    .filter((b) => b.color === "PINK")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const totalPool = redLiveTotal + greenLiveTotal + pinkLiveTotal;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const leaderboardMap = new Map();

  bets
    .filter(
      (b) =>
        b.status === "win" &&
        Number(b.createdAt || 0) >= todayStart.getTime()
    )
    .forEach((b) => {
      const key = b.email || b.name || "User";
      const old = leaderboardMap.get(key) || {
        name: b.name || "User",
        email: b.email || "",
        amount: 0,
        wins: 0,
      };

      leaderboardMap.set(key, {
        ...old,
        amount: old.amount + Number(b.amount || 0) * 2,
        wins: old.wins + 1,
      });
    });

  const dailyLeaderboard = Array.from(leaderboardMap.values())
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 5);

  const recentResults = results.slice(0, 10);

  const playWinSound = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const notes = [523, 659, 784, 1046];

      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.frequency.value = freq;
        osc.type = "triangle";

        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(
          0.25,
          audioCtx.currentTime + index * 0.15 + 0.03
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + index * 0.15 + 0.25
        );

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + index * 0.15);
        osc.stop(audioCtx.currentTime + index * 0.15 + 0.28);
      });
    } catch {
      console.log("Audio not supported");
    }
  };

  useEffect(() => {
    if (!winPopup) return;
    playWinSound();
    const closeTimer = setTimeout(() => setWinPopup(null), 6000);
    return () => clearTimeout(closeTimer);
  }, [winPopup]);

  useEffect(() => {
    if (!lossPopup) return;
    const closeTimer = setTimeout(() => setLossPopup(null), 4000);
    return () => clearTimeout(closeTimer);
  }, [lossPopup]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);

      const onlineRef = doc(db, "onlineUsers", currentUser.email!);

      await setDoc(onlineRef, {
        name: currentUser.displayName,
        email: currentUser.email,
        lastSeen: Date.now(),
      });

      const onlineInterval = setInterval(async () => {
        await setDoc(onlineRef, {
          name: currentUser.displayName,
          email: currentUser.email,
          lastSeen: Date.now(),
        });
      }, 15000);

      const handleBeforeUnload = () => {
        deleteDoc(onlineRef);
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      const unsubOnline = onSnapshot(collection(db, "onlineUsers"), (snap) => {
        const now = Date.now();
        const activeUsers = snap.docs.filter((d) => {
          const data: any = d.data();
          return now - Number(data.lastSeen || 0) < 60000;
        });

        setOnlinePlayers(activeUsers.length);
      });

      const userRef = doc(db, "users", currentUser.email!);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          name: currentUser.displayName,
          email: currentUser.email,
          balance: 0,
        });
      }

      const unsubUser = onSnapshot(userRef, (s) => {
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

      let unsubWithdraw: any = null;

      const unsubDeposit = onSnapshot(dq, (depositSnap) => {
        const deposits = depositSnap.docs.map((d) => ({
          id: d.id,
          type: "DEPOSIT",
          ...d.data(),
        }));

        if (unsubWithdraw) unsubWithdraw();

        unsubWithdraw = onSnapshot(wq, (withdrawSnap) => {
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

      const unsubBets = onSnapshot(collection(db, "bets"), (snap) => {
        const data: any[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));

        setBets(data);

        if (firstBetsLoadRef.current) {
          data.forEach((bet) => {
            if (bet.status !== "pending") shownBetIdsRef.current.add(bet.id);
          });
          firstBetsLoadRef.current = false;
          return;
        }

        const myFinishedBet = data
          .filter(
            (bet) =>
              bet.email === currentUser.email &&
              bet.status !== "pending" &&
              !shownBetIdsRef.current.has(bet.id)
          )
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0];

        data.forEach((bet) => {
          if (bet.status !== "pending") shownBetIdsRef.current.add(bet.id);
        });

        if (myFinishedBet?.status === "win") {
          setWinPopup({
            color: myFinishedBet.result || myFinishedBet.color,
            amount: Number(myFinishedBet.amount || 0) * 2,
            betAmount: Number(myFinishedBet.amount || 0),
            roundId: myFinishedBet.roundId,
          });
        }

        if (myFinishedBet?.status === "loss") {
          setLossPopup({
            color: myFinishedBet.result || "-",
            amount: Number(myFinishedBet.amount || 0),
            betColor: myFinishedBet.color,
            roundId: myFinishedBet.roundId,
          });
        }
      });

      const unsubResults = onSnapshot(collection(db, "results"), (snap) => {
        const data: any[] = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));

        const sorted = data.sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
        );

        setResults(sorted);

        setWinnerTicker(
          sorted.slice(0, 12).map((r) => ({
            winner: r.winner,
            amount:
              Math.max(
                Number(r.totalRed || 0),
                Number(r.totalGreen || 0),
                Number(r.totalPink || 0)
              ) || 0,
            roundId: r.roundId,
          }))
        );

        if (sorted.length > 0) setResult(sorted[0].winner);
      });

      return () => {
        clearInterval(onlineInterval);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        deleteDoc(onlineRef);
        unsubOnline();
        unsubUser();
        unsubDeposit();
        if (unsubWithdraw) unsubWithdraw();
        unsubBets();
        unsubResults();
      };
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
    if (user?.email) {
      await deleteDoc(doc(db, "onlineUsers", user.email));
    }
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
    const liveTimeLeft =
      ROUND_TIME - (Math.floor(Date.now() / 1000) % ROUND_TIME);

    if (liveTimeLeft <= 10) {
      alert("LAST 10 SECONDS - BET CLOSED ❌");
      return;
    }

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
      {winPopup && (
        <div style={styles.winOverlay}>
          <div style={styles.confettiLayer}>
            {Array.from({ length: 45 }).map((_, i) => (
              <span
                key={`c-${i}`}
                style={{
                  ...styles.confetti,
                  left: `${(i * 17) % 100}%`,
                  animationDelay: `${(i % 15) * 0.1}s`,
                  background: [
                    "#ff1493",
                    "#00a2ff94",
                    "#ffcc00",
                    "#00ff99",
                    "#ff3333",
                    "#ffffff",
                  ][i % 6],
                }}
              />
            ))}
          </div>

          <div style={styles.moneyLayer}>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={`m-${i}`}
                style={{
                  ...styles.money,
                  left: `${(i * 23) % 100}%`,
                  animationDelay: `${(i % 12) * 0.12}s`,
                }}
              >
                💸
              </span>
            ))}
          </div>

          <div style={styles.winBox}>
            <div style={styles.trophy}>🏆</div>
            <h1 style={styles.winTitle}>BIG WIN!</h1>
            <h1 style={styles.winAmount}>YOU WON ₹{winPopup.amount}</h1>
            <h2 style={styles.winResult}>RESULT: {winPopup.color}</h2>
            <p style={styles.winSub}>
              BET ₹{winPopup.betAmount} • ROUND {winPopup.roundId}
            </p>
            <button onClick={() => setWinPopup(null)} style={styles.closeWinBtn}>
              AWESOME
            </button>
          </div>
        </div>
      )}

      {lossPopup && (
        <div style={styles.lossOverlay}>
          <div style={styles.lossBox}>
            <div style={styles.lossIcon}>😔</div>
            <h1 style={styles.lossTitle}>YOU LOST ₹{lossPopup.amount}</h1>
            <h2 style={styles.lossResult}>RESULT: {lossPopup.color}</h2>
            <p style={styles.lossSub}>
              YOUR COLOR: {lossPopup.betColor} • ROUND {lossPopup.roundId}
            </p>
            <button onClick={() => setLossPopup(null)} style={styles.closeLossBtn}>
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      <h1 style={styles.title}>MY CHOICE PLAY</h1>

      <div style={styles.tickerBox}>
        <div style={styles.tickerTrack}>
          {winnerTicker.length === 0 ? (
            <span>🏆 PLAY & WIN BIG 🔥 MY CHOICE PLAY 🔥</span>
          ) : (
            [...winnerTicker, ...winnerTicker].map((item, i) => (
              <span key={i} style={styles.tickerItem}>
                🏆 {item.winner} WON ₹{item.amount} 🔥
              </span>
            ))
          )}
        </div>
      </div>

      <section style={styles.card}>
        <p>Welcome, {user.displayName}</p>
        <p>{user.email}</p>
        <h1 style={styles.balance}>Balance: ₹{balance}</h1>

        <div style={styles.onlinePlayersBox}>
          🟢 ONLINE PLAYERS: {onlinePlayers}
        </div>

        <div style={styles.activeBetBox}>
          <h2 style={styles.activeBetTitle}>🎯 MY ACTIVE BETS</h2>

          {myTotalActive === 0 ? (
            <p style={{ color: "white" }}>No active bets this round</p>
          ) : (
            <>
              <div style={styles.activeBetGrid}>
                <div style={styles.activeRed}>🔴 RED ₹{myRedActive}</div>
                <div style={styles.activeGreen}>🟢 GREEN ₹{myGreenActive}</div>
                <div style={styles.activePink}>🌸 PINK ₹{myPinkActive}</div>
              </div>
              <h2 style={styles.activeTotal}>TOTAL ACTIVE BET: ₹{myTotalActive}</h2>
            </>
          )}
        </div>

        <h2 style={styles.gameTitle}>3 COLOR GAME</h2>

        <h2 style={{ color: isBetLocked ? "red" : "yellow" }}>
          Time Left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </h2>

        {isBetLocked && (
          <h2 style={{ color: "red" }}>BET CLOSED - WAIT FOR NEXT ROUND</h2>
        )}

        {result && <h2 style={{ color: "lime" }}>Last Result: {result}</h2>}

<div style={styles.recentResultsBox}>
  <h2 style={styles.recentResultsTitle}>📊 RECENT RESULTS</h2>

  {recentResults.length === 0 ? (
    <p style={{ color: "white" }}>No results yet</p>
  ) : (
    <div style={styles.recentResultsRow}>
      {recentResults.map((item, index) => (
        <div
          key={item.id || index}
          style={{
            ...styles.resultCircle,
            background:
              item.winner === "RED"
                ? "red"
                : item.winner === "GREEN"
                ? "green"
                : "pink",
            color: item.winner === "PINK" ? "black" : "white",
          }}
        >
          {item.winner === "RED"
            ? "R"
            : item.winner === "GREEN"
            ? "G"
            : "P"}
        </div>
      ))}
    </div>
  )}
</div>
        <div style={styles.livePoolBox}>
          <h2 style={styles.livePoolTitle}>🔥 LIVE BET COUNTER</h2>
          <div style={styles.livePoolGrid}>
            <div style={styles.liveRed}>🔴 RED ₹{redLiveTotal}</div>
            <div style={styles.liveGreen}>🟢 GREEN ₹{greenLiveTotal}</div>
            <div style={styles.livePink}>🌸 PINK ₹{pinkLiveTotal}</div>
          </div>
          <h2 style={styles.totalPool}>💰 TOTAL POOL: ₹{totalPool}</h2>
        </div>

        <div style={styles.leaderboardBox}>
          <h2 style={styles.leaderboardTitle}>🏆 DAILY LEADERBOARD</h2>

          {dailyLeaderboard.length === 0 ? (
            <p style={{ color: "white" }}>No winners today</p>
          ) : (
            dailyLeaderboard.map((player, index) => (
              <div key={index} style={styles.leaderboardRow}>
                <span>#{index + 1}</span>
                <span>{player.name}</span>
                <span style={{ color: "lime" }}>₹{player.amount}</span>
                <span>{player.wins} WIN</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.colorRow}>
          {["RED", "GREEN", "PINK"].map((color) => (
            <button
              key={color}
              onClick={() => !isBetLocked && setSelectedColor(color)}
              disabled={isBetLocked}
              style={{
                ...styles.colorBtn,
                background: color.toLowerCase(),
                border: selectedColor === color ? "4px solid white" : "none",
                opacity: isBetLocked ? 0.5 : 1,
                cursor: isBetLocked ? "not-allowed" : "pointer",
              }}
            >
              {color}
            </button>
          ))}
        </div>

        <input
          placeholder="Enter Bet Amount"
          value={betAmount}
          disabled={isBetLocked}
          onChange={(e) => setBetAmount(e.target.value)}
          style={{
            ...styles.input,
            opacity: isBetLocked ? 0.5 : 1,
          }}
        />

        <button
          onClick={placeBet}
          disabled={isBetLocked}
          style={{
            ...styles.betBtn,
            opacity: isBetLocked ? 0.5 : 1,
            cursor: isBetLocked ? "not-allowed" : "pointer",
          }}
        >
          {isBetLocked ? "BET CLOSED" : "PLACE BET"}
        </button>

        <div style={styles.grid}>
 <div style={styles.depositBox}>
  <h3
    onClick={() => setShowDeposit(!showDeposit)}
    style={{ color: "#ff1493", cursor: "pointer" }}
  >
    Add Balance Request {showDeposit ? "▲" : "▼"}
  </h3>

  {showDeposit && (
    <>
      <img
        src="/qr.jpg"
        alt="Payment QR"
        style={{
          width: "220px",
          maxWidth: "100%",
          display: "block",
          margin: "15px auto",
          borderRadius: "15px",
          border: "2px solid #ff1493",
        }}
      />

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
    </>
  )}
</div>
<div style={styles.withdrawBox}>
  <h3
    onClick={() => setShowWithdraw(!showWithdraw)}
    style={{ color: "gold", cursor: "pointer" }}
  >
    Withdraw Request {showWithdraw ? "▲" : "▼"}
  </h3>

  {showWithdraw && (
    <>
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
    </>
  )}
</div>
        </div>

<h2
  onClick={() => setShowHistory(!showHistory)}
  style={{ ...styles.historyTitle, cursor: "pointer" }}
>
  TRANSACTION HISTORY {showHistory ? "▲" : "▼"}
</h2>

{showHistory && (
  <>

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
              <p>
                {item.type === "DEPOSIT"
                  ? `UTR: ${item.utr}`
                  : `UPI: ${item.upi}`}
              </p>
              <p>
                Status:{" "}
                <b style={{ color: statusColor(item.status) }}>{item.status}</b>
              </p>
              <p>Date: {new Date(Number(item.createdAt)).toLocaleString()}</p>
            </div>
          ))
        )}

  </>
)}
        <h2
  onClick={() => setShowBetHistory(!showBetHistory)}
  style={{ ...styles.historyTitle, cursor: "pointer" }}
>
  BET HISTORY {showBetHistory ? "▲" : "▼"}
</h2>

 {showBetHistory && (
  <>
    {bets
      .filter((b) => b.email === user.email)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
      .map((bet, index) => (
        <div key={index} style={styles.betHistory}>
  <p>Round: {bet.roundId}</p>
  <p>Color: {bet.color}</p>
  <p>Amount: ₹{bet.amount}</p>
  <p>Status: {bet.status}</p>
  <p>Result: {bet.result}</p>
</div>
      ))}
  </>
)}
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

      <style jsx global>{`
        @keyframes tickerMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes trophyBounce {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.2) translateY(-15px); }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px #ffcc00, 0 0 70px #ff1493; }
          50% { box-shadow: 0 0 60px #00e5ff, 0 0 120px #ffcc00; }
        }

        @keyframes confettiFall {
          0% { transform: translateY(-120px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes moneyRain {
          0% { transform: translateY(-120px) rotate(0deg) scale(0.8); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg) scale(1.4); opacity: 0; }
        }

        @keyframes screenPop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes lossPop {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
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
  tickerBox: {
    background: "#111",
    color: "gold",
    overflow: "hidden",
    whiteSpace: "nowrap",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "18px",
    border: "2px solid gold",
    boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
  },
  tickerTrack: {
    display: "inline-block",
    minWidth: "200%",
    animation: "tickerMove 22s linear infinite",
    fontWeight: "bold",
    fontSize: "18px",
  },
  tickerItem: {
    display: "inline-block",
    marginRight: "45px",
  },
  onlinePlayersBox: {
    background: "#050505",
    border: "2px solid lime",
    color: "lime",
    padding: "14px",
    borderRadius: "14px",
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "15px",
    boxShadow: "0 0 18px rgba(0,255,0,0.3)",
  },
  activeBetBox: {
    background: "#050505",
    border: "2px solid #ff1493",
    borderRadius: "18px",
    padding: "18px",
    marginTop: "15px",
    marginBottom: "20px",
    boxShadow: "0 0 20px rgba(255,20,147,0.25)",
  },
  activeBetTitle: {
    color: "#ff1493",
    marginBottom: "15px",
  },
  activeBetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "15px",
  },
  activeRed: {
    background: "red",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  activeGreen: {
    background: "green",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  activePink: {
    background: "pink",
    color: "black",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  activeTotal: {
    color: "#ff1493",
    marginTop: "15px",
  },
  recentResultsBox: {
    background: "#050505",
    border: "2px solid gold",
    borderRadius: "18px",
    padding: "18px",
    marginTop: "15px",
    marginBottom: "20px",
    boxShadow: "0 0 20px rgba(255,215,0,0.25)",
  },
  recentResultsTitle: {
    color: "gold",
    marginBottom: "15px",
  },
  recentResultsRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  resultCircle: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    border: "3px solid white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    boxShadow: "0 0 12px rgba(255,255,255,0.35)",
  },
  livePoolBox: {
    background: "#050505",
    border: "2px solid #00e5ff",
    borderRadius: "18px",
    padding: "18px",
    marginTop: "15px",
    marginBottom: "20px",
    boxShadow: "0 0 20px rgba(0,229,255,0.25)",
  },
  livePoolTitle: {
    color: "#00e5ff",
    marginBottom: "15px",
  },
  livePoolGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "15px",
  },
  liveRed: {
    background: "red",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  liveGreen: {
    background: "green",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  livePink: {
    background: "pink",
    color: "black",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  totalPool: {
    color: "gold",
    marginTop: "15px",
  },
  leaderboardBox: {
    background: "#050505",
    border: "2px solid gold",
    borderRadius: "18px",
    padding: "18px",
    marginTop: "15px",
    marginBottom: "20px",
    boxShadow: "0 0 20px rgba(255,215,0,0.25)",
  },
  leaderboardTitle: {
    color: "gold",
    marginBottom: "15px",
  },
  leaderboardRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr 130px 100px",
    gap: "10px",
    padding: "12px",
    borderBottom: "1px solid #333",
    fontWeight: "bold",
    alignItems: "center",
  },
  winOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.88)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confettiLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  moneyLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  confetti: {
    position: "absolute",
    top: "-30px",
    width: "12px",
    height: "24px",
    borderRadius: "3px",
    animation: "confettiFall 3s linear infinite",
  },
  money: {
    position: "absolute",
    top: "-40px",
    fontSize: "34px",
    animation: "moneyRain 3.8s linear infinite",
  },
  winBox: {
    width: "90%",
    maxWidth: "540px",
    background: "linear-gradient(135deg, #111, #001f2f)",
    border: "4px solid #ffcc00",
    borderRadius: "30px",
    padding: "35px",
    textAlign: "center",
    animation: "glowPulse 1.5s infinite, screenPop 0.4s ease-out",
    position: "relative",
    zIndex: 2,
  },
  trophy: {
    fontSize: "120px",
    animation: "trophyBounce 1s infinite",
  },
  winTitle: {
    color: "#ffcc00",
    fontSize: "42px",
    margin: "10px 0",
  },
  winAmount: {
    color: "#00ff99",
    fontSize: "50px",
    margin: "10px 0",
  },
  winResult: {
    color: "#00e5ff",
    fontSize: "30px",
  },
  winSub: {
    color: "white",
    fontSize: "16px",
  },
  closeWinBtn: {
    marginTop: "20px",
    padding: "15px 35px",
    background: "#ff1493",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  lossOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 9998,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lossBox: {
    width: "90%",
    maxWidth: "420px",
    background: "#111",
    border: "3px solid red",
    borderRadius: "25px",
    padding: "30px",
    textAlign: "center",
    animation: "lossPop 0.3s ease-out",
    boxShadow: "0 0 35px red",
  },
  lossIcon: {
    fontSize: "80px",
  },
  lossTitle: {
    color: "red",
    fontSize: "34px",
  },
  lossResult: {
    color: "#00e5ff",
    fontSize: "24px",
  },
  lossSub: {
    color: "white",
    fontSize: "15px",
  },
  closeLossBtn: {
    marginTop: "18px",
    padding: "14px 30px",
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontWeight: "bold",
    cursor: "pointer",
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