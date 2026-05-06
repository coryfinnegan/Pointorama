"use client";
import { useState } from "react";

const FEATURES = [
  { emoji: "⭐", title: "Point tracking in seconds", body: "Add points from Siri, Telegram, or the parent panel. No app switching, no friction." },
  { emoji: "🛍️", title: "Real reward shop", body: "Paste an Amazon or Nintendo link — we pull the title, image, and price automatically." },
  { emoji: "💰", title: "Automatic allowance", body: "Set a weekly point or money payout. It runs itself so you never forget payday." },
  { emoji: "📱", title: "Telegram alerts", body: "Get a message the moment your kid redeems something — with a direct link to buy it." },
  { emoji: "👑", title: "Infinite level system", body: "Rookie → Explorer → Legend → Mythic and beyond. No level cap, no ceiling on motivation." },
  { emoji: "🔒", title: "Parent-only admin", body: "Kids see the shop and their balance. Only you can add points or change prizes." },
];

const COMING_SOON = [
  "Multiple kids, one dashboard",
  "Behavior streaks & bonuses",
  "iOS & Android app",
  "Custom themes & avatars",
  "Chore templates library",
  "Weekly behavior reports",
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState<number | null>(null);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setCount(data.count);
      setSubmitted(true);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  const S = {
    page: {
      background: "#080818",
      color: "#e8e8ff",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      minHeight: "100vh",
      overflowX: "hidden" as const,
    },
    nav: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 32px",
      maxWidth: 1100,
      margin: "0 auto",
    },
    logo: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 13,
      color: "#ffd700",
      letterSpacing: 1,
    },
    navCta: {
      background: "#ffd700",
      color: "#1a0600",
      border: "none",
      borderRadius: 6,
      padding: "10px 20px",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
    },
    hero: {
      textAlign: "center" as const,
      padding: "80px 24px 60px",
      maxWidth: 760,
      margin: "0 auto",
    },
    badge: {
      display: "inline-block",
      background: "rgba(255,215,0,0.12)",
      border: "1px solid rgba(255,215,0,0.3)",
      borderRadius: 99,
      padding: "6px 16px",
      fontSize: 12,
      color: "#ffd700",
      marginBottom: 28,
      letterSpacing: 0.5,
    },
    h1: {
      fontSize: "clamp(36px, 7vw, 68px)",
      fontWeight: 900,
      lineHeight: 1.1,
      marginBottom: 20,
      letterSpacing: -1,
    },
    sub: {
      fontSize: "clamp(16px, 2.5vw, 20px)",
      color: "#9999cc",
      lineHeight: 1.7,
      marginBottom: 40,
      maxWidth: 560,
      margin: "0 auto 40px",
    },
    form: {
      display: "flex",
      gap: 10,
      justifyContent: "center",
      flexWrap: "wrap" as const,
      maxWidth: 480,
      margin: "0 auto",
    },
    input: {
      flex: "1 1 220px",
      padding: "14px 18px",
      borderRadius: 8,
      border: "2px solid #1a1a3a",
      background: "#0f0f28",
      color: "#e8e8ff",
      fontSize: 15,
      outline: "none",
    },
    ctaBtn: {
      background: "#ffd700",
      color: "#1a0600",
      border: "none",
      borderRadius: 8,
      padding: "14px 28px",
      fontWeight: 800,
      fontSize: 15,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    section: {
      maxWidth: 1100,
      margin: "0 auto",
      padding: "80px 24px",
    },
    eyebrow: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 9,
      color: "#ffd700",
      letterSpacing: 3,
      textAlign: "center" as const,
      marginBottom: 16,
    },
    h2: {
      fontSize: "clamp(28px, 4vw, 42px)",
      fontWeight: 800,
      textAlign: "center" as const,
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    h2sub: {
      fontSize: 17,
      color: "#9999cc",
      textAlign: "center" as const,
      marginBottom: 56,
      maxWidth: 520,
      margin: "0 auto 56px",
      lineHeight: 1.6,
    },
  };

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.logo}>⭐ Pointorama</div>
        <button style={S.navCta} onClick={() => document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" })}>
          Get Early Access
        </button>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.badge}>🚀 Now accepting early access signups</div>
        <h1 style={S.h1}>
          Make chores{" "}
          <span style={{ color: "#ffd700" }}>worth doing.</span>
        </h1>
        <p style={S.sub}>
          Pointorama turns good behavior into points kids can spend on real rewards.
          Parents stay in control. Kids stay motivated. Everyone wins.
        </p>

        {/* Email form */}
        <div id="signup">
          {submitted ? (
            <div style={{ background: "rgba(0,255,136,0.08)", border: "2px solid rgba(0,255,136,0.3)", borderRadius: 12, padding: "28px 32px", maxWidth: 480, margin: "0 auto" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: "#00ff88" }}>You&apos;re on the list!</div>
              <div style={{ color: "#9999cc", fontSize: 14, lineHeight: 1.6 }}>
                We&apos;ll email you when Pointorama launches.
                {count && count > 1 ? ` You're #${count} in line.` : ""}
              </div>
            </div>
          ) : (
            <>
              <form style={S.form} onSubmit={join}>
                <input
                  style={S.input}
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button style={S.ctaBtn} type="submit" disabled={loading}>
                  {loading ? "..." : "Get Early Access →"}
                </button>
              </form>
              {error && <div style={{ color: "#ff4455", fontSize: 13, marginTop: 10 }}>{error}</div>}
              <div style={{ fontSize: 12, color: "#6666aa", marginTop: 12 }}>No spam. Unsubscribe anytime.</div>
            </>
          )}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #1a1a3a 20%, #1a1a3a 80%, transparent)", margin: "0 24px" }} />

      {/* How it works */}
      <section style={S.section}>
        <div style={S.eyebrow}>HOW IT WORKS</div>
        <h2 style={S.h2}>Three steps. Zero nagging.</h2>
        <p style={{ ...S.h2sub }}>Set it up once, watch motivation take over.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { n: "01", title: "You set the rules", body: "Decide what earns points — chores, homework, kindness. You control the value of every action." },
            { n: "02", title: "Kids watch their balance grow", body: "They see their points in real time on a gamified dashboard. Levels, progress bars, and unlockable titles keep them hooked." },
            { n: "03", title: "They spend in the reward shop", body: "You stock the shop with prizes you approve. Paste an Amazon link and we handle the rest — price, image, everything." },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ background: "#0f0f28", border: "1px solid #1a1a3a", borderRadius: 12, padding: "32px 28px" }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: "#1a1a3a", marginBottom: 16, WebkitTextStroke: "1px #ffd700" }}>{n}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{title}</div>
              <div style={{ color: "#9999cc", lineHeight: 1.7, fontSize: 15 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...S.section, background: "#0a0a1f", borderRadius: 0, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={S.eyebrow}>FEATURES</div>
          <h2 style={S.h2}>Everything a parent needs.</h2>
          <p style={S.h2sub}>Built by a dad, for parents who want results without constant reminders.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map(({ emoji, title, body }) => (
              <div key={title} style={{ display: "flex", gap: 16, padding: "24px", background: "#0f0f28", borderRadius: 12, border: "1px solid #1a1a3a" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{emoji}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</div>
                  <div style={{ color: "#9999cc", fontSize: 14, lineHeight: 1.7 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section style={S.section}>
        <div style={S.eyebrow}>ROADMAP</div>
        <h2 style={S.h2}>The best is coming.</h2>
        <p style={S.h2sub}>Early access members help shape what gets built first.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, maxWidth: 800, margin: "0 auto" }}>
          {COMING_SOON.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f0f28", border: "1px solid #1a1a3a", borderRadius: 10, padding: "16px 20px" }}>
              <span style={{ color: "#ffd700", fontSize: 14 }}>✦</span>
              <span style={{ fontSize: 14, color: "#ccccee" }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{ ...S.section, background: "#0a0a1f", borderRadius: 0, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={S.eyebrow}>PRICING</div>
          <h2 style={S.h2}>Simple pricing when we launch.</h2>
          <p style={S.h2sub}>Early access members lock in the founding rate — forever.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 700, margin: "0 auto" }}>
            {[
              { name: "Free", price: "$0", desc: "1 child, basic reward shop, manual point entry. Always free.", features: ["1 kid", "Reward shop", "Point tracking", "Telegram alerts"] },
              { name: "Pro", price: "$4.99", per: "/mo", desc: "Everything in Free, plus the features that make it magic.", features: ["Unlimited kids", "Behavior analytics", "Automatic allowance", "Custom themes", "Priority support"], highlight: true },
            ].map(({ name, price, per, desc, features, highlight }) => (
              <div key={name} style={{
                background: highlight ? "linear-gradient(135deg, #1a1a3a, #0f0f28)" : "#0f0f28",
                border: `2px solid ${highlight ? "#ffd700" : "#1a1a3a"}`,
                borderRadius: 16,
                padding: "36px 32px",
                position: "relative" as const,
              }}>
                {highlight && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#ffd700", color: "#1a0600", fontWeight: 800, fontSize: 11, padding: "4px 14px", borderRadius: 99 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{name}</div>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: highlight ? "#ffd700" : "#e8e8ff" }}>{price}</span>
                  {per && <span style={{ color: "#9999cc", fontSize: 15 }}>{per}</span>}
                </div>
                <div style={{ color: "#9999cc", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{desc}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "#ccccee" }}>
                      <span style={{ color: "#00ff88" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: "center", padding: "100px 24px" }}>
        <h2 style={{ ...S.h2, marginBottom: 16 }}>Ready to try it?</h2>
        <p style={{ color: "#9999cc", fontSize: 17, marginBottom: 40, lineHeight: 1.6 }}>
          Join the waitlist. We&apos;ll let you know the moment early access opens.
        </p>
        {!submitted ? (
          <form style={S.form} onSubmit={join}>
            <input
              style={S.input}
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button style={S.ctaBtn} type="submit" disabled={loading}>
              {loading ? "..." : "Join the Waitlist →"}
            </button>
          </form>
        ) : (
          <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 18 }}>🎉 You&apos;re on the list!</div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1a3a", padding: "28px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffd700", marginBottom: 10 }}>⭐ POINTORAMA</div>
        <div style={{ fontSize: 12, color: "#6666aa" }}>© {new Date().getFullYear()} Pointorama. Built by a dad who got tired of repeating himself.</div>
      </footer>
    </div>
  );
}
