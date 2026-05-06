import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { sendMessage, authorizedChatId } from "@/lib/telegram";

function getWaitlistDb() {
  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pointorama.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  return db;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const db = getWaitlistDb();
  try {
    db.prepare("INSERT INTO waitlist (email) VALUES (?)").run(email.toLowerCase().trim());
  } catch {
    return NextResponse.json({ error: "Already signed up!" }, { status: 409 });
  }

  const { count } = db.prepare("SELECT COUNT(*) as count FROM waitlist").get() as { count: number };

  const chatId = authorizedChatId();
  if (chatId) {
    await sendMessage(chatId, `📬 *New waitlist signup!*\n${email}\n_${count} total on the list_`).catch(() => {});
  }

  return NextResponse.json({ ok: true, count });
}
