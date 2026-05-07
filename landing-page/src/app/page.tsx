"use client";
import { useState } from "react";

const FEATURES = [
  {
    emoji: "✅",
    title: "Kids always know what to do",
    body: "Set up chores and behavior goals once. Kids open the app to see exactly what earns points — and go do it. Clear expectations, consistent rewards.",
  },
  {
    emoji: "🛒",
    title: "A reward shop they'll actually work for",
    body: "Paste any Amazon, Nintendo, or LEGO link. Price and image pull automatically. When kids choose their own rewards and save up for them, they earn without being asked.",
  },
  {
    emoji: "⚡",
    title: "Add points in 5 seconds, anywhere",
    body: "Good behavior has a 10-second window. Add points instantly from Siri, a Telegram message, or one tap. Catch the moment before it passes.",
  },
  {
    emoji: "👨‍👩‍👧‍👦",
    title: "Built for your whole family",
    body: "Unlimited kids, individual goals, separate reward shops. Every child has their own journey — and their own reasons to earn.",
  },
  {
    emoji: "💰",
    title: "Sneak in real money skills",
    body: "Mix points with actual money allowance. Kids learn to save, prioritize, and make real tradeoffs — the habits that outlast childhood.",
  },
  {
    emoji: "🤖",
    title: "Set it and let it run",
    body: "Automated weekly allowances, recurring task resets, and instant alerts when rewards are redeemed. The system works on your busiest days.",
  },
];

const COMING_SOON = [
  "Behavior streaks & bonus multipliers",
  "Chore schedules & reminders",
  "Weekly progress reports",
  "iOS & Android app",
  "Sibling leaderboards",
  "Screen time as a reward",
];

const STEPS = [
  {
    n: "01",
    title: "You set the rules",
    body: "Name chores, set point values, stock the reward shop. Takes 10 minutes. You're in control of everything that earns and everything that's redeemable.",
  },
  {
    n: "02",
    title: "Kids chase the shop",
    body: "They see their balance, their level, and the prizes they're saving for. Motivation comes from within — kids track their own progress and push themselves.",
  },
  {
    n: "03",
    title: "You approve, they celebrate",
    body: "Get alerted the moment they redeem something — with a direct link to buy it. One tap. Done. Repeat.",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setSubmitted(true);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  const scrollToSignup = () => document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });

  const EmailForm = ({ placeholder = "your@email.com", btnText = "Get Early Access →" }) => (
    submitted ? (
      <div style={{ background: "rgba(0,255,136,0.08)", border: "2px solid rgba(0,255,136,0.25)", borderRadius: 12, padding: "24px 28px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#00ff88", marginBottom: 6 }}>You&apos;re on the list!</div>
        <div style={{ color: "#9999cc", fontSize: 14, lineHeight: 1.6 }}>We&apos;ll email you the moment early access opens.</div>
      </div>
    ) : (
      <>
        <form onSubmit={join} style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 480, margin: "0 auto" }}>
          <input
            type="email"
            required
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: "1 1 200px", padding: "14px 18px", borderRadius: 8, border: "2px solid #1a1a3a", background: "#0f0f28", color: "#e8e8ff", fontSize: 15, outline: "none" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: "#ffd700", color: "#1a0600", border: "none", borderRadius: 8, padding: "14px 24px", fontWeight: 800, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {loading ? "..." : btnText}
          </button>
        </form>
        {error && <div style={{ color: "#ff4455", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</div>}
        <div style={{ fontSize: 12, color: "#6666aa", marginTop: 10, textAlign: "center" }}>No spam. No credit card. Unsubscribe anytime.</div>
      </>
    )
  );

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#ffd700" }}>⭐ Pointorama</div>
        <button
          onClick={scrollToSignup}
          style={{ background: "#ffd700", color: "#1a0600", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Get Early Access
        </button>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 24px 70px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 99, padding: "6px 16px", fontSize: 12, color: "#ffd700", marginBottom: 28, letterSpacing: 0.5 }}>
          🚀 Early access — be the first to try it
        </div>
        <h1 style={{ fontSize: "clamp(38px, 7vw, 72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 22, letterSpacing: -1.5 }}>
          Good behavior{" "}
          <span style={{ color: "#ffd700" }}>deserves a reward.</span>
        </h1>
        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#9999cc", lineHeight: 1.75, marginBottom: 44, maxWidth: 580, margin: "0 auto 44px" }}>
          Pointorama helps families build a reward system kids genuinely get excited about —
          real prizes, real progress, and habits that actually stick.
        </p>
        <div id="signup">
          <EmailForm />
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #1a1a3a 20%, #1a1a3a 80%, transparent)", margin: "0 24px" }} />

      {/* Social proof placeholder */}
      <div style={{ textAlign: "center", padding: "32px 24px", color: "#6666aa", fontSize: 14 }}>
        Works for kids ages 5–16.&nbsp;&nbsp;·&nbsp;&nbsp;No app install required.&nbsp;&nbsp;·&nbsp;&nbsp;Free to get started.
      </div>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #1a1a3a 20%, #1a1a3a 80%, transparent)", margin: "0 24px" }} />

      {/* How it works */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 24px" }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffd700", letterSpacing: 3, textAlign: "center", marginBottom: 16 }}>HOW IT WORKS</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, textAlign: "center", marginBottom: 14, letterSpacing: -0.5 }}>Up and running in minutes.</h2>
        <p style={{ fontSize: 17, color: "#9999cc", textAlign: "center", marginBottom: 60, maxWidth: 500, margin: "0 auto 60px", lineHeight: 1.65 }}>A reward system the whole family will actually use.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {STEPS.map(({ n, title, body }) => (
            <div key={n} style={{ background: "#0f0f28", border: "1px solid #1a1a3a", borderRadius: 14, padding: "36px 30px" }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 30, color: "transparent", WebkitTextStroke: "1.5px #ffd700", marginBottom: 20 }}>{n}</div>
              <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 12 }}>{title}</div>
              <div style={{ color: "#9999cc", lineHeight: 1.75, fontSize: 15 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "#0a0a1f", padding: "90px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffd700", letterSpacing: 3, textAlign: "center", marginBottom: 16 }}>FEATURES</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, textAlign: "center", marginBottom: 14, letterSpacing: -0.5 }}>Everything you need. Nothing you don&apos;t.</h2>
          <p style={{ fontSize: 17, color: "#9999cc", textAlign: "center", marginBottom: 60, maxWidth: 520, margin: "0 auto 60px", lineHeight: 1.65 }}>Designed around how real families actually work — chaotic schedules, short attention spans, and all.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {FEATURES.map(({ emoji, title, body }) => (
              <div key={title} style={{ display: "flex", gap: 18, padding: "26px 24px", background: "#0f0f28", borderRadius: 14, border: "1px solid #1a1a3a" }}>
                <div style={{ fontSize: 30, flexShrink: 0, lineHeight: 1 }}>{emoji}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</div>
                  <div style={{ color: "#9999cc", fontSize: 14, lineHeight: 1.75 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 24px" }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffd700", letterSpacing: 3, textAlign: "center", marginBottom: 16 }}>ROADMAP</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, textAlign: "center", marginBottom: 14, letterSpacing: -0.5 }}>The best is still coming.</h2>
        <p style={{ fontSize: 17, color: "#9999cc", textAlign: "center", marginBottom: 54, maxWidth: 500, margin: "0 auto 54px", lineHeight: 1.65 }}>Early access members shape what gets built first.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, maxWidth: 820, margin: "0 auto" }}>
          {COMING_SOON.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0f0f28", border: "1px solid #1a1a3a", borderRadius: 10, padding: "16px 20px" }}>
              <span style={{ color: "#ffd700", fontSize: 13, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 14, color: "#ccccee" }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: "#0a0a1f", padding: "90px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ffd700", letterSpacing: 3, textAlign: "center", marginBottom: 16 }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, textAlign: "center", marginBottom: 14, letterSpacing: -0.5 }}>Simple pricing when we launch.</h2>
          <p style={{ fontSize: 17, color: "#9999cc", textAlign: "center", marginBottom: 60, maxWidth: 480, margin: "0 auto 60px", lineHeight: 1.65 }}>
            Early access members lock in the founding rate — forever.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 700, margin: "0 auto" }}>
            {[
              {
                name: "Free", price: "$0", per: "", highlight: false,
                desc: "Perfect for getting started with one child.",
                features: ["1 child", "Unlimited point tracking", "Full reward shop", "Telegram alerts", "Automatic allowance"],
              },
              {
                name: "Pro", price: "$4.99", per: "/mo", highlight: true,
                desc: "For families who want the full picture.",
                features: ["Unlimited children", "Behavior analytics", "Custom themes & avatars", "Priority support", "Early access to new features"],
              },
            ].map(({ name, price, per, desc, features, highlight }) => (
              <div key={name} style={{ background: highlight ? "linear-gradient(135deg, #1c1c3e, #0f0f28)" : "#0f0f28", border: `2px solid ${highlight ? "#ffd700" : "#1a1a3a"}`, borderRadius: 16, padding: "36px 32px", position: "relative" }}>
                {highlight && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#ffd700", color: "#1a0600", fontWeight: 800, fontSize: 11, padding: "4px 16px", borderRadius: 99, whiteSpace: "nowrap" }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{name}</div>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: highlight ? "#ffd700" : "#e8e8ff" }}>{price}</span>
                  {per && <span style={{ color: "#9999cc", fontSize: 15 }}>{per}</span>}
                </div>
                <div style={{ color: "#9999cc", fontSize: 14, marginBottom: 24, lineHeight: 1.65 }}>{desc}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#ccccee" }}>
                      <span style={{ color: "#00ff88", flexShrink: 0 }}>✓</span>{f}
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
        <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, marginBottom: 18, letterSpacing: -1 }}>
          Ready to make rewards work?
        </h2>
        <p style={{ color: "#9999cc", fontSize: 18, marginBottom: 44, lineHeight: 1.65, maxWidth: 480, margin: "0 auto 44px" }}>
          Join the waitlist. Be the first to know when early access opens.
        </p>
        <EmailForm placeholder="your@email.com" btnText="Join the Waitlist →" />
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1a3a", padding: "30px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffd700", marginBottom: 10 }}>⭐ POINTORAMA</div>
        <div style={{ fontSize: 12, color: "#6666aa" }}>© {new Date().getFullYear()} Pointorama · A better way to reward kids.</div>
      </footer>

    </div>
  );
}
