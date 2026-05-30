"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    if (
      username === "maniadmin" &&
      password === "mani2026"
    ) {
      localStorage.setItem("adminLoggedIn", "true");
      alert("ADMIN LOGIN SUCCESS ✅");
      router.push("/admin");
    } else {
      alert("WRONG USERNAME OR PASSWORD ❌");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "30px",
          border: "2px solid cyan",
          borderRadius: "15px",
          background: "#050505",
        }}
      >
        <h1
          style={{
            color: "#00ffff",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          ADMIN LOGIN 🔥
        </h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            background: "#111",
            color: "white",
            border: "1px solid #444",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            background: "#111",
            color: "white",
            border: "1px solid #444",
          }}
        />

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "12px",
            background: "cyan",
            color: "black",
            fontWeight: "bold",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          LOGIN
        </button>
      </div>
    </div>
  );
}