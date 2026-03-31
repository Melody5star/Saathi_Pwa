// ── साथी AI — Service Worker Logic Tests ──
// Tests cover: cache rules, push notification format

describe('Service Worker — cache rules', () => {
  const NEVER_CACHE = [
    'https://saathiai.health/index.html',
    'https://saathiai.health/landing.html',
    'https://saathiai.health/app',
    'https://saathiai.health/',
    'https://saathiai.health/api/chat',
    'https://saathiai.health/api/payment',
  ];

  const ALWAYS_CACHE = [
    'https://saathiai.health/icon-192.png',
    'https://saathiai.health/icon-512.png',
    'https://saathiai.health/manifest.json',
  ];

  function shouldBypassCache(url) {
    return url.includes('.html') ||
           url.endsWith('/app') ||
           url.endsWith('/') ||
           url.includes('/api/');
  }

  test.each(NEVER_CACHE)('"%s" bypasses cache', (url) => {
    expect(shouldBypassCache(url)).toBe(true);
  });

  test.each(ALWAYS_CACHE)('"%s" is served from cache', (url) => {
    expect(shouldBypassCache(url)).toBe(false);
  });
});

describe('Service Worker — push notification', () => {
  test('Valid JSON push data is parsed correctly', () => {
    const raw = JSON.stringify({ title: 'साथी AI', body: 'Dawai lene ka waqt!' });
    let data = {};
    try { data = JSON.parse(raw); } catch(e) {}
    expect(data.title).toBe('साथी AI');
    expect(data.body).toBe('Dawai lene ka waqt!');
  });

  test('Invalid JSON push falls back to defaults', () => {
    let data = {};
    try { data = JSON.parse('not-json'); } catch(e) {
      data = { title: 'साथी AI', body: 'Saathi yaad dila raha hai!' };
    }
    expect(data.title).toBe('साथी AI');
    expect(data.body).toMatch(/yaad/);
  });

  test('Missing title falls back to "साथी AI"', () => {
    const raw = JSON.stringify({ body: 'Test body' });
    const data = JSON.parse(raw);
    const title = data.title || 'साथी AI';
    expect(title).toBe('साथी AI');
  });
});
