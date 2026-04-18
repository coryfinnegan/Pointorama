# Pointorama — Next Steps

Ordered by recommended priority. Each item is self-contained and can be vibe-coded independently.

---

## 1. Admin PIN Protection (High Priority)

Right now `/admin` is wide open. Add a simple client-side PIN so your son can't add his own points.

**Approach:** Store a hashed PIN in an env var (`ADMIN_PIN_HASH`). Add a `POST /api/auth` route that compares and returns a short-lived signed cookie (use `jose` or `iron-session`). Wrap the admin layout in a middleware check.

**Files to touch:**
- `web/src/middleware.ts` (new)
- `web/src/app/api/auth/route.ts` (new)
- `web/src/app/admin/layout.tsx` (new — gate with redirect)

---

## 2. Kid-Friendly Dashboard Personalization

Make the dashboard feel personal and fun.

**Ideas:**
- Add son's name + avatar/emoji to the welcome header
- Animated point counter when balance changes (use `framer-motion` or CSS transitions)
- "Level" system — e.g. every 100 points earned = new rank badge (Rookie → Champion → Legend)
- Confetti burst on successful redemption (use `canvas-confetti`)

**Files to touch:**
- `web/src/app/page.tsx`
- `web/src/app/shop/page.tsx`

---

## 3. Weekly/Daily Points Summary

Show a chart of points earned over the past 2 weeks so you can spot trends.

**Approach:** Add a `GET /api/points/summary?days=14` route that groups `points_log` by date using SQLite's `date(created_at)`. Render with `recharts` (already React-friendly).

**Files to touch:**
- `web/src/app/api/points/summary/route.ts` (new)
- `web/src/app/page.tsx` — add chart below the stat cards

---

## 4. Prize Images via URL + Preview

The prize image field exists but there's no preview in the admin form.

**Approach:** Add a live `<img>` preview in the Admin "Add Prize" form that updates as the URL is typed. Consider also supporting emoji as an alternative to image URLs (store `:emoji:` syntax and render it large).

**Files to touch:**
- `web/src/app/admin/page.tsx`

---

## 5. Edit Existing Prizes

Currently prizes can only be removed, not edited. Add an edit dialog.

**Approach:** Add an Edit button to each prize row in Admin that opens a pre-filled Dialog. Call `PATCH /api/prizes/[id]` with the updated fields. The route already exists.

**Files to touch:**
- `web/src/app/admin/page.tsx`

---

## 6. Point History with Filters

The dashboard shows the last 10 entries. Add a full history page with date filters.

**Approach:** New `/history` page. Add `?from=&to=` query params to `GET /api/points`. Consider adding a "category" field to `points_log` (e.g. Homework, Behavior, Chores) for filtering.

**Files to touch:**
- `web/src/app/history/page.tsx` (new)
- `web/src/app/api/points/route.ts` — add date filter support
- `web/src/db/schema.ts` — optional `category` column

---

## 7. Aspire: Add PostgreSQL for Production

SQLite is great for local dev but a single file isn't ideal if you ever want to host this.

**Approach:** Add `builder.AddPostgres("db")` to the AppHost. Pass the connection string to the Next.js app as an env var. Drizzle supports PostgreSQL with minimal schema changes (swap `sqliteTable` → `pgTable`, use `pg` driver).

**Files to touch:**
- `Pointorama.AppHost/AppHost.cs`
- `web/src/db/index.ts`
- `web/src/db/schema.ts`

---

## 8. Notifications (Parent Alert on Redemption)

Get a notification when your son redeems a prize so you know to buy it.

**Approach A (simple):** On `POST /api/redeem` success, send an email via Resend (`resend` npm package) — free tier is plenty for personal use.

**Approach B (push):** Use web push notifications (`web-push` npm package) — requires a service worker.

---

## 9. Roku TV Channel

The REST API is already Roku-compatible. A Roku channel is a BrightScript app that calls your HTTP endpoints.

**Steps:**
1. Host the Next.js app publicly (Railway, Fly.io, or a home server with port forwarding)
2. Create a Roku "developer channel" via the Roku developer portal
3. Write a BrightScript SceneGraph app that calls `/api/prizes` and `/api/points` and renders them on TV

**Key insight:** The Roku channel only needs read access (`GET /api/points`, `GET /api/prizes`) to show the balance and shop — redemptions can stay in the browser.

---

## 10. Amazon Integration (Optional / Future)

Pre-fill an Amazon search or wishlist link on each prize.

**Simple approach (no API needed):** Store an Amazon search URL or ASIN on the prize. Add a "Buy on Amazon" link in the Admin fulfilled view that opens the product page.

**Advanced approach:** Use the Amazon Product Advertising API (PA-API 5.0) to search by keyword and pull product images/prices automatically. Requires an Amazon Associates account.

---

## Quick Wins (< 30 min each)

- [ ] Add a `favicon.ico` with a star emoji
- [ ] Add `<title>` per page using Next.js `generateMetadata`
- [ ] Dark mode toggle (shadcn + `next-themes` is already installed)
- [ ] Add a "Cancel Redemption" button for the kid (calls `PATCH /api/redemptions/[id]` with `status: cancelled`)
- [ ] Show prize count badges in the Nav ("Prize Shop (5)")
