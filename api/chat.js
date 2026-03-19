// ══════════════════════════════════════════════════════
//  साथी AI — Vercel Serverless Function
//  File location: api/chat.js
//  Model: Claude Haiku 4.5 (fast + affordable)
//  Env var needed: ANTHROPIC_API_KEY in Vercel dashboard
// ══════════════════════════════════════════════════════

export default async function handler(req, res) {

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Go to Vercel Dashboard → Settings → Environment Variables and add it.'
    });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: system || 'You are Saathi AI, a warm Hindi-English companion for elderly people.',
        messages: messages
      })
    });

    const data = await response.json();

    // Claude API error
    if (data.error) {
      console.error('Claude API error:', data.error);
      return res.status(400).json({ error: data.error.message || 'Claude API error' });
    }

    // Extract reply text
    const reply = data.content?.[0]?.text || '';

    if (!reply) {
      return res.status(500).json({ error: 'Empty response received' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
