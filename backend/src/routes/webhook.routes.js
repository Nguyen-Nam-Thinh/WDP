const { Router } = require('express');
const express = require('express');
const { stripe } = require('../config/stripe');
const { env } = require('../config/env');
const paymentService = require('../services/payment.service');

const router = Router();

// LƯU Ý: route này cần raw body để verify chữ ký Stripe,
// nên phải mount TRƯỚC express.json() trong server.js.
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      await paymentService.handleCheckoutCompleted(event.data.object);
    } catch (err) {
      console.error('Stripe topup handling failed:', err);
      return res.status(500).json({ received: false });
    }
  }

  res.json({ received: true });
});

module.exports = router;
