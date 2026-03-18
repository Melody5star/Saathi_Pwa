# साथी AI — Final Package

## Files to upload to GitHub

```
saathai-pwa/
├── index.html          ← Complete app
├── manifest.json       ← PWA install config
├── api/
│   └── chat.js         ← Vercel serverless function (uses your env var)
├── icon-192.png        ← YOU ADD THIS (192×192 app icon)
├── icon-512.png        ← YOU ADD THIS (512×512 app icon)
└── README.md
```

## ✅ No sw.js needed (removed — causes caching issues in beta)

---

## Vercel Environment Variable setup

1. After deploying, go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - **Name:** `GROQ_API_KEY`
   - **Value:** your key from console.groq.com
4. Redeploy

That's it. Key is 100% server-side. Never visible to users.

---

## How it works

```
User types message
      ↓
index.html (browser)
      ↓  POST /api/chat
api/chat.js (Vercel server) ← reads GROQ_API_KEY from env
      ↓
Groq API → llama-3.3-70b
      ↓
Reply back to browser
```

---

## Icons — quick way
Go to favicon.io → upload your साथी logo PNG → download → rename files to icon-192.png and icon-512.png
