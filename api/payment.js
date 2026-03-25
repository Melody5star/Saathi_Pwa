// साथी AI — Payment API (Instamojo)
// Vercel env vars needed: INSTAMOJO_API_KEY, INSTAMOJO_AUTH_TOKEN

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const API_KEY   = process.env.INSTAMOJO_API_KEY;
  const AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;

  if(!API_KEY || !AUTH_TOKEN) {
    return res.status(500).json({error:'Instamojo keys not configured in Vercel Environment Variables'});
  }

  // Correct URLs — test vs live
  const isTest = API_KEY.startsWith('test_');
  const BASE = isTest
    ? 'https://test.instamojo.com/api/1.1'
    : 'https://www.instamojo.com/api/1.1';

  const { action, plan, userName, userPhone, paymentId } = req.body;

  // ── VERIFY PAYMENT after redirect ──
  if(action === 'verify' && paymentId) {
    try {
      const r = await fetch(`${BASE}/payments/${paymentId}/`, {
        headers: { 'X-Api-Key': API_KEY, 'X-Auth-Token': AUTH_TOKEN }
      });
      const data = await r.json();
      const verified = data.payment && data.payment.status === 'Credit';
      return res.status(200).json({ verified, payment: data.payment });
    } catch(err) {
      return res.status(500).json({error: err.message});
    }
  }

  // ── CREATE PAYMENT REQUEST ──
  const plans = {
    founding: { amount: '99',  name: 'Saathi AI Basic',  desc: 'Saathi AI — 3 months at Rs.99/month, then Rs.299/month' },
    pro:      { amount: '299', name: 'Saathi AI Pro',     desc: 'Saathi AI Pro — Monthly subscription, all features' }
  };
  const selected = plans[plan] || plans.founding;
  const redirectUrl = 'https://saathiai.health/app?payment=success&plan=' + (plan || 'founding');

  try {
    const body = new URLSearchParams();
    body.append('purpose',      selected.name);
    body.append('amount',       selected.amount);
    body.append('description',  selected.desc);
    body.append('redirect_url', redirectUrl);
    body.append('allow_repeated_payments', 'True');
    body.append('send_email', 'False');
    body.append('send_sms', 'False');
    if(userName && userName !== 'Saathi User') body.append('buyer_name', userName);
    if(userPhone && userPhone.length === 10) body.append('phone', userPhone);

    const r = await fetch(`${BASE}/payment-requests/`, {
      method: 'POST',
      headers: {
        'X-Api-Key':    API_KEY,
        'X-Auth-Token': AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(500).json({error: 'Invalid response from Instamojo: ' + text.substring(0,200)}); }

    if(!data.success) {
      return res.status(400).json({
        error: data.message || JSON.stringify(data),
        debug: data
      });
    }

    return res.status(200).json({
      paymentUrl: data.payment_request.longurl,
      paymentId:  data.payment_request.id,
      amount:     selected.amount,
      plan:       plan
    });

  } catch(err) {
    return res.status(500).json({error: 'Payment error: ' + err.message});
  }
};
