module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.ANTHROPIC_API_KEY) return res.status(500).json({error:'ANTHROPIC_API_KEY not set in Vercel Environment Variables'});

  const { messages, system } = req.body;
  if(!messages || !Array.isArray(messages)) return res.status(400).json({error:'messages required'});

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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: messages
      })
    });

    const data = await response.json();
    if(data.error) return res.status(400).json({error: data.error.message});

    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join(' ');
    const reply = textBlocks.trim() || 'Maafi, kuch gadbad ho gayi. Dobara try karein.';
    return res.status(200).json({reply});

  } catch(err) {
    return res.status(500).json({error: 'Server error: ' + err.message});
  }
};
