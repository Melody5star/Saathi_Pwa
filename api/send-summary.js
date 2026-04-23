// ── साथी AI — Health Summary Email ──
// Fetches medicines, notes, prescriptions from Supabase → sends HTML email
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, GMAIL_USER, GMAIL_APP_PASSWORD

import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const GMAIL_USER   = process.env.GMAIL_USER;
const GMAIL_PASS   = process.env.GMAIL_APP_PASSWORD;

function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function mealLabel(h) {
  if (h >= 5  && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  return 'Evening';
}

function buildEmail(userName, recipientEmail, notes, medicines, prescriptions) {
  const date = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const medsHtml = medicines.length
    ? medicines.map(m => {
        const h = m.time ? parseInt(m.time.split(':')[0]) : 8;
        return `<tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f0e6d3">💊 <strong>${m.name}</strong></td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0e6d3;color:#888">${mealLabel(h)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0e6d3;color:#888">${fmt12(m.time)}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="3" style="padding:14px;color:#aaa;text-align:center">No medicines logged yet</td></tr>`;

  const notesHtml = notes.length
    ? notes.slice(0,10).map(n => `
        <div style="background:#fdf8f0;border-left:3px solid #FF6B1A;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:8px">
          <div style="font-size:14px;color:#333;line-height:1.5">${n.text.replace(/</g,'&lt;')}</div>
          <div style="font-size:11px;color:#aaa;margin-top:4px">${n.note_date} · ${n.note_time}</div>
        </div>`).join('')
    : `<div style="color:#aaa;font-size:13px;padding:8px 0">No notes saved yet</div>`;

  const rxHtml = prescriptions.length
    ? prescriptions.map((rx, i) => {
        const rxDate = new Date(rx.scanned_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
        const meds = (rx.medicines_json||[]).map(m => m.name).join(', ') || 'No medicines extracted';
        return `<div style="background:#fdf8f0;border-radius:8px;padding:12px 14px;margin-bottom:8px">
          <div style="font-size:12px;color:#FF6B1A;font-weight:700;margin-bottom:4px">Prescription ${i+1} · ${rxDate}</div>
          <div style="font-size:13px;color:#555">💊 ${meds}</div>
        </div>`;
      }).join('')
    : `<div style="color:#aaa;font-size:13px;padding:8px 0">No prescriptions scanned yet</div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#FF6B1A,#D97706);padding:28px 32px;text-align:center">
    <div style="font-size:28px;margin-bottom:6px">🙏</div>
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">साथी AI — Health Summary</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${userName} · ${date}</p>
  </div>

  <div style="padding:28px 32px">

    <!-- Medicines -->
    <h2 style="font-size:16px;color:#FF6B1A;margin:0 0 14px;border-bottom:2px solid #fff3e0;padding-bottom:8px">💊 Current Medicines</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#fdf8f0;border-radius:10px;overflow:hidden">
      <thead>
        <tr style="background:#fff3e0">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;font-weight:600">MEDICINE</th>
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;font-weight:600">TIME OF DAY</th>
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;font-weight:600">TIME</th>
        </tr>
      </thead>
      <tbody>${medsHtml}</tbody>
    </table>

    <!-- Recent Notes -->
    <h2 style="font-size:16px;color:#FF6B1A;margin:0 0 14px;border-bottom:2px solid #fff3e0;padding-bottom:8px">📝 Recent Notes</h2>
    <div style="margin-bottom:28px">${notesHtml}</div>

    <!-- Prescriptions -->
    <h2 style="font-size:16px;color:#FF6B1A;margin:0 0 14px;border-bottom:2px solid #fff3e0;padding-bottom:8px">📋 Prescription History</h2>
    <div style="margin-bottom:28px">${rxHtml}</div>

    <!-- Footer note -->
    <div style="background:#f9f9f9;border-radius:10px;padding:14px 16px;font-size:12px;color:#999;line-height:1.6;text-align:center">
      This summary was sent from साथी AI — the voice companion for ${userName}.<br>
      <a href="https://saathiai.health" style="color:#FF6B1A;text-decoration:none">saathiai.health</a>
    </div>
  </div>
</div>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://saathiai.health');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userEmail, recipientEmail, userName } = req.body || {};
  if (!userEmail || !recipientEmail) return res.status(400).json({ error: 'userEmail and recipientEmail required' });
  if (!GMAIL_USER || !GMAIL_PASS) return res.status(500).json({ error: 'Email not configured' });

  try {
    // Fetch data from Supabase
    const [notesR, medsR, rxR] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/notes?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=10`, { headers: sbHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/medicines?user_email=eq.${encodeURIComponent(userEmail)}&limit=1`, { headers: sbHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/prescriptions?user_email=eq.${encodeURIComponent(userEmail)}&order=scanned_at.desc&limit=3`, { headers: sbHeaders() })
    ]);
    const [notes, meds, rx] = await Promise.all([notesR.json(), medsR.json(), rxR.json()]);
    const medicines = meds[0]?.medicines_json || [];

    const html = buildEmail(userName || 'Your Parent', recipientEmail, notes||[], medicines, rx||[]);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"साथी AI" <${GMAIL_USER}>`,
      to: recipientEmail,
      subject: `साथी AI — Health Summary for ${userName || 'Your Parent'}`,
      html
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
