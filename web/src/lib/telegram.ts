const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId: string | number, text: string, options?: {
  parseMode?: "Markdown" | "HTML";
  replyMarkup?: Record<string, unknown>;
}) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;
  await fetch(`${BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode ?? "Markdown",
      reply_markup: options?.replyMarkup,
      disable_web_page_preview: true,
    }),
  });
}

export async function setWebhook(webhookUrl: string) {
  const res = await fetch(`${BASE}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, secret_token: process.env.TELEGRAM_SECRET }),
  });
  return res.json();
}

export function authorizedChatId() {
  return process.env.TELEGRAM_CHAT_ID ?? "";
}
