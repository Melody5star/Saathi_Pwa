// ══════════════════════════════════════════════════════
//  साथी AI — Instamojo Payment API
//  File: api/payment.js
//  Env vars in Vercel:
//    INSTAMOJO_API_KEY
//    INSTAMOJO_AUTH_TOKEN
//    INSTAMOJO_PRIVATE_SALT
// ══════════════════════════════════════════════════════

const INSTAMOJO_BASE = 'https://www.instamojo.com/api/1.1';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const { action, plan, userName, userPhone, paymentId } = req.body;

  // ── VERIFY PAYMENT (webhook / confirm after payment) ──
  if(action === 'verify' && paymentId) {
    try {
      const r = await fetch(`${INSTAMOJO_BASE}/payments/${paymentId}/`, {
        headers: {
          'X-Api-Key':    process.env.INSTAMOJO_API_KEY,
          'X-Auth-Token': process.env.INSTAMOJO_AUTH_TOKEN
        }
      });
      const data = await r.json();
      if(data.payment && data.payment.status === 'Credit') {
        return res.status(200).json({ verified: true, payment: data.payment });
      }
      return res.status(200).json({ verified: false });
    } catch(err) {
      return res.status(500).json({error: 'Verification error: ' + err.message});
    }
  }

  // ── CREATE PAYMENT REQUEST ──
  if(!process.env.INSTAMOJO_API_KEY) {
    return res.status(500).json({error:'INSTAMOJO_API_KEY not set in Vercel'});
  }

  // Plan config
  const plans = {
    founding: {
      amount: '99',
      name:   'Saathi AI — Founding Member',
      desc:   '3 months at Rs.99/month, then Rs.299/month. Unlimited conversations, reminders, prescription reader, SOS.'
    },
    pro: {
      amount: '299',
      name:   'Saathi AI Pro',
      desc:   'Monthly subscription — unlimited conversations, all features unlocked.'
    }
  };
  const selected = plans[plan] || plans.founding;

  // Redirect URL — after payment Instamojo sends user here
  const redirectUrl = 'https://saathiai.health?payment=success&plan=' + (plan||'founding');

  try {
    // Build form data
    const formData = new URLSearchParams();
    formData.append('purpose',      selected.name);
    formData.append('amount',       selected.amount);
    formData.append('description',  selected.desc);
    formData.append('redirect_url', redirectUrl);
    formData.append('allow_repeated_payments', 'True');
    if(userName)  formData.append('buyer_name', userName);
    if(userPhone) formData.append('phone',      userPhone);

    const r = await fetch(`${INSTAMOJO_BASE}/payment-requests/`, {
      method: 'POST',
      headers: {
        'X-Api-Key':    process.env.INSTAMOJO_API_KEY,
        'X-Auth-Token': process.env.INSTAMOJO_AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await r.json();

    if(!data.success) {
      return res.status(400).json({error: JSON.stringify(data) || 'Payment request failed'});
    }

    return res.status(200).json({
      paymentUrl: data.payment_request.longurl,
      paymentId:  data.payment_request.id,
      plan:       plan,
      amount:     selected.amount
    });

  } catch(err) {
    return res.status(500).json({error: 'Payment error: ' + err.message});
  }
};
