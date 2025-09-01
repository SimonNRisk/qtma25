"use client";

import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";
import { session } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = session.access();
    if (!token) { router.replace("/login"); return; }
    getJSON("/me", token).then(data => setUser(data.user)).catch(() => router.replace("/login"));
  }, [router]);

  if (!user) return <p>Loading…</p>;
  return (
    <div style={{maxWidth: 600, margin: "40px auto", fontFamily: "system-ui"}}>
      <h1>Me</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={() => { session.clear(); router.replace("/login"); }}>Sign out</button>
    </div>
  );
}
