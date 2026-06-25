const Stripe = require('stripe');
const { env } = require('./env');

let stripe = null;

if (env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
} else {
  console.warn('[Stripe] STRIPE_SECRET_KEY not set — payment features disabled');
}

module.exports = { stripe };
