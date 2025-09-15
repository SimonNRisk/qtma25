"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-brand-light">
      <div className="bg-brand-dark text-white p-8 rounded-lg shadow-lg mb-6">
        <h1 className="text-4xl font-bold mb-4 text-brand-blue">
          Next.js + FastAPI
        </h1>
        <p className="text-lg text-brand-light">{message}</p>
      </div>
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-brand-dark rounded-lg flex items-center justify-center text-white font-bold">
          Dark
        </div>
        <div className="w-16 h-16 bg-brand-light border-2 border-brand-dark rounded-lg flex items-center justify-center text-brand-dark font-bold">
          Light
        </div>
        <div className="w-16 h-16 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold">
          Blue
        </div>
      </div>
    </main>
  );
}
