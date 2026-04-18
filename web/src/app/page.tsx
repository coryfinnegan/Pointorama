"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLevel } from "@/lib/levels";
import type { PointsLog, Redemption } from "@/db/schema";

type PointsData = { total: number; logs: PointsLog[] };

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const prev = useRef(0);

  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    }

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(s: string) {
  return new Date(s + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const KID_NAME = process.env.NEXT_PUBLIC_KID_NAME ?? "Champion";

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<PointsData | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/points").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
    ]).then(([pts, red]) => {
      setData(pts);
      setRedemptions(red);
    });
  }, []);

  const spent = redemptions
    .filter((r) => r.status !== "cancelled")
    .reduce((s, r) => s + r.pointsSpent, 0);
  const totalEarned = data?.total ?? 0;
  const available = totalEarned - spent;

  const totalDisplay     = useCountUp(totalEarned);
  const availableDisplay = useCountUp(available);
  const spentDisplay     = useCountUp(spent);

  const { level, next, progressPct } = getLevel(totalEarned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <p className="text-5xl mb-3">{level.emoji}</p>
        <h1 className="text-4xl font-bold text-indigo-700 mb-1">
          Hi, {KID_NAME}!
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge className="bg-indigo-600 text-white text-sm px-3 py-1">
            {level.emoji} {level.name}
          </Badge>
        </div>
        {next && (
          <div className="mt-4 max-w-xs mx-auto space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{level.name}</span>
              <span>{next.name} at {next.min} pts</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <p className="text-xs text-gray-400 text-center">
              {next.min - totalEarned} more pts to reach {next.emoji} {next.name}
            </p>
          </div>
        )}
        {!next && (
          <p className="text-sm text-yellow-600 font-semibold mt-2">
            You&apos;ve reached the highest rank! 👑
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-600 text-lg">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-indigo-700 tabular-nums">
              {data === null ? "—" : totalDisplay}
            </p>
            <p className="text-sm text-indigo-400 mt-1">points earned ever</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-600 text-lg">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-purple-700 tabular-nums">
              {data === null ? "—" : availableDisplay}
            </p>
            <p className="text-sm text-purple-400 mt-1">points to spend</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-pink-600 text-lg">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-pink-700 tabular-nums">
              {data === null ? "—" : spentDisplay}
            </p>
            <p className="text-sm text-pink-400 mt-1">points redeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent points */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Points</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.logs.length === 0 && (
            <p className="text-gray-400 text-center py-4">No points yet — check back after school!</p>
          )}
          <ul className="space-y-2">
            {data?.logs.slice(0, 10).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-700">{entry.note || "Points added"}</p>
                  <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
                </div>
                <Badge
                  variant={entry.amount > 0 ? "default" : "destructive"}
                  className={entry.amount > 0 ? "bg-green-500 text-white" : ""}
                >
                  {entry.amount > 0 ? "+" : ""}{entry.amount} pts
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recent redemptions */}
      {redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {redemptions.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-700">{r.prizeName}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.redeemedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{r.pointsSpent} pts</Badge>
                    <Badge
                      className={
                        r.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }
                      variant="outline"
                    >
                      {r.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
