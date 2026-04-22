# Saathi AI — Play Store Publishing Checklist

## PRE-REQUISITES (do these first)
- [ ] Run `cd twa && bash setup.sh` to generate keystore + APK
- [ ] Copy SHA256 fingerprint → paste into `/public/.well-known/assetlinks.json`
- [ ] Deploy to main branch → verify https://saathiai.health/.well-known/assetlinks.json returns JSON
- [ ] Test assetlinks: https://developers.google.com/digital-asset-links/tools/generator

---

## SCREENSHOTS NEEDED (take manually)
Minimum 2, maximum 8. Size: **1080×1920px portrait**

| # | Screen to capture |
|---|------------------|
| 1 | Landing/welcome screen |
| 2 | Chat in Hindi — AI replying |
| 3 | Medicine reminder set up |
| 4 | Family Dashboard |
| 5 | Prescription Reader |
| 6 | Settings / voice options |

**Feature Graphic:** 1024×500px — make in Canva (saathiai.health branding)

---

## PLAY CONSOLE LISTING COPY

**App name (max 30 chars):**
```
Saathi AI — साथी AI
```

**Short description (max 80 chars):**
```
Voice AI companion for elderly parents. Hindi, English & Hinglish.
```

**Full description (max 4000 chars):**
```
साथी AI — India's first voice-first AI companion designed specifically for elderly Indian parents.

Saathi speaks Hindi, English, and Hinglish — naturally, warmly, and at a pace elderly users can follow.

KEY FEATURES:
🎙️ Voice conversations in Hindi — just speak, no typing needed
💊 Medicine reminders — set by voice, get reminded on time
👨‍👩‍👧 Family Dashboard — children can monitor from anywhere
📋 Prescription scan — photograph medicines, get information
🗒️ Voice notes & memory — Saathi remembers what you tell it
🚨 SOS alert — one tap emergency contact

WHO IS SAATHI FOR:
- Elderly parents living alone or with family in India
- NRI families wanting to stay connected with parents back home
- Anyone who finds smartphones complicated — Saathi makes it simple

No app download needed — works directly in browser too at saathiai.health

FREE 7-day trial. No credit card required.
Founding Member plan: ₹99 for 3 months (limited — first 100 members only)
```

**Category:** Health & Fitness
**Content rating:** Everyone
**Privacy policy URL:** https://saathiai.health/privacy.html
**Data safety — deletion URL:** https://saathiai.health/delete-account
**Website:** https://saathiai.health
**Developer name:** Anamika Bajpai
**Developer email:** support@saathiai.health
**Developer website:** https://saathiai.health

---

## PLAY CONSOLE STEPS

1. Go to https://play.google.com/console → Saathi AI app (or create new)
2. Create app → Android → Free → Developer Program Policies agreed
3. Set up app:
   - App access: All functionality available without special access
   - Ads: No ads
   - Content rating: Complete questionnaire → Health & Fitness → Everyone
   - Target audience: 18+
   - News app: No
4. Store listing → paste copy above + upload screenshots
5. App releases → Internal testing → Create release → Upload APK
6. Review and roll out to Internal testing
7. After testing confirmed working → Promote to Production

---

## TECHNICAL CHECKLIST

- [ ] `manifest.json` — name, start_url, display:standalone, theme_color, 512px icon ✅
- [ ] `assetlinks.json` deployed at `/.well-known/assetlinks.json` with correct SHA256
- [ ] APK signed with release keystore
- [ ] `.jks` keystore file NOT in git (check `.gitignore`)
- [ ] `vercel.json` routes `/.well-known/assetlinks.json` with Content-Type: application/json ✅
- [ ] Privacy policy page exists at `saathiai.health/privacy.html`

---

## AFTER PUBLISHING
- Share APK link in internal testing with test users
- Monitor Play Console → Android Vitals for crashes
- Google review takes 3–7 business days for new apps

---

## KEYSTORE — KEEP SAFE
- File: `twa/saathi-release-key.jks`
- Alias: `saathi-key`
- NEVER commit to GitHub
- Store password in a password manager
- If lost → you CANNOT update the app on Play Store ever again
