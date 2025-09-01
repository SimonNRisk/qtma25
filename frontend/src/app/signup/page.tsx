"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      // ⬇️ include first_name & last_name
      const data = await postJSON("/auth/signup", {
        email,
        password,
        first_name: first,
        last_name: last,
      });

      // Stash names in case you want to upsert after first login (if needed)
      sessionStorage.setItem("pending_first_name", first);
      sessionStorage.setItem("pending_last_name", last);

      // Show server message (e.g., "Check your email to confirm…")
      setMsg(data?.message ?? "Account created. Check your email to confirm.");

      // Optional: route to login after a short delay
      // setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      setMsg(err.message?.replace(/["{}]/g, "") || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Sign up</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="First name"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          required
        />
        <input
          placeholder="Last name"
          value={last}
          onChange={(e) => setLast(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <button disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ marginTop: 12 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
