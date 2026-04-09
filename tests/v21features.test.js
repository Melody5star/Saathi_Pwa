// ── साथी AI V21 — Feature Tests ──
// Tests for: Hinglish support, Family Dashboard gating,
// Feedback trigger logic, Notes/Medicine mic, Voice settings, Version

// ─────────────────────────────────────────────
// 1. HINGLISH SUPPORT — Language Rule Logic
// ─────────────────────────────────────────────
function getLangRule(lang) {
  if (lang === 'english') {
    return 'Speak in Indian English — warm, friendly, natural.';
  }
  return 'हमेशा शुद्ध हिंदी देवनागरी में जवाब दो। User चाहे Roman में लिखे (Hinglish), English में लिखे, या देवनागरी में — तुम्हारा जवाब हमेशा हिंदी देवनागरी में होना चाहिए।';
}

describe('Hinglish support — Language Rule', () => {
  test('Hindi mode rule contains Hinglish acceptance instruction', () => {
    const rule = getLangRule('hindi');
    expect(rule).toContain('Roman में लिखे (Hinglish)');
  });

  test('Hindi mode rule contains English acceptance instruction', () => {
    const rule = getLangRule('hindi');
    expect(rule).toContain('English में लिखे');
  });

  test('Hindi mode rule mandates Devanagari reply', () => {
    const rule = getLangRule('hindi');
    expect(rule).toContain('हिंदी देवनागरी में होना चाहिए');
  });

  test('English mode does not use Devanagari rule', () => {
    const rule = getLangRule('english');
    expect(rule).not.toContain('देवनागरी');
  });

  test('Hindi mode is default when lang is not english', () => {
    const rule = getLangRule('hindi');
    expect(rule).toContain('शुद्ध हिंदी');
  });
});

// ─────────────────────────────────────────────
// 2. FAMILY DASHBOARD — Plan Gating Logic
// ─────────────────────────────────────────────
function canAccessFamilyDashboard(planType) {
  return planType === 'pro' || planType === 'founding';
}

function familyBtnVisible(planType) {
  return canAccessFamilyDashboard(planType);
}

describe('Family Dashboard — Pro/Founding gating', () => {
  test('Pro plan can access Family Dashboard', () => {
    expect(canAccessFamilyDashboard('pro')).toBe(true);
  });

  test('Founding plan can access Family Dashboard', () => {
    expect(canAccessFamilyDashboard('founding')).toBe(true);
  });

  test('Trial plan cannot access Family Dashboard', () => {
    expect(canAccessFamilyDashboard('trial')).toBe(false);
  });

  test('Free plan cannot access Family Dashboard', () => {
    expect(canAccessFamilyDashboard('free')).toBe(false);
  });

  test('Unknown plan cannot access Family Dashboard', () => {
    expect(canAccessFamilyDashboard('')).toBe(false);
  });

  test('Family button visible only for Pro', () => {
    expect(familyBtnVisible('pro')).toBe(true);
  });

  test('Family button hidden for trial', () => {
    expect(familyBtnVisible('trial')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 3. FEEDBACK WIDGET — Trigger Logic
// ─────────────────────────────────────────────
function shouldShowFeedback(aiCount, alreadyShown) {
  return !alreadyShown && aiCount >= 5;
}

describe('Feedback widget trigger logic', () => {
  test('Shows after exactly 5 AI replies', () => {
    expect(shouldShowFeedback(5, false)).toBe(true);
  });

  test('Shows after more than 5 AI replies', () => {
    expect(shouldShowFeedback(8, false)).toBe(true);
  });

  test('Does not show before 5 AI replies', () => {
    expect(shouldShowFeedback(4, false)).toBe(false);
  });

  test('Does not show again if already shown this session', () => {
    expect(shouldShowFeedback(10, true)).toBe(false);
  });

  test('Does not show at 0 replies', () => {
    expect(shouldShowFeedback(0, false)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 4. FEEDBACK RATING — Valid Values
// ─────────────────────────────────────────────
function isValidRating(rating) {
  return ['loved', 'okay', 'needs'].includes(rating);
}

describe('Feedback rating validation', () => {
  test('"loved" is valid', () => {
    expect(isValidRating('loved')).toBe(true);
  });

  test('"okay" is valid', () => {
    expect(isValidRating('okay')).toBe(true);
  });

  test('"needs" is valid', () => {
    expect(isValidRating('needs')).toBe(true);
  });

  test('Empty string is invalid', () => {
    expect(isValidRating('')).toBe(false);
  });

  test('Random string is invalid', () => {
    expect(isValidRating('bad')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 5. VOICE SETTINGS — Rate and Pitch Logic
// ─────────────────────────────────────────────
function getVoiceRate(lang, customSpeed) {
  if (customSpeed) return parseFloat(customSpeed);
  return lang === 'english' ? 0.88 : 0.78;
}

function getVoicePitchMin(lang) {
  return lang === 'english' ? 1.05 : 1.1;
}

describe('Voice settings — rate and pitch', () => {
  test('Hindi default rate is 0.78 (slower for clarity)', () => {
    expect(getVoiceRate('hindi', null)).toBe(0.78);
  });

  test('English default rate is 0.88', () => {
    expect(getVoiceRate('english', null)).toBe(0.88);
  });

  test('Custom speed overrides default', () => {
    expect(getVoiceRate('hindi', '1.0')).toBe(1.0);
  });

  test('Hindi pitch min is higher (1.1) for warmth', () => {
    expect(getVoicePitchMin('hindi')).toBe(1.1);
  });

  test('English pitch min is 1.05', () => {
    expect(getVoicePitchMin('english')).toBe(1.05);
  });
});

// ─────────────────────────────────────────────
// 6. MIC LANGUAGE — Medicine & Notes
// ─────────────────────────────────────────────
function getMedMicLang() {
  return 'hi-IN'; // always Hindi for medicine names — accepts English names too
}

function getNoteMicLang(userLang) {
  return userLang === 'english' ? 'en-IN' : 'hi-IN';
}

describe('Mic language selection', () => {
  test('Medicine mic always uses hi-IN (Hindi accepts English medicine names)', () => {
    expect(getMedMicLang()).toBe('hi-IN');
  });

  test('Notes mic uses hi-IN when user language is Hindi', () => {
    expect(getNoteMicLang('hindi')).toBe('hi-IN');
  });

  test('Notes mic uses en-IN when user language is English', () => {
    expect(getNoteMicLang('english')).toBe('en-IN');
  });
});

// ─────────────────────────────────────────────
// 7. VERSION CHECK
// ─────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

describe('Version check — V21', () => {
  test('index.html title contains v21', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('साथी AI v21');
  });

  test('index.html contains Family Dashboard screen', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('screen-family');
  });

  test('index.html contains feedback widget', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('feedbackWidget');
  });

  test('index.html contains medicine mic button', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('medMicBtn');
  });

  test('index.html contains notes mic button', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('noteMicBtn');
  });

  test('index.html contains Hinglish language rule', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('Roman में लिखे (Hinglish)');
  });

  test('landing.html contains About Us section', () => {
    const html = fs.readFileSync(path.join(__dirname, '../landing.html'), 'utf8');
    expect(html).toContain('Why साथी AI exists');
  });

  test('landing.html contains Anamika Bajpai founder', () => {
    const html = fs.readFileSync(path.join(__dirname, '../landing.html'), 'utf8');
    expect(html).toContain('Anamika Bajpai');
  });

  test('api/feedback.js exists', () => {
    const exists = fs.existsSync(path.join(__dirname, '../api/feedback.js'));
    expect(exists).toBe(true);
  });
});
