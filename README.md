# साथी AI — PWA App

Your elderly Hindi+English AI companion. Powered by Claude AI.

---

## Files in this repo

```
saathai-pwa/
├── index.html          ← Complete app (all screens, chat, voice, reminders, SOS)
├── manifest.json       ← PWA install config
├── vercel.json         ← Vercel deployment config
├── api/
│   └── chat.js         ← Claude AI serverless function (reads ANTHROPIC_API_KEY)
├── icon-192.png        ← App icon 192x192 — ADD THIS YOURSELF
├── icon-512.png        ← App icon 512x512 — ADD THIS YOURSELF
└── README.md
```

---

## STEP 1 — Add your icon files

You need two PNG icon files:
- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

Quick way: Go to favicon.io → upload your साथी logo → download → rename files.

---

## STEP 2 — Deploy to Vercel

1. Push all files to GitHub repo (e.g. `saathai-pwa`)
2. Go to vercel.com → New Project → Import that repo
3. Click Deploy — Vercel auto-detects vercel.json

---

## STEP 3 — Add API Key in Vercel

After deploying:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name:  `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-xxxxxxxxxx` (your key from console.anthropic.com)
3. Click Save → Redeploy

---

## STEP 4 — Add your domain (optional but recommended)

1. Buy `saathai.in` on Namecheap (~₹700/year)
2. Vercel → Settings → Domains → Add `saathai.in`
3. Copy the 2 DNS records Vercel shows you
4. Paste them in Namecheap DNS settings
5. Wait 10 minutes → live!

---

## Model being used
`claude-haiku-4-5-20251001` — Best value for साथी AI conversations.
Upgrade to `claude-sonnet-4-20250514` in api/chat.js when you have paying users.

## Estimated API cost
- $5 credits ≈ 2,500+ conversations
- 10 active users/month ≈ $1-2/month
- 100 active users/month ≈ $8-15/month
