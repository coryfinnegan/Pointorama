"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Prize, Redemption } from "@/db/schema";

export default function AdminPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  // Add points form
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // Add prize form
  const [prizeName, setPrizeName] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [prizeCost, setPrizeCost] = useState("");
  const [prizeImg, setPrizeImg] = useState("");

  async function loadAll() {
    const [prizeList, redemptionList] = await Promise.all([
      fetch("/api/prizes").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
    ]);
    setPrizes(prizeList);
    setRedemptions(redemptionList);
  }

  useEffect(() => { loadAll(); }, []);

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
      toast.success(`${n > 0 ? "+" : ""}${n} points added!`);
      setAmount("");
      setNote("");
    } else {
      toast.error("Failed to add points");
    }
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
      toast.success(`Prize "${prizeName}" added!`);
      setPrizeName("");
      setPrizeDesc("");
      setPrizeCost("");
      setPrizeImg("");
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
  const fulfilled = redemptions.filter((r) => r.status === "fulfilled");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-indigo-700">Admin Panel 🛠️</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Points */}
        <Card>
          <CardHeader>
            <CardTitle>Add / Remove Points</CardTitle>
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
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  placeholder="e.g. Great day at school!"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Add Points
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add Prize */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Prize</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPrize} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="pname">Prize Name</Label>
                <Input
                  id="pname"
                  placeholder="e.g. Minecraft Skin Pack"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pdesc">Description (optional)</Label>
                <Textarea
                  id="pdesc"
                  placeholder="Describe the prize..."
                  value={prizeDesc}
                  onChange={(e) => setPrizeDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pcost">Point Cost</Label>
                <Input
                  id="pcost"
                  type="number"
                  min={1}
                  placeholder="e.g. 50"
                  value={prizeCost}
                  onChange={(e) => setPrizeCost(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pimg">Image URL (optional)</Label>
                <Input
                  id="pimg"
                  type="url"
                  placeholder="https://..."
                  value={prizeImg}
                  onChange={(e) => setPrizeImg(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Add Prize
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Pending Redemptions */}
      {pending.length > 0 && (
        <Card className="border-2 border-yellow-300">
          <CardHeader>
            <CardTitle className="text-yellow-700">Pending Redemptions 🔔</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{r.prizeName}</p>
                  <p className="text-xs text-gray-400">{r.pointsSpent} pts</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => markFulfilled(r.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Fulfilled ✓
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Redemption History */}
      {fulfilled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500">Redemption History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fulfilled.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 text-gray-500">
                <div>
                  <p className="font-medium">{r.prizeName}</p>
                  <p className="text-xs text-gray-400">
                    {r.pointsSpent} pts &middot;{" "}
                    {new Date(r.redeemedAt + "Z").toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="border-green-400 text-green-600">
                  ✓ Fulfilled
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manage Prizes */}
      <Card>
        <CardHeader>
          <CardTitle>Current Prizes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {prizes.length === 0 && (
            <p className="text-gray-400 text-center py-4">No prizes yet</p>
          )}
          {prizes.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{p.name}</p>
                {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-400 text-indigo-600">
                  {p.pointCost} pts
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removePrize(p.id, p.name)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
