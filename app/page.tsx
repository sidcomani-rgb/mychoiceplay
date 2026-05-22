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
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const [balance, setBalance] = useState(0);

  const [depositAmount, setDepositAmount] =
    useState("");

  const [utrNumber, setUtrNumber] =
    useState("");

  const [withdrawAmount, setWithdrawAmount] =
    useState("");

  const [upiId, setUpiId] = useState("");

  const [history, setHistory] = useState<any[]>([]);

  const adminEmail =
    "manidesigner8489@gmail.com";

  // LOGIN
  const login = async () => {
    try {
      const provider =
        new GoogleAuthProvider();

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const loggedUser = result.user;

      const userRef = doc(
        db,
        "users",
        loggedUser.uid
      );

      const snap = await getDoc(userRef);

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

  // LOAD USER + BALANCE + HISTORY
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (currentUser) {
            // BALANCE
            const userRef = doc(
              db,
              "users",
              currentUser.uid
            );

            onSnapshot(
              userRef,
              (docSnap) => {
                if (docSnap.exists()) {
                  setBalance(
                    Number(
                      docSnap.data()
                        .balance || 0
                    )
                  );
                }
              }
            );

            // DEPOSIT HISTORY
            const depositQuery = query(
              collection(
                db,
                "depositRequests"
              ),
              where(
                "email",
                "==",
                currentUser.email
              )
            );

            const depositSnap =
              await getDocs(
                depositQuery
              );

            const depositData =
              depositSnap.docs.map(
                (doc) => ({
                  type: "DEPOSIT",
                  ...doc.data(),
                })
              );

            // WITHDRAW HISTORY
            const withdrawQuery = query(
              collection(
                db,
                "withdrawRequests"
              ),
              where(
                "email",
                "==",
                currentUser.email
              )
            );

            const withdrawSnap =
              await getDocs(
                withdrawQuery
              );

            const withdrawData =
              withdrawSnap.docs.map(
                (doc) => ({
                  type: "WITHDRAW",
                  ...doc.data(),
                })
              );

            const allHistory = [
              ...depositData,
              ...withdrawData,
            ];

            setHistory(allHistory);
          }
        }
      );

    return () => unsubscribe();
  }, []);

  // SEND DEPOSIT
  const sendDepositRequest =
    async () => {
      if (!user) return;

      if (
        !depositAmount ||
        !utrNumber
      ) {
        alert(
          "ENTER DEPOSIT DETAILS ❌"
        );

        return;
      }

      await addDoc(
        collection(
          db,
          "depositRequests"
        ),
        {
          name: user.displayName,
          email: user.email,
          amount:
            Number(depositAmount),
          utr: utrNumber,
          status: "pending",
          createdAt: new Date(),
        }
      );

      alert(
        "DEPOSIT REQUEST SENT ✅"
      );

      setDepositAmount("");
      setUtrNumber("");
    };

  // SEND WITHDRAW
  const sendWithdrawRequest =
    async () => {
      if (!user) return;

      if (
        !withdrawAmount ||
        !upiId
      ) {
        alert(
          "ENTER WITHDRAW DETAILS ❌"
        );

        return;
      }

      if (
        Number(withdrawAmount) >
        balance
      ) {
        alert(
          "INSUFFICIENT BALANCE ❌"
        );

        return;
      }

      await addDoc(
        collection(
          db,
          "withdrawRequests"
        ),
        {
          name: user.displayName,
          email: user.email,
          amount:
            Number(withdrawAmount),
          upi: upiId,
          status: "pending",
          createdAt: new Date(),
        }
      );

      alert(
        "WITHDRAW REQUEST SENT ✅"
      );

      setWithdrawAmount("");
      setUpiId("");
    };

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        padding: "20px",
        color: "white",
      }}
    >
      <h1
        style={{
          color: "#ff1493",
          fontSize: "60px",
          fontWeight: "bold",
        }}
      >
        MY CHOICE PLAY
      </h1>

      {!user ? (
        <button
          onClick={login}
          style={{
            padding: "18px 35px",
            fontSize: "28px",
            borderRadius: "50px",
            border:
              "2px solid white",
            background: "black",
            color: "white",
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
          <h2>
            Welcome,{" "}
            {user.displayName}
          </h2>

          <p>{user.email}</p>

          <h1
            style={{
              color: "#00ff88",
              fontSize: "60px",
              marginTop: "25px",
            }}
          >
            Balance: ₹{balance}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "25px",
              marginTop: "35px",
            }}
          >
            {/* DEPOSIT */}
            <div
              style={{
                background: "#000",
                padding: "25px",
                borderRadius: "18px",
                border:
                  "1px solid #ff1493",
              }}
            >
              <h2
                style={{
                  color: "#ff1493",
                }}
              >
                Add Balance Request
              </h2>

              <input
                type="number"
                placeholder="Enter Amount"
                value={depositAmount}
                onChange={(e) =>
                  setDepositAmount(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "15px",
                  marginTop: "15px",
                  borderRadius:
                    "10px",
                  fontSize: "18px",
                  color: "#000",
                  background: "#fff",
                  fontWeight:
                    "bold",
                  caretColor:
                    "#000",
                  outline: "none",
                  border: "none",
                }}
              />

              <input
                type="text"
                placeholder="Enter UTR Number"
                value={utrNumber}
                onChange={(e) =>
                  setUtrNumber(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "15px",
                  marginTop: "15px",
                  borderRadius:
                    "10px",
                  fontSize: "18px",
                  color: "#000",
                  background: "#fff",
                  fontWeight:
                    "bold",
                  caretColor:
                    "#000",
                  outline: "none",
                  border: "none",
                }}
              />

              <button
                onClick={
                  sendDepositRequest
                }
                style={{
                  background:
                    "#ff1493",
                  color: "white",
                  border: "none",
                  padding:
                    "15px 25px",
                  borderRadius:
                    "50px",
                  fontSize: "20px",
                  fontWeight:
                    "bold",
                  cursor: "pointer",
                  marginTop: "20px",
                }}
              >
                SEND DEPOSIT
              </button>
            </div>

            {/* WITHDRAW */}
            <div
              style={{
                background: "#000",
                padding: "25px",
                borderRadius: "18px",
                border:
                  "1px solid gold",
              }}
            >
              <h2
                style={{
                  color: "gold",
                }}
              >
                Withdraw Request
              </h2>

              <input
                type="number"
                placeholder="Withdraw Amount"
                value={
                  withdrawAmount
                }
                onChange={(e) =>
                  setWithdrawAmount(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "15px",
                  marginTop: "15px",
                  borderRadius:
                    "10px",
                  fontSize: "18px",
                  color: "#000",
                  background: "#fff",
                  fontWeight:
                    "bold",
                  caretColor:
                    "#000",
                  outline: "none",
                  border: "none",
                }}
              />

              <input
                type="text"
                placeholder="Enter UPI ID"
                value={upiId}
                onChange={(e) =>
                  setUpiId(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "15px",
                  marginTop: "15px",
                  borderRadius:
                    "10px",
                  fontSize: "18px",
                  color: "#000",
                  background: "#fff",
                  fontWeight:
                    "bold",
                  caretColor:
                    "#000",
                  outline: "none",
                  border: "none",
                }}
              />

              <button
                onClick={
                  sendWithdrawRequest
                }
                style={{
                  background: "gold",
                  color: "black",
                  border: "none",
                  padding:
                    "15px 25px",
                  borderRadius:
                    "50px",
                  fontSize: "20px",
                  fontWeight:
                    "bold",
                  cursor: "pointer",
                  marginTop: "20px",
                }}
              >
                SEND WITHDRAW
              </button>
            </div>
          </div>

          {/* HISTORY */}
          <div
            style={{
              marginTop: "40px",
            }}
          >
            <h1
              style={{
                color: "#00e5ff",
                marginBottom:
                  "20px",
              }}
            >
              TRANSACTION HISTORY
            </h1>

            {history.length === 0 ? (
              <div
                style={{
                  background:
                    "#000",
                  padding: "20px",
                  borderRadius:
                    "15px",
                }}
              >
                No history found
              </div>
            ) : (
              history.map(
                (item, index) => (
                  <div
                    key={index}
                    style={{
                      background:
                        "#000",
                      padding:
                        "20px",
                      borderRadius:
                        "15px",
                      marginBottom:
                        "15px",
                      border:
                        item.type ===
                        "DEPOSIT"
                          ? "1px solid #ff1493"
                          : "1px solid gold",
                    }}
                  >
                    <h2>
                      {item.type}
                    </h2>

                    <p>
                      Amount: ₹
                      {item.amount}
                    </p>

                    <p>
                      Status:{" "}
                      {item.status}
                    </p>
                  </div>
                )
              )
            )}
          </div>

          {/* BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "35px",
              flexWrap: "wrap",
            }}
          >
            {user.email ===
              adminEmail && (
              <button
                onClick={() =>
                  (window.location.href =
                    "/admin")
                }
                style={{
                  background:
                    "#00ffff",
                  color: "black",
                  border: "none",
                  padding:
                    "18px 30px",
                  borderRadius:
                    "50px",
                  fontSize: "22px",
                  fontWeight:
                    "bold",
                  cursor: "pointer",
                }}
              >
                ADMIN
              </button>
            )}

            <button
              onClick={logout}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding:
                  "18px 30px",
                borderRadius:
                  "50px",
                fontSize: "22px",
                fontWeight:
                  "bold",
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