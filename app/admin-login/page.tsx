"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const ADMIN_USERNAME = "maniadmin";
  const ADMIN_PASSWORD = "mani2026";

  const login = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("adminLoggedIn", "true");
      alert("ADMIN LOGIN SUCCESS ✅");
      router.push("/admin");
    } else {
      alert("WRONG USERNAME OR PASSWORD ❌");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2 style={styles.title}>ADMIN LOGIN 🔥</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={login} style={styles.button}>
          LOGIN
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    background: "black",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  },
  box: {
    width: "320px",
    border: "2px solid cyan",
    borderRadius: "15px",
    padding: "30px",
    background: "#050505",
  },
  title: {
    color: "cyan",
    textAlign: "center",
    marginBottom: "25px",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    background: "#111",
    color: "white",
    border: "1px solid #333",
  },
  button: {
    width: "100%",
    padding: "15px",
    background: "cyan",
    color: "black",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};