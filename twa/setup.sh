#!/bin/bash
# ── Saathi AI — TWA Play Store Setup Script ──
# Run this script ONCE from the /twa/ folder:
#   cd twa && bash setup.sh

set -e
echo "🚀 Saathi AI TWA Setup Starting..."

# ── STEP 1: Install Bubblewrap ──
echo ""
echo "📦 Step 1: Installing Bubblewrap CLI..."
npm install -g @bubblewrap/cli --prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"

# ── STEP 2: Generate keystore ──
echo ""
echo "🔑 Step 2: Generating signing keystore..."
echo "You will be prompted to set a keystore password — SAVE IT SAFELY."
echo "Never share or commit this file."
echo ""
keytool -genkey -v \
  -keystore saathi-release-key.jks \
  -alias saathi-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Anamika Bajpai, OU=Saathi AI, O=Saathi AI, L=New Delhi, ST=Delhi, C=IN"

# ── STEP 3: Print SHA-256 fingerprint ──
echo ""
echo "🔍 Step 3: Your SHA-256 fingerprint (copy the line starting with SHA256:):"
keytool -list -v \
  -keystore saathi-release-key.jks \
  -alias saathi-key | grep "SHA256:"

echo ""
echo "⚠️  ACTION REQUIRED:"
echo "Copy the SHA256 fingerprint above and paste it into:"
echo "  /public/.well-known/assetlinks.json"
echo "Replace the placeholder: REPLACE_WITH_SHA256_AFTER_KEYTOOL"

# ── STEP 4: Initialize Bubblewrap TWA project ──
echo ""
echo "⚙️  Step 4: Initializing TWA project from manifest..."
~/.npm-global/bin/bubblewrap init --manifest=https://saathiai.health/manifest.json

# ── STEP 5: Build the APK ──
echo ""
echo "🏗️  Step 5: Building signed APK (this takes a few minutes)..."
~/.npm-global/bin/bubblewrap build

echo ""
echo "✅ Done! APK should be at: app-release-signed.apk"
echo "Rename it to saathi-release-signed.apk and upload to Play Console."
