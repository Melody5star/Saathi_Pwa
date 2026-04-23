// ── साथी AI — Dodo Payments Webhook Handler ──
// Flow: Dodo hits this → verify signature → update Supabase → send Gmail confirmation
// Env vars: DODO_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, GMAIL_USER, GMAIL_APP_PASSWORD

import crypto from 'crypto';
import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const DODO_SECRET  = process.env.DODO_WEBHOOK_SECRET;
const GMAIL_USER   = process.env.GMAIL_USER;
const GMAIL_PASS   = process.env.GMAIL_APP_PASSWORD;

// ── Plan config ──
const PLAN_CONFIG = {
  founding: { label: 'Saathi Basic (Founding)', days: 90,  amount: '99'  },
  pro:      { label: 'Saathi Pro',              days: 30,  amount: '299' }
};

// ── Verify Dodo webhook signature (Standard Webhooks spec) ──
function verifySignature(rawBody, msgId, msgTimestamp, sigHeader) {
  if(!DODO_SECRET) return false; // reject all webhooks if secret not configured
  try {
    const secret = DODO_SECRET.startsWith('whsec_')
      ? Buffer.from(DODO_SECRET.slice(6), 'base64')
      : Buffer.from(DODO_SECRET, 'base64');
    const toSign = `${msgId}.${msgTimestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(toSign);
    const computed = hmac.digest('base64');
    // sigHeader format: "v1,<base64sig> v1,<base64sig2> ..."
    const sigs = sigHeader.split(' ').map(s => s.replace(/^v\d+,/, ''));
    return sigs.some(sig => {
      try { return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig)); }
      catch(e) { return false; }
    });
  } catch(e) {
    return false;
  }
}

// ── Supabase helpers ──
function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=representation'
  };
}

async function getUserByEmail(email) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`, {
    headers: sbHeaders()
  });
  const data = await r.json();
  return data[0] || null;
}

async function updatePlanInSupabase(email, plan, planEnd, paymentId, amount) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify({
      plan,
      plan_paid_at: Date.now(),
      plan_end: planEnd,
      payment_id: paymentId,
      last_seen: Date.now()
    })
  });
  return r.ok;
}

// ── Send confirmation email via Gmail SMTP ──
async function sendConfirmationEmail(name, email, plan, planEnd, amount) {
  if(!GMAIL_USER || !GMAIL_PASS) {
    console.log('Gmail not configured — skipping email to:', email);
    return;
  }

  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.founding;
  const endDate = new Date(planEnd).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  await transporter.sendMail({
    from: `"Saathi AI Team" <${GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Saathi AI! Your plan is active 🙏',
    text: `Namaste ${name || 'Ji'},

Your Saathi AI ${config.label} is now active!

Open Saathi AI: https://saathiai.health/app

Your plan details:
- Plan: ${config.label}
- Valid until: ${endDate}
- Amount paid: ₹${amount || config.amount}

Thank you for trusting Saathi AI with your family.

With love,
Anamika & Saathi AI Team
support@saathiai.health`,
    html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fffdf7;border:1px solid #f5d98b;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#F59E0B,#EA580C);padding:28px 32px;text-align:center">
    <div style="font-size:2rem;margin-bottom:4px">🙏</div>
    <div style="font-size:1.4rem;font-weight:800;color:#fff">Welcome to Saathi AI!</div>
    <div style="font-size:.9rem;color:rgba(255,255,255,.8);margin-top:4px">Your plan is now active</div>
  </div>
  <div style="padding:28px 32px">
    <p style="font-size:1rem;color:#3b2a00;margin-bottom:20px">Namaste <strong>${name || 'Ji'}</strong>,</p>
    <p style="color:#5a3e00;line-height:1.7">Your <strong>${config.label}</strong> plan is now active! Saathi AI is ready to be your family's caring companion — reminding medicines, listening, and always being there.</p>
    <div style="background:#fff8e1;border:1px solid #f5d98b;border-radius:12px;padding:18px 20px;margin:20px 0">
      <div style="font-size:.75rem;font-weight:700;color:#b45309;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Your Plan Details</div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:5px 0;color:#6b4c00;font-size:.88rem">Plan</td><td style="padding:5px 0;font-weight:700;color:#3b2a00;font-size:.88rem">${config.label}</td></tr>
        <tr><td style="padding:5px 0;color:#6b4c00;font-size:.88rem">Valid until</td><td style="padding:5px 0;font-weight:700;color:#3b2a00;font-size:.88rem">${endDate}</td></tr>
        <tr><td style="padding:5px 0;color:#6b4c00;font-size:.88rem">Amount paid</td><td style="padding:5px 0;font-weight:700;color:#3b2a00;font-size:.88rem">₹${amount || config.amount}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="https://saathiai.health/app" style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#EA580C);color:#fff;padding:14px 32px;border-radius:12px;font-weight:800;font-size:1rem;text-decoration:none">Open Saathi AI →</a>
    </div>
    <p style="color:#8a6200;font-size:.85rem;line-height:1.7">Need help? Reply to this email or write to us at <a href="mailto:support@saathiai.health" style="color:#F59E0B">support@saathiai.health</a></p>
    <hr style="border:none;border-top:1px solid #f5d98b;margin:20px 0">
    <p style="color:#b45309;font-size:.82rem;text-align:center">With love,<br><strong>Anamika & Saathi AI Team</strong><br>support@saathiai.health</p>
  </div>
</div>`
  });
}

// ── Main handler ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://saathiai.health');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if(!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase env vars not set' });
  }

  // Standard Webhooks headers
  const rawBody = JSON.stringify(req.body);
  const msgId        = req.headers['webhook-id'] || '';
  const msgTimestamp = req.headers['webhook-timestamp'] || '';
  const sigHeader    = req.headers['webhook-signature'] || '';

  if(!verifySignature(rawBody, msgId, msgTimestamp, sigHeader)) {
    console.error('Dodo webhook signature mismatch');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  console.log('Dodo webhook event:', event.type, event.data?.payment?.id);

  // Only process successful payments
  if(event.type !== 'payment.succeeded' && event.type !== 'subscription.active') {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const payment  = event.data?.payment || event.data || {};
    const email    = payment.customer?.email || payment.email || '';
    const amount   = payment.amount ? String(Math.round(payment.amount / 100)) : ''; // Dodo sends paise
    const paymentId = payment.id || payment.payment_id || '';
    const metadata  = payment.metadata || payment.custom_data || {};

    // Determine plan from amount or metadata
    let plan = metadata.plan || (parseInt(amount) >= 299 ? 'pro' : 'founding');
    if(!PLAN_CONFIG[plan]) plan = 'founding';

    const config  = PLAN_CONFIG[plan];
    const planEnd = Date.now() + (config.days * 24 * 60 * 60 * 1000);

    if(!email) {
      console.error('No email in Dodo payload');
      return res.status(200).json({ ok: true, warning: 'No email found in payload' });
    }

    // Get user from Supabase
    const user = await getUserByEmail(email);
    const name = user?.name || metadata.name || '';

    // Update plan in Supabase (upsert if user not found yet)
    if(user) {
      await updatePlanInSupabase(email, plan, planEnd, paymentId, amount);
    } else {
      // User not onboarded yet — create basic record
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          email, name,
          plan, plan_paid_at: Date.now(),
          plan_end: planEnd, payment_id: paymentId,
          registered_at: Date.now(), last_seen: Date.now()
        })
      });
    }

    // Send confirmation email
    await sendConfirmationEmail(name, email, plan, planEnd, amount);

    console.log(`Plan activated: ${email} → ${plan} until ${new Date(planEnd).toISOString()}`);
    return res.status(200).json({ ok: true, email, plan, planEnd });

  } catch(e) {
    console.error('Dodo webhook error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
