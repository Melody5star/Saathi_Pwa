// साथी AI — Keep-alive ping endpoint
// Prevents Vercel cold starts by being pinged every 10 minutes

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'ok', ts: Date.now() });
}
