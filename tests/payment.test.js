// ── साथी AI — api/payment.js Unit Tests ──
// Tests cover: create payment request, verify payment, error handling

const handler = require('../api/payment');

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
  process.env.INSTAMOJO_API_KEY   = 'live_key_abc123';
  process.env.INSTAMOJO_AUTH_TOKEN = 'live_token_xyz';
});

// ── 1. METHOD VALIDATION ──────────────────────────────
describe('Method validation', () => {
  test('GET returns 405', async () => {
    const res = makeRes();
    await handler(makeReq({}, 'GET'), res);
    expect(res._status).toBe(405);
  });

  test('OPTIONS returns 200', async () => {
    const res = makeRes();
    await handler(makeReq({}, 'OPTIONS'), res);
    expect(res._status).toBe(200);
  });
});

// ── 2. ENV VAR CHECKS ────────────────────────────────
describe('Missing Instamojo credentials', () => {
  test('Missing API key returns 500', async () => {
    delete process.env.INSTAMOJO_API_KEY;
    const res = makeRes();
    await handler(makeReq({ plan: 'founding' }), res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/Instamojo keys/);
  });

  test('Missing auth token returns 500', async () => {
    delete process.env.INSTAMOJO_AUTH_TOKEN;
    const res = makeRes();
    await handler(makeReq({ plan: 'founding' }), res);
    expect(res._status).toBe(500);
  });
});

// ── 3. CREATE PAYMENT — FOUNDING PLAN ────────────────
describe('Create payment — founding plan', () => {
  test('Returns paymentUrl and correct amount Rs.99', async () => {
    global.fetch.mockResolvedValueOnce({
      text: async () => JSON.stringify({
        success: true,
        payment_request: {
          id: 'req_abc123',
          longurl: 'https://www.instamojo.com/@test/abc123'
        }
      })
    });
    const res = makeRes();
    await handler(makeReq({ plan: 'founding', userName: 'Ravi', userPhone: '9876543210' }), res);
    expect(res._status).toBe(200);
    expect(res._body.paymentUrl).toMatch(/instamojo/);
    expect(res._body.amount).toBe('99');
    expect(res._body.plan).toBe('founding');
  });

  test('Defaults to founding plan if plan is missing', async () => {
    global.fetch.mockResolvedValueOnce({
      text: async () => JSON.stringify({
        success: true,
        payment_request: { id: 'req_def', longurl: 'https://www.instamojo.com/@test/def' }
      })
    });
    const res = makeRes();
    await handler(makeReq({}), res);
    expect(res._status).toBe(200);
    expect(res._body.amount).toBe('99');
  });
});

// ── 4. CREATE PAYMENT — PRO PLAN ─────────────────────
describe('Create payment — pro plan', () => {
  test('Returns correct amount Rs.299', async () => {
    global.fetch.mockResolvedValueOnce({
      text: async () => JSON.stringify({
        success: true,
        payment_request: { id: 'req_pro1', longurl: 'https://www.instamojo.com/@test/pro1' }
      })
    });
    const res = makeRes();
    await handler(makeReq({ plan: 'pro', userName: 'Anita', userPhone: '9123456789' }), res);
    expect(res._status).toBe(200);
    expect(res._body.amount).toBe('299');
    expect(res._body.plan).toBe('pro');
  });
});

// ── 5. INSTAMOJO FAILURE RESPONSES ───────────────────
describe('Instamojo failure handling', () => {
  test('Instamojo success:false returns 400 with error', async () => {
    global.fetch.mockResolvedValueOnce({
      text: async () => JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      })
    });
    const res = makeRes();
    await handler(makeReq({ plan: 'founding' }), res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/Invalid credentials/);
  });

  test('Non-JSON response returns 500', async () => {
    global.fetch.mockResolvedValueOnce({
      text: async () => '<html>Error page</html>'
    });
    const res = makeRes();
    await handler(makeReq({ plan: 'founding' }), res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/Invalid response/);
  });

  test('Network failure returns 500', async () => {
    global.fetch.mockRejectedValue(new Error('Connection refused'));
    const res = makeRes();
    await handler(makeReq({ plan: 'pro' }), res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/Payment error/);
  });
});

// ── 6. VERIFY PAYMENT ────────────────────────────────
describe('Payment verification', () => {
  test('Verified payment (Credit) returns verified:true', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        payment: { id: 'pay_abc', status: 'Credit', amount: '99' }
      })
    });
    const res = makeRes();
    await handler(makeReq({ action: 'verify', paymentId: 'pay_abc' }), res);
    expect(res._status).toBe(200);
    expect(res._body.verified).toBe(true);
  });

  test('Pending payment returns verified:false', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        payment: { id: 'pay_xyz', status: 'Pending' }
      })
    });
    const res = makeRes();
    await handler(makeReq({ action: 'verify', paymentId: 'pay_xyz' }), res);
    expect(res._status).toBe(200);
    expect(res._body.verified).toBe(false);
  });

  test('Missing payment in verify response returns verified:false', async () => {
    // Fixed: Boolean(data.payment && data.payment.status === 'Credit') now returns false not undefined
    global.fetch.mockResolvedValueOnce({
      json: async () => ({})
    });
    const res = makeRes();
    await handler(makeReq({ action: 'verify', paymentId: 'pay_none' }), res);
    expect(res._status).toBe(200);
    expect(res._body.verified).toBe(false);
  });

  test('Verify network failure returns 500', async () => {
    global.fetch.mockRejectedValue(new Error('timeout'));
    const res = makeRes();
    await handler(makeReq({ action: 'verify', paymentId: 'pay_fail' }), res);
    expect(res._status).toBe(500);
  });
});

// ── 7. TEST vs LIVE URL SELECTION ────────────────────
describe('Test vs Live API URL', () => {
  test('test_ key uses test.instamojo.com', async () => {
    process.env.INSTAMOJO_API_KEY = 'test_key_abc';
    global.fetch.mockResolvedValueOnce({
      text: async () => JSON.stringify({
        success: true,
        payment_request: { id: 'r1', longurl: 'https://test.instamojo.com/@t/r1' }
      })
    });
    const res = makeRes();
    await handler(makeReq({ plan: 'founding' }), res);
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('test.instamojo.com');
  });

  test('live key uses www.instamojo.com', async () => {
    process.env.INSTAMOJO_API_KEY = 'live_key_abc';
    global.fetch.mockResolvedValueOnce({
      text: async () => JSON.stringify({
        success: true,
        payment_request: { id: 'r2', longurl: 'https://www.instamojo.com/@t/r2' }
      })
    });
    const res = makeRes();
    await handler(makeReq({ plan: 'pro' }), res);
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('www.instamojo.com');
  });
});
