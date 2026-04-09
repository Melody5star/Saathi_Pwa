# साथी AI — आपका Digital साथी

A Progressive Web App (PWA) designed as a caring AI companion for elderly users, supporting both Hindi and English.

## Features

- **AI Companion** — Conversational assistant in Hindi & English
- **Medicine Reminders** — Track and get reminded about medications
- **SOS Emergency** — One-tap emergency alert to family members
- **PWA** — Installable on Android/iOS, works offline via service worker
- **Onboarding** — Simple setup flow for elderly users

## Project Structure

```
├── index.html        # Main app (PWA shell)
├── landing.html      # Landing / marketing page
├── sw.js             # Service worker (offline support)
├── manifest.json     # PWA manifest
├── api/              # Backend API routes (Vercel serverless)
├── public/           # Static assets
├── tests/            # Jest test suite
└── vercel.json       # Vercel deployment config
```

## Getting Started

No build step required. Open `index.html` directly or deploy to Vercel.

### Run Tests

```bash
npm install
npm test
```

## Deployment

Deployed via [Vercel](https://vercel.com). Push to `main` to deploy to production.

## Branch Workflow

- All development happens on the `dev` branch
- Test on preview URL before merging
- Merge to `main` only when explicitly ready for production

## Tech Stack

- Vanilla HTML / CSS / JavaScript
- PWA (Service Worker + Web App Manifest)
- Vercel (hosting + serverless API)
- Jest (testing)
