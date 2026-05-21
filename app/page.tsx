"use client";

import { useEffect, useState } from "react";

import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");

  // ADMIN MAIL
  const adminEmail = "manidesigner8489@gmail.com";

  // LOGIN
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const loggedUser = result.user;

      const userRef = doc(db, "users", loggedUser.uid);

      const snap = await getDoc(userRef);

      // FIRST LOGIN
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: loggedUser.displayName,
          email: loggedUser.email,
          balance: 0,
        });
      }

      alert("LOGIN SUCCESS ✅");
    } catch (error) {
      console.log(error);
      alert("LOGIN FAILED ❌");
    }
  };

  // LOGOUT
  const logout = async () => {
    await signOut(auth);
  };

  // USER CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);

        // REALTIME BALANCE
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setBalance(docSnap.data().balance);
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ADD BALANCE
  const addBalance = async () => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const currentBalance = snap.data().balance || 0;

      await setDoc(userRef, {
        ...snap.data(),
        balance: currentBalance + 100,
      });

      alert("₹100 Added ✅");
    }
  };

  // WITHDRAW REQUEST
  const sendWithdrawRequest = async () => {
    if (!user) return;

    if (!withdrawAmount || !upiId) {
      alert("ENTER DETAILS ❌");
      return;
    }

    await addDoc(collection(db, "withdrawRequests"), {
      name: user.displayName,
      email: user.email,
      amount: Number(withdrawAmount),
      upiId: upiId,
      status: "pending",
      createdAt: new Date(),
    });

    alert("WITHDRAW REQUEST SENT ✅");

    setWithdrawAmount("");
    setUpiId("");
  };

  return (
    <div
      style={{
        background: "black",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      <h1
        style={{
          color: "#ff1493",
          fontSize: "70px",
          fontWeight: "bold",
        }}
      >
        MY CHOICE PLAY
      </h1>

      {!user ? (
        <button
          onClick={login}
          style={{
            padding: "20px 40px",
            fontSize: "30px",
            borderRadius: "50px",
            border: "none",
            cursor: "pointer",
            marginTop: "50px",
          }}
        >
          LOGIN WITH GOOGLE
        </button>
      ) : (
        <div
          style={{
            background: "#111",
            padding: "30px",
            borderRadius: "20px",
            marginTop: "40px",
          }}
        >
          <h1>Welcome, {user.displayName}</h1>

          <h2>{user.email}</h2>

          <h1
            style={{
              color: "#00ff88",
              fontSize: "70px",
              marginTop: "30px",
            }}
          >
            Balance: ₹{balance}
          </h1>

          {/* WITHDRAW FORM */}

          <div
            style={{
              marginTop: "40px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "400px",
            }}
          >
            <input
              type="number"
              placeholder="Withdraw Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{
                padding: "20px",
                borderRadius: "10px",
                border: "none",
                fontSize: "20px",
              }}
            />

            <input
              type="text"
              placeholder="Enter UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{
                padding: "20px",
                borderRadius: "10px",
                border: "none",
                fontSize: "20px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "30px",
              flexWrap: "wrap",
            }}
          >
            {/* ADD BALANCE */}
            <button
              onClick={addBalance}
              style={{
                background: "#ff1493",
                color: "white",
                border: "none",
                padding: "20px 30px",
                borderRadius: "50px",
                fontSize: "25px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ADD BALANCE
            </button>

            {/* ADMIN BUTTON */}
            {user.email === adminEmail && (
              <button
                onClick={() => (window.location.href = "/admin")}
                style={{
                  background: "#00ffff",
                  color: "black",
                  border: "none",
                  padding: "20px 30px",
                  borderRadius: "50px",
                  fontSize: "25px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ADMIN
              </button>
            )}

            {/* WITHDRAW */}
            <button
              onClick={sendWithdrawRequest}
              style={{
                background: "gold",
                color: "black",
                border: "none",
                padding: "20px 30px",
                borderRadius: "50px",
                fontSize: "25px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              WITHDRAW
            </button>

            {/* LOGOUT */}
            <button
              onClick={logout}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "20px 30px",
                borderRadius: "50px",
                fontSize: "25px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}