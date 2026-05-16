// stripe.js
import Stripe from 'stripe';
import env from './env.js';

const { STRIPE_SECRET_KEY } = env;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = Stripe(STRIPE_SECRET_KEY);

export default stripe;