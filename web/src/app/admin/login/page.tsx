"use client";
import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const from = searchParams.get("from") ?? "/admin";
      router.push(from);
      return;
    }
    setLoading(false);
    setError("WRONG PIN!");
    setPin("");
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        placeholder="Enter PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        autoFocus
        required
        style={{ textAlign: "center", letterSpacing: 6, fontSize: 18 }}
      />
      {error && (
        <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--red)", textAlign: "center", animation: "shake 0.4s ease" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button type="submit" className="pbtn pbtn-gold" disabled={loading}>
          {loading ? "..." : "UNLOCK"}
        </button>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="pcard anim-pop" style={{ width: "100%", maxWidth: 320, textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--gold)", marginBottom: 24 }}>
          PARENT PANEL
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
