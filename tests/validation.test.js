// ── साथी AI — Frontend Validation Logic Tests ──
// Tests the onboarding input validation rules used in index.html

// Phone validation (must be 10 digits, Indian mobile)
function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Name validation (non-empty, min 2 chars)
// BUG: empty string '' is falsy, so `name &&` short-circuits and returns '' instead of false
// Fix: use Boolean() or explicit length check
function validateName(name) {
  return Boolean(name && name.trim().length >= 2);
}

// Message validation (non-empty after trim)
// BUG: same as validateName — empty string returns '' not false
function validateMessage(msg) {
  return Boolean(msg && msg.trim().length > 0);
}

// Image size check (<= 5.5MB base64)
function validateImageSize(base64) {
  return base64.length <= 5500000;
}

// Plan check
function isValidPlan(plan) {
  return ['founding', 'pro'].includes(plan);
}

// ── Phone Validation ─────────────────────────────────
describe('Phone number validation', () => {
  test('Valid 10-digit mobile starting with 9', () => {
    expect(validatePhone('9876543210')).toBe(true);
  });
  test('Valid mobile starting with 6', () => {
    expect(validatePhone('6789012345')).toBe(true);
  });
  test('Invalid — starts with 5', () => {
    expect(validatePhone('5876543210')).toBe(false);
  });
  test('Invalid — less than 10 digits', () => {
    expect(validatePhone('987654321')).toBe(false);
  });
  test('Invalid — more than 10 digits', () => {
    expect(validatePhone('98765432101')).toBe(false);
  });
  test('Invalid — contains letters', () => {
    expect(validatePhone('9876abc210')).toBe(false);
  });
  test('Invalid — empty string', () => {
    expect(validatePhone('')).toBe(false);
  });
});

// ── Name Validation ──────────────────────────────────
describe('Name validation', () => {
  test('Valid name', () => {
    expect(validateName('Ravi')).toBe(true);
  });
  test('Valid Hindi name', () => {
    expect(validateName('रवि')).toBe(true);
  });
  test('Invalid — single character', () => {
    expect(validateName('R')).toBe(false);
  });
  test('Invalid — empty string', () => {
    expect(validateName('')).toBe(false);
  });
  test('Invalid — only spaces', () => {
    expect(validateName('   ')).toBe(false);
  });
});

// ── Message Validation ───────────────────────────────
describe('Chat message validation', () => {
  test('Valid message', () => {
    expect(validateMessage('Namaste')).toBe(true);
  });
  test('Valid Hindi message', () => {
    expect(validateMessage('आप कैसे हैं?')).toBe(true);
  });
  test('Invalid — empty message', () => {
    expect(validateMessage('')).toBe(false);
  });
  test('Invalid — whitespace only', () => {
    expect(validateMessage('   ')).toBe(false);
  });
});

// ── Image Size Validation ────────────────────────────
describe('Prescription image size validation', () => {
  test('Small image passes', () => {
    expect(validateImageSize('A'.repeat(100))).toBe(true);
  });
  test('Image at limit (5.5MB) passes', () => {
    expect(validateImageSize('A'.repeat(5500000))).toBe(true);
  });
  test('Image over limit fails', () => {
    expect(validateImageSize('A'.repeat(5500001))).toBe(false);
  });
});

// ── Plan Validation ──────────────────────────────────
describe('Payment plan validation', () => {
  test('"founding" is valid', () => {
    expect(isValidPlan('founding')).toBe(true);
  });
  test('"pro" is valid', () => {
    expect(isValidPlan('pro')).toBe(true);
  });
  test('Unknown plan is invalid', () => {
    expect(isValidPlan('enterprise')).toBe(false);
  });
  test('Empty string is invalid', () => {
    expect(isValidPlan('')).toBe(false);
  });
});
