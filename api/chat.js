// ══════════════════════════════════════════════════════
//  साथी AI — API Handler
//  Handles: normal chat + prescription image reading
//  Env vars: ANTHROPIC_API_KEY, INSTAMOJO_*
// ══════════════════════════════════════════════════════

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const HEADERS = (key) => ({
  'Content-Type': 'application/json',
  'x-api-key': key,
  'anthropic-version': '2023-06-01'
});

// Retry fetch with exponential backoff
async function fetchWithRetry(url, options, retries = 2) {
  for(let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, options);
      if(r.ok || r.status < 500) return r;
      if(i < retries) await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    } catch(err) {
      if(i === retries) throw err;
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.ANTHROPIC_API_KEY) return res.status(500).json({error:'ANTHROPIC_API_KEY not set in Vercel Environment Variables'});

  const body = req.body;

  // ── PRESCRIPTION VISION MODE ──
  if(body.rxMode && body.imageBase64) {
    try {
      // Resize hint — reject oversized base64 (>4MB decoded ≈ ~5.5MB base64)
      if(body.imageBase64.length > 5500000) {
        return res.status(400).json({error:'Image too large. Please take a closer, clearer photo.'});
      }

      const r = await fetchWithRetry(ANTHROPIC_URL, {
        method: 'POST',
        headers: HEADERS(process.env.ANTHROPIC_API_KEY),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: body.imageMime || 'image/jpeg', data: body.imageBase64 } },
              { type: 'text', text: body.prompt }
            ]
          }]
        })
      });

      const d = await r.json();
      if(d.error) return res.status(400).json({error: d.error.message || 'Vision API error'});

      // FIX: Robust reply extraction with fallback
      const reply = (d.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join(' ')
        .trim();

      if(!reply) {
        return res.status(400).json({error: 'Could not read image. Please ensure it is a clear, printed prescription.'});
      }

      return res.status(200).json({reply});

    } catch(err) {
      return res.status(500).json({error: 'Vision error: ' + err.message});
    }
  }

  // ── NORMAL CHAT MODE ──
  const { messages, system } = body;
  if(!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({error:'messages array is required'});
  }

  try {
    const r = await fetchWithRetry(ANTHROPIC_URL, {
      method: 'POST',
      headers: HEADERS(process.env.ANTHROPIC_API_KEY),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: system || 'You are Saathi AI, a warm Hindi-English companion.',
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: messages
      })
    });

    const d = await r.json();
    if(d.error) return res.status(400).json({error: d.error.message});

    const reply = (d.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join(' ')
      .trim() || 'Maafi, kuch gadbad ho gayi. Dobara try karein.';

    return res.status(200).json({reply});

  } catch(err) {
    return res.status(500).json({error: 'Server error: ' + err.message});
  }
};
