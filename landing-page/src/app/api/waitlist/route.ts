import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const clean = email.toLowerCase().trim();

  // Notify via Telegram — add TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to Vercel env vars
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `📬 *New waitlist signup!*\n${clean}`,
        parse_mode: "Markdown",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
