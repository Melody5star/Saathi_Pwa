// ── साथी AI — Public Auth Config ──
// Returns public Supabase URL + anon key (safe to expose — anon key is meant for client-side use)
// These are the same values you'd put in a .env.local for any Supabase JS app

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://saathiai.health');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return res.status(500).json({ error: 'Not configured' });

  return res.status(200).json({ supabaseUrl: url, supabaseAnonKey: key });
}
