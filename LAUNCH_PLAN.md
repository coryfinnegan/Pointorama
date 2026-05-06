# Pointorama — Smoke Test Launch Plan

The goal is simple: find out if strangers will hand over their email for this product *before* building the paid version.

---

## Step 1 — Deploy the landing page publicly (free, ~20 min)

The landing page lives at `/landing` in the existing repo. Deploy it separately on Vercel so it's publicly accessible without touching your private Tailscale server.

1. Go to [vercel.com](https://vercel.com) → Import Git Repository → select `Pointorama`
2. Set the root directory to `web`
3. Add one environment variable: `DB_PATH` → point to a writable path (Vercel uses a temp filesystem; for the waitlist you'll want a real DB — see Step 2)
4. After deploy, Vercel gives you a URL like `pointorama.vercel.app`

**Note:** The waitlist emails go to a SQLite DB. Vercel's filesystem is ephemeral, so swap the waitlist storage for a free Postgres or use [Vercel KV](https://vercel.com/docs/storage/vercel-kv) — or just point the API to a simple email service (Resend free tier).

---

## Step 2 — Get a real domain (~$12/yr)

`pointorama.app` or `pointorama.io` — check availability on Namecheap or Cloudflare Registrar. Point it at your Vercel deployment.

A real domain builds trust. Ads to a `.vercel.app` URL convert worse.

---

## Step 3 — Set up email capture properly

Swap the waitlist DB insert for [Resend](https://resend.com) (free up to 3,000 emails/month):
- On signup: add to a Resend audience list
- Send a simple confirmation email: "You're on the list! We'll be in touch."
- When you're ready to launch: email the whole list from Resend

You already get Telegram pings on every signup via the existing bot — that's your real-time signal.

---

## Step 4 — Run the smoke test ads ($50–100 budget)

**Platform:** Meta (Facebook/Instagram) is best for parents. Google Search works too.

**Targeting:**
- Parents of kids ages 6–14
- Interests: parenting, chores, allowance, kids activities
- US only to start

**Ad format:** Simple static image or short video.
- Hook: "Tired of repeating yourself? There's an app for that."
- Visual: screenshot of the reward shop or the level-up screen
- CTA: "Get Early Access"

**Daily cap:** Set a hard $10/day limit. Run for 7–10 days.

**What to measure:**
- Cost per email signup (aim for under $3)
- If you get 50+ signups on $100 → strong signal, keep going
- If under 20 signups → adjust the ad copy or targeting before spending more

---

## Step 5 — Read the results honestly

| Signups on $100 | Signal | Action |
|---|---|---|
| 50+ | Strong demand | Start building the paid tier |
| 20–50 | Weak/mixed | Try different ad copy, run another $50 |
| Under 20 | Low demand or wrong audience | Rethink positioning or move on |

Email open rates on your confirmation email are also a signal — low opens mean the audience isn't engaged.

---

## Step 6 — If demand is real, build the paid tier

**Minimum for charging money:**
- [ ] User accounts (email + password, or Google OAuth)
- [ ] Multi-kid support per account
- [ ] Stripe integration for subscriptions
- [ ] Basic onboarding flow
- [ ] Password reset

**Keep the free tier forever.** It's the top of the funnel.

**Founding member pricing:** Offer the first 100 signups a lifetime discount (e.g., $2.99/mo instead of $4.99). Creates urgency and rewards early believers.

---

## What NOT to do yet

- Don't build the iOS app before validating demand
- Don't hire anyone
- Don't spend more than $200 on ads before reading the results
- Don't obsess over the landing page copy — ship it and iterate

---

## Quick wins while you wait for ad data

- Post in parenting subreddits (r/Parenting, r/mildlyinteresting) with a genuine "I built this for my son" story — organic signups are free and high-quality
- Share in Facebook parenting groups
- Tweet/post the "I built this for my kid" angle — it's relatable and shareable
- DM 5–10 parent friends and ask them to forward it to one other parent
