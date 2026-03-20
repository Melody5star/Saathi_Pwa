// ══════════════════════════════════════════════════════
//  साथी AI — Vercel Serverless Function
//  File location in repo: api/chat.js
//  Now with: Web Search tool — Claude answers like a real assistant
//  Env var needed: ANTHROPIC_API_KEY in Vercel dashboard
// ══════════════════════════════════════════════════════

module.exports = async function handler(req, res) {

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set in Vercel Environment Variables.'
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
        max_tokens: 1024,
        system: system || 'You are Saathi AI, a warm Hindi-English companion for elderly people.',
        // ✅ THIS IS THE KEY ADDITION — web search tool
        // Claude will automatically search the web when needed
        // Just like how this Claude chat can search — now साथी AI can too
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: messages
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Claude API error:', data.error);
      return res.status(400).json({ error: data.error.message || 'Claude API error' });
    }

    // ── Extract the final text reply ──
    // When web search is used, Claude returns multiple content blocks:
    // [tool_use block (search query), tool_result block (results), text block (final answer)]
    // We extract only the final text block — that's the reply for the user
    let reply = '';

    if (data.content && Array.isArray(data.content)) {
      // Get all text blocks and join them
      const textBlocks = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join(' ');

      reply = textBlocks.trim();
    }

    if (!reply) {
      // Fallback — sometimes Claude returns stop_reason: tool_use
      // meaning it searched but hasn't written the final answer yet
      // In that case return a gentle retry message
      reply = 'Maafi, abhi thodi problem aa gayi. Dobara poochhen please. 🙏';
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
