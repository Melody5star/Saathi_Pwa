// ── साथी AI — Supabase API Handler ──
// Handles: upsert user, fetch user, update plan, fetch all users (admin)
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=representation'
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase env vars not set' });
  }

  const { action } = req.body || req.query;

  // ── UPSERT USER (on onboarding or update) ──
  if (action === 'upsert' && req.method === 'POST') {
    const { email, name, phone, dob, language, userType, familyName, familyPhone, registeredAt } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          email,
          name: name || null,
          phone: phone || null,
          dob: dob || null,
          language: language || 'hindi',
          user_type: userType || 'self',
          family_name: familyName || null,
          family_phone: familyPhone || null,
          registered_at: registeredAt || Date.now(),
          last_seen: Date.now()
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(400).json({ error: data });
      return res.status(200).json({ ok: true, user: data[0] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── UPDATE PLAN ──
  if (action === 'updatePlan' && req.method === 'POST') {
    const { email, plan, planPaidAt, planEnd, paymentId } = req.body;
    if (!email || !plan) return res.status(400).json({ error: 'Email and plan required' });

    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: sbHeaders(),
        body: JSON.stringify({
          plan,
          plan_paid_at: planPaidAt || Date.now(),
          plan_end: planEnd || null,
          payment_id: paymentId || null,
          last_seen: Date.now()
        })
      });
      if (!r.ok) { const d = await r.json(); return res.status(400).json({ error: d }); }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET USER by email ──
  if (action === 'getUser' && req.method === 'POST') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`, {
        headers: sbHeaders()
      });
      const data = await r.json();
      return res.status(200).json({ ok: true, user: data[0] || null });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET ALL USERS (admin dashboard) ──
  if (action === 'getAllUsers' && req.method === 'POST') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?order=registered_at.desc`, {
        headers: sbHeaders()
      });
      const data = await r.json();
      return res.status(200).json({ ok: true, users: data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── UPDATE LAST SEEN ──
  if (action === 'ping' && req.method === 'POST') {
    const { email } = req.body;
    if (!email) return res.status(200).json({ ok: true });
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: sbHeaders(),
        body: JSON.stringify({ last_seen: Date.now() })
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(200).json({ ok: true }); // fail silently
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
