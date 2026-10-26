/**
 * Telegram long-poll bot for Pointorama.
 * Runs as a standalone systemd service alongside the Next.js app.
 * Reads env from /opt/pointorama/app/.env.production (loaded by systemd EnvironmentFile).
 */

import Database from "./web/node_modules/better-sqlite3/lib/index.js";

const TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID  = process.env.TELEGRAM_CHAT_ID  ?? "";
const DB_PATH  = process.env.DB_PATH            ?? "./web/pointorama.db";
const KID      = process.env.NEXT_PUBLIC_KID_NAME ?? "Kid";
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

if (!TOKEN) { console.error("TELEGRAM_BOT_TOKEN not set"); process.exit(1); }

// --- DB helpers ---
const db = new Database(DB_PATH, { readonly: false });
db.pragma("journal_mode = WAL");

function getTotal() {
  const rows = db.prepare("SELECT amount FROM points_log").all();
  return rows.reduce((s, r) => s + r.amount, 0);
}

function insertPoints(amount, note) {
  db.prepare("INSERT INTO points_log (amount, note) VALUES (?, ?)").run(amount, note);
}

// --- Telegram helpers ---
async function send(chatId, text) {
  await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", disable_web_page_preview: true }),
  });
}

const HELP = `*Pointorama Bot* ⭐

*Commands:*
\`add <N> [reason]\` — add points
\`remove <N> [reason]\` — deduct points
\`balance\` — current balance
\`help\` — show this message

*Examples:*
\`add 20 cleaned room\`
\`remove 5 lost library book\``;

async function handleMessage(msg) {
  const chatId = String(msg.chat?.id ?? "");
  const text   = (msg.text ?? "").trim();

  if (!CHAT_ID) {
    console.log(`[setup] Message from chat ID: ${chatId} (${msg.chat?.first_name ?? "unknown"})`);
  }

  if (CHAT_ID && chatId !== CHAT_ID) {
    await send(chatId, `❌ Unauthorized.\n\nYour Chat ID is: \`${chatId}\`\nAdd it as TELEGRAM_CHAT_ID on the server.`);
    return;
  }

  const lower = text.toLowerCase();

  if (/^(balance|pts|points|score)$/i.test(lower)) {
    const total = getTotal();
    await send(chatId, `⭐ *${total.toLocaleString()} points* available`);
    return;
  }

  if (/^help$/i.test(lower)) {
    await send(chatId, HELP);
    return;
  }

  const addMatch    = lower.match(/^(?:add|plus|\+)\s+(\d+)(?:\s+(.+))?$/);
  const removeMatch = lower.match(/^(?:remove|deduct|minus|sub|-)\s+(\d+)(?:\s+(.+))?$/);
  const match       = addMatch ?? removeMatch;

  if (match) {
    const isAdd  = !!addMatch;
    const amount = parseInt(match[1], 10);
    const note   = (match[2] ?? (isAdd ? "Added via Telegram" : "Deducted via Telegram")).trim();
    const delta  = isAdd ? amount : -amount;

    insertPoints(delta, note);
    const newTotal = getTotal();
    const sign     = isAdd ? "+" : "-";

    await send(chatId,
      `${isAdd ? "⭐" : "📉"} *${sign}${amount}* — ${note}\n_${KID}'s balance: ${newTotal.toLocaleString()} pts_`
    );
    return;
  }

  await send(chatId, `❓ Didn't understand that. Send \`help\` for commands.`);
}

// --- Long-poll loop ---
let offset = 0;

async function poll() {
  try {
    const res  = await fetch(`${BASE_URL}/getUpdates?timeout=30&offset=${offset}`, { signal: AbortSignal.timeout(35_000) });
    const data = await res.json();
    if (!data.ok) { console.error("Telegram error:", data); return; }

    for (const update of data.result ?? []) {
      offset = update.update_id + 1;
      if (update.message) await handleMessage(update.message);
    }
  } catch (err) {
    console.error("Poll error:", err.message);
  }
}

console.log(`Pointorama Telegram bot started (kid: ${KID})`);
(async () => { while (true) await poll(); })();
