// ── साथी AI — api/chat.js Unit Tests ──
// Tests cover: normal chat, prescription vision, error handling, edge cases

const handler = require('../api/chat');

// Mock fetch globally
global.fetch = jest.fn();

function makeReq(body, method = 'POST') {
  return { method, body, headers: {} };
}
function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    _headers: {},
    status(code) { this._status = code; return this; },
    json(data)   { this._body = data; return this; },
    end()        { return this; },
    setHeader(k, v) { this._headers[k] = v; }
  };
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'test-key-123';
});

// ── 1. METHOD VALIDATION ──────────────────────────────
describe('Method validation', () => {
  test('GET returns 405', async () => {
    const res = makeRes();
    await handler(makeReq({}, 'GET'), res);
    expect(res._status).toBe(405);
    expect(res._body.error).toBe('Method not allowed');
  });

  test('OPTIONS returns 200 (CORS preflight)', async () => {
    const res = makeRes();
    await handler(makeReq({}, 'OPTIONS'), res);
    expect(res._status).toBe(200);
  });
});

// ── 2. ENV VAR CHECKS ────────────────────────────────
describe('Environment variable checks', () => {
  test('Missing ANTHROPIC_API_KEY returns 500', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = makeRes();
    await handler(makeReq({ messages: [{ role: 'user', content: 'hello' }] }), res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/ANTHROPIC_API_KEY/);
  });
});

// ── 3. NORMAL CHAT MODE ──────────────────────────────
describe('Normal chat mode', () => {
  test('Missing messages array returns 400', async () => {
    const res = makeRes();
    await handler(makeReq({}), res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/messages/);
  });

  test('Empty messages array returns 400', async () => {
    const res = makeRes();
    await handler(makeReq({ messages: [] }), res);
    expect(res._status).toBe(400);
  });

  test('Valid chat returns 200 with reply', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: [{ type: 'text', text: 'Namaste! Main Saathi hoon.' }]
      })
    });
    const res = makeRes();
    await handler(makeReq({
      messages: [{ role: 'user', content: 'Hello' }],
      system: 'You are Saathi AI.'
    }), res);
    expect(res._status).toBe(200);
    expect(res._body.reply).toBe('Namaste! Main Saathi hoon.');
  });

  test('Empty content array returns fallback Hindi message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: [] })
    });
    const res = makeRes();
    await handler(makeReq({ messages: [{ role: 'user', content: 'test' }] }), res);
    expect(res._status).toBe(200);
    expect(res._body.reply).toMatch(/Maafi|gadbad/);
  });

  test('Anthropic API error is forwarded', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid API key' } })
    });
    const res = makeRes();
    await handler(makeReq({ messages: [{ role: 'user', content: 'hi' }] }), res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/Invalid API key/);
  });

  test('Network failure returns 500', async () => {
    global.fetch.mockRejectedValue(new Error('Network down'));
    const res = makeRes();
    await handler(makeReq({ messages: [{ role: 'user', content: 'hi' }] }), res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/Server error/);
  });

  test('Multiple text content blocks are joined', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: [
          { type: 'text', text: 'Part one.' },
          { type: 'tool_use', id: 'x', name: 'web_search' },
          { type: 'text', text: 'Part two.' }
        ]
      })
    });
    const res = makeRes();
    await handler(makeReq({ messages: [{ role: 'user', content: 'search something' }] }), res);
    expect(res._body.reply).toBe('Part one. Part two.');
  });
});

// ── 4. PRESCRIPTION VISION MODE ──────────────────────
describe('Prescription (rxMode) vision', () => {
  test('Oversized image returns 400', async () => {
    const res = makeRes();
    await handler(makeReq({
      rxMode: true,
      imageBase64: 'A'.repeat(5600000),
      imageMime: 'image/jpeg',
      prompt: 'Read this prescription'
    }), res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/too large/);
  });

  test('Valid prescription image returns reply', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: [{ type: 'text', text: 'Medicine: Metformin 500mg, twice daily.' }]
      })
    });
    const res = makeRes();
    await handler(makeReq({
      rxMode: true,
      imageBase64: 'validbase64data',
      imageMime: 'image/jpeg',
      prompt: 'What medicines are in this prescription?'
    }), res);
    expect(res._status).toBe(200);
    expect(res._body.reply).toMatch(/Metformin/);
  });

  test('Empty vision response returns 400', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: [] })
    });
    const res = makeRes();
    await handler(makeReq({
      rxMode: true,
      imageBase64: 'data',
      prompt: 'Read this'
    }), res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/Could not read image/);
  });

  test('Vision API error is forwarded', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: { message: 'Vision model unavailable' } })
    });
    const res = makeRes();
    await handler(makeReq({
      rxMode: true,
      imageBase64: 'data',
      prompt: 'Read'
    }), res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/Vision model unavailable/);
  });

  test('Vision network failure returns 500', async () => {
    global.fetch.mockRejectedValue(new Error('timeout'));
    const res = makeRes();
    await handler(makeReq({
      rxMode: true,
      imageBase64: 'data',
      prompt: 'Read'
    }), res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/Vision error/);
  });
});

// ── 5. CORS HEADERS ──────────────────────────────────
describe('CORS headers', () => {
  test('CORS headers are set on all responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: 'text', text: 'hi' }] })
    });
    const res = makeRes();
    await handler(makeReq({ messages: [{ role: 'user', content: 'hi' }] }), res);
    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
