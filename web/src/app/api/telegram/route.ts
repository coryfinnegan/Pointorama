import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pointsLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { sendMessage, authorizedChatId } from "@/lib/telegram";

const HELP = `*Pointorama Bot* ⭐

*Commands:*
\`add <N> [reason]\` — add points
\`remove <N> [reason]\` — deduct points
\`balance\` — check current balance
\`help\` — show this message

*Examples:*
\`add 20 cleaned room\`
\`remove 5 lost library book\``;

export async function POST(req: NextRequest) {
  // Verify secret token header to ensure request is from Telegram
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_SECRET && secret !== process.env.TELEGRAM_SECRET) {
    return new NextResponse(null, { status: 403 });
  }

  const body = await req.json();
  const msg = body?.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat?.id ?? "");
  const text: string = msg.text.trim();

  // Only respond to the authorized parent chat
  const allowed = authorizedChatId();
  if (allowed && chatId !== allowed) {
    await sendMessage(chatId, "❌ Unauthorized.");
    return NextResponse.json({ ok: true });
  }

  const lower = text.toLowerCase();
  const db = getDb();

  // balance / pts
  if (/^(balance|pts|points|score)$/i.test(lower)) {
    const logs = await db.select().from(pointsLog).orderBy(desc(pointsLog.id));
    const total = logs.reduce((s, l) => s + l.amount, 0);
    await sendMessage(chatId, `⭐ *${total.toLocaleString()} points* available`);
    return NextResponse.json({ ok: true });
  }

  // help
  if (/^help$/i.test(lower)) {
    await sendMessage(chatId, HELP);
    return NextResponse.json({ ok: true });
  }

  // add / remove / deduct
  const addMatch = lower.match(/^(?:add|plus|\+)\s+(\d+)(?:\s+(.+))?$/);
  const removeMatch = lower.match(/^(?:remove|deduct|minus|sub|-)\s+(\d+)(?:\s+(.+))?$/);
  const match = addMatch ?? removeMatch;

  if (match) {
    const isAdd = !!addMatch;
    const amount = parseInt(match[1], 10);
    const note = (match[2] ?? (isAdd ? "Added via Telegram" : "Deducted via Telegram")).trim();
    const delta = isAdd ? amount : -amount;

    const [entry] = await db.insert(pointsLog).values({ amount: delta, note }).returning();
    const logs = await db.select().from(pointsLog);
    const newTotal = logs.reduce((s, l) => s + l.amount, 0);

    const kidName = process.env.NEXT_PUBLIC_KID_NAME ?? "Kid";
    const sign = isAdd ? "+" : "-";
    await sendMessage(
      chatId,
      `${isAdd ? "⭐" : "📉"} *${sign}${amount}* — ${note}\n_${kidName}'s balance: ${newTotal.toLocaleString()} pts_`
    );
    return NextResponse.json({ ok: true });
  }

  // unrecognized
  await sendMessage(chatId, `❓ I didn't understand that.\n\nSend \`help\` for commands.`);
  return NextResponse.json({ ok: true });
}

// GET endpoint to register the webhook from the admin panel
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("setup") !== "1") return new NextResponse(null, { status: 404 });

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverUrl || !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN or NEXT_PUBLIC_SERVER_URL not set" }, { status: 500 });
  }

  const { setWebhook } = await import("@/lib/telegram");
  const result = await setWebhook(`${serverUrl}/api/telegram`);
  return NextResponse.json(result);
}
