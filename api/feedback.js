// साथी AI — Feedback Handler
// Receives feedback and emails it to support@saathiai.health
// Env vars required: BREVO_API_KEY (or SMTP_* if using nodemailer)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rating, message, user, email } = req.body || {};
  if (!rating) return res.status(400).json({ error: 'Missing rating' });

  const emojiMap = { loved: '😊 Loved it', okay: '😐 It was okay', needs: '😞 Needs work' };
  const ratingLabel = emojiMap[rating] || rating;
  const subject = `Saathi AI Feedback: ${ratingLabel} — from ${user || 'Unknown'}`;
  const htmlBody = `
    <div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#D97706">Saathi AI — User Feedback</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold;color:#555">Rating</td><td style="padding:8px">${ratingLabel}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#555">User</td><td style="padding:8px">${user || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#555">Email</td><td style="padding:8px">${email || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#555">Message</td><td style="padding:8px">${message || '(none)'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#555">Time</td><td style="padding:8px">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
      </table>
    </div>`;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log('Feedback received (no email key):', { rating, message, user, email });
    return res.status(200).json({ ok: true, note: 'logged only' });
  }

  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: 'Saathi AI Feedback', email: 'support@saathiai.health' },
        to: [{ email: 'support@saathiai.health', name: 'Saathi Team' }],
        subject,
        htmlContent: htmlBody
      })
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('Brevo error:', err);
      return res.status(500).json({ error: 'Email send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Feedback handler error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
