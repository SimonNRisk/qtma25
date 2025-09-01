"use client";

import { useState, useEffect } from "react";
import { postJSON } from "@/lib/api";
import { session } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const data = await postJSON("/auth/login", { email, password });
      session.save(data.access_token, data.refresh_token);

      const f = sessionStorage.getItem("pending_first_name");
      const l = sessionStorage.getItem("pending_last_name");
      if (f || l) {
        // later call FastAPI /profiles/upsert here
        sessionStorage.removeItem("pending_first_name");
        sessionStorage.removeItem("pending_last_name");
      }
      router.push("/me");
    } catch (err: any) {
      setMsg(err.message || "Login failed");
    }
  }

  useEffect(() => {
    if (session.access()) router.replace("/me");
  }, [router]);

  return (
    <div style={{maxWidth: 400, margin: "40px auto", fontFamily: "system-ui"}}>
      <h1>Log in</h1>
      <form onSubmit={onSubmit} style={{display: "grid", gap: 12}}>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button>Sign in</button>
      </form>
      {msg && <p>{msg}</p>}
      <p>No account? <a href="/signup">Create one</a></p>
    </div>
  );
}
