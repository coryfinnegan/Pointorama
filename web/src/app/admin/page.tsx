"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Prize, Redemption, AllowanceSettings } from "@/db/schema";

type AddMode = "link" | "manual";

export default function AdminPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [tab, setTab] = useState<"points" | "prizes" | "pending">("points");

  // Quick-add token (Siri)
  const [quickToken, setQuickToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  async function loadToken() {
    const res = await fetch("/api/quick-add-token");
    if (res.ok) setQuickToken((await res.json()).token);
  }

  async function regenerateToken() {
    const res = await fetch("/api/quick-add-token", { method: "POST" });
    if (res.ok) setQuickToken((await res.json()).token);
  }

  function copyToken() {
    if (!quickToken) return;
    navigator.clipboard.writeText(quickToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  }

  // Allowance + exchange rate
  const [allowance, setAllowance] = useState<AllowanceSettings | null>(null);
  const [alAmount, setAlAmount] = useState("");
  const [alMoney, setAlMoney] = useState("");
  const [alRate, setAlRate] = useState("10"); // pts per $1
  const [savingAl, setSavingAl] = useState(false);

  // Points form
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // Add prize
  const [addMode, setAddMode] = useState<AddMode>("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [prizeName, setPrizeName] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [prizeCost, setPrizeCost] = useState("");
  const [prizeImg, setPrizeImg] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    const [prizeList, redemptionList, al] = await Promise.all([
      fetch("/api/prizes").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
      fetch("/api/allowance").then((r) => r.json()),
    ]);
    setPrizes(prizeList);
    setRedemptions(redemptionList);
    setAllowance(al);
    setAlAmount(String(al.weeklyAmount ?? 0));
    setAlMoney(al.weeklyMoneyCents ? (al.weeklyMoneyCents / 100).toFixed(2) : "");
    setAlRate(String(al.exchangeRate ?? 10));
  }

  useEffect(() => { loadAll(); loadToken(); setOrigin(window.location.origin); }, []);

  async function saveAllowance(enabled: boolean) {
    setSavingAl(true);
    const amt = Number(alAmount);
    const moneyCents = alMoney ? Math.round(parseFloat(alMoney) * 100) : 0;
    if (isNaN(amt) || amt < 0 || isNaN(moneyCents) || moneyCents < 0) {
      toast.error("Invalid amount"); setSavingAl(false); return;
    }
    const res = await fetch("/api/allowance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyAmount: amt, weeklyMoneyCents: moneyCents, exchangeRate: Number(alRate) || 10, enabled }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAllowance(updated);
      const parts = [];
      if (amt > 0) parts.push(`${amt} pts`);
      if (moneyCents > 0) parts.push(`$${(moneyCents / 100).toFixed(2)}`);
      toast.success(enabled ? `Allowance: ${parts.join(" + ")}/week` : "Allowance disabled");
    } else {
      toast.error("Failed to save");
    }
    setSavingAl(false);
  }

  async function payNow() {
    const hasPoints = (allowance?.weeklyAmount ?? 0) > 0;
    const hasMoney = (allowance?.weeklyMoneyCents ?? 0) > 0;
    if (!hasPoints && !hasMoney) return;
    const jobs: Promise<Response>[] = [];
    if (hasPoints) jobs.push(fetch("/api/points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: allowance!.weeklyAmount, note: "💰 Manual allowance payment" }) }));
    if (hasMoney) jobs.push(fetch("/api/money", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountCents: allowance!.weeklyMoneyCents, note: "💵 Manual allowance payment" }) }));
    await Promise.all(jobs);
    const parts = [];
    if (hasPoints) parts.push(`+${allowance!.weeklyAmount} pts`);
    if (hasMoney) parts.push(`+$${(allowance!.weeklyMoneyCents / 100).toFixed(2)}`);
    toast.success(`Paid! ${parts.join(" ")}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function addPoints(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n) return toast.error("Enter a valid number");
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: n, note }),
    });
    if (res.ok) {
      toast.success(`${n > 0 ? "+" : ""}${n} points saved!`);
      setAmount(""); setNote("");
    } else {
      toast.error("Failed");
    }
  }

  const [fetchedNoImage, setFetchedNoImage] = useState(false);
  const [fetchedPriceCents, setFetchedPriceCents] = useState<number | null>(null);
  const [manualPriceDollars, setManualPriceDollars] = useState("");

  async function fetchMeta() {
    if (!linkUrl) return;
    setFetchingMeta(true);
    setFetchedNoImage(false);
    setFetchedPriceCents(null);
    setManualPriceDollars("");
    try {
      const res = await fetch("/api/prizes/fetch-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.title) setPrizeName(data.title);
      if (data.image) {
        setPrizeImg(data.image);
      } else {
        setFetchedNoImage(true);
      }
      if (data.description) setPrizeDesc(data.description);
      if (data.priceCents) {
        setFetchedPriceCents(data.priceCents);
        setManualPriceDollars((data.priceCents / 100).toFixed(2));
        const rate = Number(alRate) || 10;
        setPrizeCost(String(Math.round(data.priceCents / 100 * rate)));
      }
      toast.success(data.image ? "Fetched!" : "Fetched — paste image URL below");
    } catch (err) {
      toast.error(`Could not fetch: ${err}`);
    } finally {
      setFetchingMeta(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/images", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setPrizeImg(url);
      toast.success("Image uploaded!");
    } else {
      toast.error("Upload failed");
      setUploadPreview("");
    }
  }

  function resetPrizeForm() {
    setPrizeName(""); setPrizeDesc(""); setPrizeCost(""); setPrizeImg("");
    setLinkUrl(""); setUploadPreview(""); setFetchedNoImage(false); setFetchedPriceCents(null); setManualPriceDollars("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function addPrize(e: React.FormEvent) {
    e.preventDefault();
    const cost = Number(prizeCost);
    if (!prizeName || !cost) return toast.error("Name and point cost required");
    const res = await fetch("/api/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: prizeName, description: prizeDesc, pointCost: cost, imageUrl: prizeImg || null }),
    });
    if (res.ok) { toast.success(`"${prizeName}" added!`); resetPrizeForm(); loadAll(); }
    else toast.error("Failed");
  }

  async function removePrize(id: number, name: string) {
    const res = await fetch(`/api/prizes/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(`"${name}" removed`); loadAll(); }
  }

  async function markFulfilled(id: number) {
    const res = await fetch(`/api/redemptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "fulfilled" }),
    });
    if (res.ok) { toast.success("Fulfilled!"); loadAll(); }
  }

  const pending = redemptions.filter((r) => r.status === "pending");
  const history = redemptions.filter((r) => r.status !== "pending");
  const imagePreview = addMode === "manual" ? uploadPreview : prizeImg;

  const TABS = [
    { id: "points" as const, label: "⭐ POINTS" },
    { id: "prizes" as const, label: "🎁 PRIZES" },
    { id: "pending" as const, label: `🔔 PENDING${pending.length ? ` (${pending.length})` : ""}` },
  ];

  return (
    <div className="game-screen">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 11, color: "var(--gold)" }}>🔑 PARENT PANEL</div>
        <button className="pbtn pbtn-red" style={{ fontSize: 8, padding: "8px 12px" }} onClick={logout}>LOGOUT</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, fontFamily: "var(--pixel)", fontSize: 9,
              padding: "12px 6px",
              background: tab === t.id ? "var(--gold)" : "var(--bg2)",
              color: tab === t.id ? "#1a0600" : "var(--dim)",
              border: `2px solid ${tab === t.id ? "var(--gold)" : "var(--bg3)"}`,
              cursor: "pointer", borderRadius: 2, transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Points tab */}
      {tab === "points" && (
        <div>
          <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 14, letterSpacing: 2 }}>QUICK ADD</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
            {[5, 10, 15, 20, 25, 30, 50, 100].map((n) => (
              <button
                key={n}
                className="pbtn pbtn-green"
                style={{ fontSize: 11, padding: "14px 8px" }}
                onClick={async () => {
                  const res = await fetch("/api/points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, note: "Bonus" }) });
                  if (res.ok) toast.success(`+${n} points!`);
                }}
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="pcard">
            <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 10 }}>CUSTOM AMOUNT</div>
            <form onSubmit={addPoints} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="number" placeholder="Points (negative to deduct)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <input type="text" placeholder="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button type="submit" className="pbtn pbtn-gold" style={{ width: "100%" }}>AWARD POINTS</button>
            </form>
          </div>

          {/* Exchange rate */}
          <div className="pcard" style={{ marginBottom: 0 }}>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginBottom: 12, letterSpacing: 1 }}>💱 EXCHANGE RATE</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", flexShrink: 0 }}>$1.00 =</span>
              <input
                type="number"
                min={1}
                value={alRate}
                onChange={(e) => setAlRate(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--gold)", flexShrink: 0 }}>pts</span>
            </div>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 7, color: "var(--dim)", marginTop: 8 }}>
              Used when adding prizes from a link. Save via the allowance SAVE button below.
            </div>
          </div>

          {/* Siri Shortcut */}
          <div className="pcard" style={{ marginBottom: 0 }}>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginBottom: 12, letterSpacing: 1 }}>🎙️ SIRI SHORTCUT</div>
            {quickToken ? (
              <>
                <div style={{ fontSize: 13, color: "var(--dim)", marginBottom: 10, lineHeight: 1.5 }}>
                  iOS blocks unsigned shortcut imports, so you&apos;ll need to create it manually once — it takes about 2 minutes.
                </div>
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--gold)", marginBottom: 6 }}>YOUR QUICK-ADD URL</div>
                <div style={{
                  background: "var(--bg)", border: "2px solid var(--bg3)", borderRadius: 2,
                  padding: "10px 12px", fontSize: 11, color: "var(--text)", wordBreak: "break-all",
                  marginBottom: 10, lineHeight: 1.5,
                }}>
                  {`${process.env.NEXT_PUBLIC_SERVER_URL ?? origin}/api/quick-add?token=${quickToken}&amount=\${Amount}&note=\${Reason}`}
                </div>
                <button className="pbtn pbtn-gold" style={{ fontSize: 9, padding: "10px", width: "100%", marginBottom: 14 }} onClick={() => {
                  navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SERVER_URL ?? origin}/api/quick-add?token=${quickToken}&amount=\${Amount}&note=\${Reason}`);
                  setTokenCopied(true); setTimeout(() => setTokenCopied(false), 2000);
                }}>
                  {tokenCopied ? "✓ COPIED" : "COPY URL"}
                </button>
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--gold)", marginBottom: 8 }}>SETUP STEPS</div>
                <ol style={{ fontSize: 12, color: "var(--dim)", lineHeight: 2, paddingLeft: 18, margin: 0 }}>
                  <li>Open the <strong style={{ color: "var(--text)" }}>Shortcuts</strong> app → tap <strong style={{ color: "var(--text)" }}>+</strong></li>
                  <li>Add <strong style={{ color: "var(--text)" }}>Ask for Input</strong> → type: Number → prompt: "How many points?"</li>
                  <li>Add <strong style={{ color: "var(--text)" }}>Set Variable</strong> → name: Amount</li>
                  <li>Add <strong style={{ color: "var(--text)" }}>Ask for Input</strong> → type: Text → prompt: "Reason?"</li>
                  <li>Add <strong style={{ color: "var(--text)" }}>Set Variable</strong> → name: Reason</li>
                  <li>Add <strong style={{ color: "var(--text)" }}>Get Contents of URL</strong> → paste URL above, replace <code style={{ color: "var(--gold)" }}>${"{Amount}"}</code> and <code style={{ color: "var(--gold)" }}>${"{Reason}"}</code> with the matching variables</li>
                  <li>Tap the shortcut name → rename to <strong style={{ color: "var(--text)" }}>"Add {process.env.NEXT_PUBLIC_KID_NAME ?? "Sam"} Points"</strong></li>
                  <li>Tap <strong style={{ color: "var(--text)" }}>Add to Siri</strong></li>
                </ol>
                <button className="pbtn pbtn-dim" style={{ fontSize: 8, padding: "8px 12px", width: "100%", marginTop: 12 }} onClick={regenerateToken}>
                  REGENERATE TOKEN
                </button>
              </>
            ) : (
              <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)" }}>Loading…</div>
            )}
          </div>

          {/* Allowance settings */}
          <div className="pcard" style={{ border: allowance?.enabled ? "2px solid rgba(68,136,255,0.4)" : "2px solid var(--bg3)", background: allowance?.enabled ? "rgba(68,136,255,0.06)" : "var(--bg2)", marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: allowance?.enabled ? "var(--blue)" : "var(--dim)", letterSpacing: 1 }}>
                💰 WEEKLY ALLOWANCE
              </div>
              {allowance?.enabled && (
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--green)" }}>● ACTIVE</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                min={0}
                placeholder="Points per week"
                value={alAmount}
                onChange={(e) => setAlAmount(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", alignSelf: "center", flexShrink: 0 }}>pts / wk</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--pixel)", fontSize: 14, color: "var(--green)", alignSelf: "center", flexShrink: 0 }}>$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={alMoney}
                onChange={(e) => setAlMoney(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", alignSelf: "center", flexShrink: 0 }}>/ wk</span>
            </div>

            {allowance?.nextPayAt && allowance.enabled && (
              <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 12 }}>
                NEXT PAYOUT:{" "}
                <span style={{ color: "var(--blue)" }}>
                  {new Date(allowance.nextPayAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`pbtn ${allowance?.enabled ? "pbtn-dim" : "pbtn-blue"}`}
                style={{ fontSize: 9, padding: "10px 14px", flex: 1 }}
                disabled={savingAl}
                onClick={() => saveAllowance(!allowance?.enabled)}
              >
                {savingAl ? "..." : allowance?.enabled ? "DISABLE" : "ENABLE"}
              </button>
              <button
                className="pbtn pbtn-blue"
                style={{ fontSize: 9, padding: "10px 14px", flex: 1 }}
                disabled={savingAl}
                onClick={() => saveAllowance(allowance?.enabled ?? false)}
              >
                SAVE
              </button>
              {allowance?.enabled && (
                <button
                  className="pbtn pbtn-green"
                  style={{ fontSize: 9, padding: "10px 14px", flex: 1 }}
                  onClick={payNow}
                >
                  PAY NOW
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prizes tab */}
      {tab === "prizes" && (
        <div>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {(["link", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setAddMode(m)}
                style={{
                  flex: 1, fontFamily: "var(--pixel)", fontSize: 9, padding: "12px 6px",
                  background: addMode === m ? "var(--blue)" : "var(--bg2)",
                  color: addMode === m ? "#fff" : "var(--dim)",
                  border: `2px solid ${addMode === m ? "var(--blue)" : "var(--bg3)"}`,
                  cursor: "pointer", borderRadius: 2,
                }}
              >
                {m === "link" ? "FROM LINK" : "MANUAL"}
              </button>
            ))}
          </div>

          <form onSubmit={addPrize} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {addMode === "link" && (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="url" placeholder="https://amazon.com/..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="pbtn pbtn-blue" style={{ fontSize: 9, padding: "10px 14px", flexShrink: 0 }} onClick={fetchMeta} disabled={fetchingMeta || !linkUrl}>
                    {fetchingMeta ? "..." : "FETCH"}
                  </button>
                </div>
                {/* Shown when fetch succeeded but Amazon blocked the image */}
                {fetchedNoImage && (
                  <div>
                    <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--gold)", marginBottom: 6 }}>
                      ⚠ SITE BLOCKED IMAGE AUTO-FETCH
                    </div>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 6 }}>
                      On Amazon: right-click the product photo → <em>Copy image address</em>, then paste below.
                    </div>
                    <input
                      type="url"
                      placeholder="Paste image URL here..."
                      value={prizeImg}
                      onChange={(e) => setPrizeImg(e.target.value)}
                    />
                  </div>
                )}
                {/* Price → points converter, always visible in link mode */}
                {prizeName && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--pixel)", fontSize: 13, color: "var(--green)", flexShrink: 0 }}>$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={fetchedPriceCents ? (fetchedPriceCents / 100).toFixed(2) : "Enter price..."}
                      value={manualPriceDollars}
                      onChange={(e) => {
                        setManualPriceDollars(e.target.value);
                        setFetchedPriceCents(null);
                        const dollars = parseFloat(e.target.value);
                        if (!isNaN(dollars) && dollars > 0) {
                          setPrizeCost(String(Math.round(dollars * (Number(alRate) || 10))));
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    {manualPriceDollars && (
                      <span style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--gold)", flexShrink: 0 }}>
                        = {Math.round(parseFloat(manualPriceDollars) * (Number(alRate) || 10))} pts
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
            {addMode === "manual" && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ fontFamily: "var(--body)", fontSize: 13, padding: 8, background: "var(--bg)", border: "2px solid var(--bg3)", borderRadius: 2, cursor: "pointer" }}
                />
              </div>
            )}
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 3, border: "2px solid var(--bg3)" }} />
            )}
            <input type="text" placeholder="Prize name" value={prizeName} onChange={(e) => setPrizeName(e.target.value)} required />
            <textarea placeholder="Description (optional)" value={prizeDesc} onChange={(e) => setPrizeDesc(e.target.value)} rows={2} style={{ fontFamily: "var(--pixel)", fontSize: 10, resize: "vertical" }} />
            <input type="number" placeholder="Point cost" min={1} value={prizeCost} onChange={(e) => { setPrizeCost(e.target.value); setFetchedPriceCents(null); }} required />
            <button type="submit" className="pbtn pbtn-gold" style={{ width: "100%" }}>ADD PRIZE</button>
          </form>

          {/* Current prizes */}
          {prizes.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 12, letterSpacing: 2 }}>ACTIVE PRIZES ({prizes.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {prizes.map((p) => (
                  <div key={p.id} className="pcard" style={{ padding: 0, overflow: "hidden", marginBottom: 0 }}>
                    <div style={{ width: "100%", height: 100, background: "var(--bg3)", overflow: "hidden" }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> // eslint-disable-line @next/next/no-img-element
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🎁</div>
                      }
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--text)", marginBottom: 6, lineHeight: 1.6 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--gold)" }}>{p.pointCost} ⭐</span>
                        <button className="pbtn pbtn-red" style={{ fontSize: 7, padding: "5px 8px" }} onClick={() => removePrize(p.id, p.name)}>DEL</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending tab */}
      {tab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div style={{ textAlign: "center", fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", paddingTop: 40, lineHeight: 3 }}>
              ALL CLEAR!<br />NO PENDING REDEMPTIONS
            </div>
          ) : (
            pending.map((r) => (
              <div key={r.id} className="pcard pcard-gold" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{r.prizeName}</div>
                  <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginTop: 4 }}>
                    {r.pointsSpent} pts · {new Date(r.redeemedAt + "Z").toLocaleDateString()}
                  </div>
                </div>
                <button className="pbtn pbtn-green" style={{ fontSize: 9, padding: "10px 14px", flexShrink: 0 }} onClick={() => markFulfilled(r.id)}>
                  ✓ DONE
                </button>
              </div>
            ))
          )}

          {history.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 12, letterSpacing: 2 }}>HISTORY</div>
              {history.map((r) => (
                <div key={r.id} className="pcard" style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.7 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{r.prizeName}</div>
                    <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginTop: 4 }}>
                      {r.pointsSpent} pts · {new Date(r.redeemedAt + "Z").toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: r.status === "fulfilled" ? "var(--green)" : "var(--dim)" }}>
                    {r.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
