# Pointorama — Production Roadmap

Decisions and planned work for turning the current bespoke app into a shippable product.

---

## Guiding principle

The current app was built for one family. Every feature decision going forward should pass this test: **would a stranger understand and use this without explanation?**

---

## Feature decisions

### ✅ Weekly points (Auto Points)
**Decision:** Keep. Rename "Allowance" → "Auto Points" or "Scheduled Rewards."

**How it works:**
- Toggled on/off in the admin panel
- When on: reveals a simple amount field (e.g. "50 points per week")
- Runs automatically every 7 days from the day it's enabled
- No other settings exposed unless toggled on — parents who don't want it never see it

**Status:** Needs UX cleanup from current bespoke implementation. Core logic is already there.

---

### ❌ Money wallet
**Decision:** Remove from the product.

**Why:** Tracking real money inside a points app is confusing. It implies financial management the app doesn't actually do. Parents who want to track allowance money use their bank or a separate app. This feature added complexity without a clear value prop for a general audience.

**What to do:**
- Strip the money wallet UI from the admin panel
- Remove money-related DB tables and API routes
- Keep the concept out of the landing page entirely

**Status:** Not started.

---

### ✅ Exchange rate
**Decision:** Keep. It belongs in the product.

**Why:** When parents add a prize via a product link, the app fetches the real price in dollars. The exchange rate (e.g. $1 = 10 pts) is how that dollar price becomes a point cost automatically. Without it, parents have to do the math themselves every time. It's a real UX win.

**How to present it:** It doesn't need to be a standalone setting in the admin panel. Move it into the prize-adding flow as a contextual setting — shown inline when adding a prize from a link, with a short explanation of what it does. Power users can set it once and forget it.

**Status:** Works today. Needs UX relocation in a future pass.

---

## Planned work (priority order)

### P0 — Must have before charging money

- [ ] User accounts (email + password or Google OAuth)
- [ ] Each account has its own isolated data (kids, prizes, points)
- [ ] Onboarding flow: create account → add first child → add first prize → done
- [ ] Stripe subscription integration (Free / Pro tiers)
- [ ] Password reset flow
- [ ] Remove money wallet (see above)
- [ ] Rename "Allowance" → "Auto Points" with toggle UX

### P1 — Makes the product meaningfully better

- [ ] Multiple children per account with individual dashboards
- [ ] Chore/task templates (pre-built lists parents can import)
- [ ] Behavior streaks with bonus multipliers
- [ ] Weekly email or push summary for parents
- [ ] Move exchange rate into prize-adding flow (contextual, not standalone)

### P2 — Growth and retention

- [ ] iOS & Android app (kids side especially)
- [ ] Sibling leaderboards (opt-in)
- [ ] Custom themes and kid avatars
- [ ] Behavior analytics: which rewards drive the most activity
- [ ] Referral program

### P3 — Nice to have

- [ ] Screen time integration (iOS Screen Time API)
- [ ] Chore scheduling with reminders
- [ ] Google / Apple SSO
- [ ] Exportable history (CSV)

---

## What stays exactly as-is

- Point tracking core (log, add, deduct)
- Reward shop with product link fetching (Amazon, Nintendo, LEGO)
- Telegram notifications for redemptions
- Infinite level system
- Quick-add point buttons in admin

---

## Open questions

- **Kid-side auth:** Right now the kid's view is totally open (no login). For a multi-family product, kids need some kind of access — either a PIN, a family code, or a child account. Needs a decision before P0 ships.
- **Free tier limits:** Is 1 child the right limit, or should free be unlimited kids with limited features (no analytics, no themes)?
- **Pricing:** $4.99/mo is the current plan. Validate with smoke test before locking in.
