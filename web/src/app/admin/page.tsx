"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Prize, Redemption } from "@/db/schema";

type AddMode = "link" | "manual";

export default function AdminPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

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
    const [prizeList, redemptionList] = await Promise.all([
      fetch("/api/prizes").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
    ]);
    setPrizes(prizeList);
    setRedemptions(redemptionList);
  }

  useEffect(() => { loadAll(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
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
      setAmount("");
      setNote("");
    } else {
      toast.error("Failed to add points");
    }
  }

  async function fetchMeta() {
    if (!linkUrl) return;
    setFetchingMeta(true);
    try {
      const res = await fetch("/api/prizes/fetch-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.title) setPrizeName(data.title);
      if (data.image) setPrizeImg(data.image);
      if (data.description) setPrizeDesc(data.description);
      toast.success("Product info fetched!");
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
    setPrizeName("");
    setPrizeDesc("");
    setPrizeCost("");
    setPrizeImg("");
    setLinkUrl("");
    setUploadPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function addPrize(e: React.FormEvent) {
    e.preventDefault();
    const cost = Number(prizeCost);
    if (!prizeName || !cost) return toast.error("Name and point cost are required");
    const res = await fetch("/api/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: prizeName,
        description: prizeDesc,
        pointCost: cost,
        imageUrl: prizeImg || null,
      }),
    });
    if (res.ok) {
      toast.success(`"${prizeName}" added!`);
      resetPrizeForm();
      loadAll();
    } else {
      toast.error("Failed to add prize");
    }
  }

  async function removePrize(id: number, name: string) {
    const res = await fetch(`/api/prizes/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`"${name}" removed`);
      loadAll();
    }
  }

  async function markFulfilled(id: number) {
    const res = await fetch(`/api/redemptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "fulfilled" }),
    });
    if (res.ok) {
      toast.success("Marked as fulfilled!");
      loadAll();
    }
  }

  const pending = redemptions.filter((r) => r.status === "pending");
  const history = redemptions.filter((r) => r.status !== "pending");

  const imagePreview = addMode === "manual" ? uploadPreview : prizeImg;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-700">Admin Panel</h1>
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>

      {/* Pending Redemptions — show first if any */}
      {pending.length > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-700 flex items-center gap-2">
              <span className="text-xl">🔔</span> Pending Redemptions ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
              >
                <div>
                  <p className="font-semibold">{r.prizeName}</p>
                  <p className="text-xs text-gray-400">
                    {r.pointsSpent} pts &middot; {new Date(r.redeemedAt + "Z").toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => markFulfilled(r.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Fulfill
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points */}
        <Card>
          <CardHeader>
            <CardTitle>Add / Deduct Points</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPoints} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="amount">Points (negative to deduct)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 10 or -5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  placeholder="e.g. Great day at school!"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Save Points
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add Prize */}
        <Card>
          <CardHeader>
            <CardTitle>Add Prize</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAddMode("link")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  addMode === "link"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                From Link
              </button>
              <button
                type="button"
                onClick={() => setAddMode("manual")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  addMode === "manual"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Manual
              </button>
            </div>

            <form onSubmit={addPrize} className="space-y-3">
              {addMode === "link" && (
                <div className="space-y-1">
                  <Label>Product URL (Amazon, Lego, etc.)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://www.amazon.com/..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchMeta}
                      disabled={fetchingMeta || !linkUrl}
                      className="shrink-0"
                    >
                      {fetchingMeta ? "..." : "Fetch"}
                    </Button>
                  </div>
                </div>
              )}

              {addMode === "manual" && (
                <div className="space-y-1">
                  <Label>Upload Image</Label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              )}

              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-36 object-cover rounded-lg border"
                />
              )}

              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Minecraft Legends"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Short description..."
                  value={prizeDesc}
                  onChange={(e) => setPrizeDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Point Cost</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 50"
                  value={prizeCost}
                  onChange={(e) => setPrizeCost(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Add Prize
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Current Prizes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Prizes ({prizes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {prizes.length === 0 && (
            <p className="text-gray-400 text-center py-6">No prizes yet</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {prizes.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-lg border overflow-hidden"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-28 object-cover"
                  />
                ) : (
                  <div className="w-full h-28 bg-indigo-50 flex items-center justify-center text-4xl">
                    🎁
                  </div>
                )}
                <div className="p-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-600 mt-0.5">
                      {p.pointCost} pts
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="shrink-0 text-xs h-7 px-2"
                    onClick={() => removePrize(p.id, p.name)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500">Redemption History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-gray-500"
              >
                <div>
                  <p className="font-medium text-sm">{r.prizeName}</p>
                  <p className="text-xs text-gray-400">
                    {r.pointsSpent} pts &middot;{" "}
                    {new Date(r.redeemedAt + "Z").toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    r.status === "fulfilled"
                      ? "border-green-400 text-green-600"
                      : "border-gray-300 text-gray-400"
                  }
                >
                  {r.status === "fulfilled" ? "✓ Fulfilled" : "Cancelled"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
