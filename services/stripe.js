import Stripe from 'stripe';
import { dbRun, dbGet } from '../database.js';

let stripe = null;

export const initializeStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY not set - payments disabled');
    return false;
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized');
  return true;
};

// Create checkout session
export const createCheckoutSession = async (userId, userEmail, planType = 'monthly') => {
  if (!stripe) throw new Error('Stripe not initialized');

  const user = dbGet('SELECT * FROM users WHERE id = ?', [userId]);
  
  let customerId = user?.stripe_customer_id;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId: userId.toString() }
    });
    customerId = customer.id;
    
    dbRun('UPDATE users SET stripe_customer_id = ? WHERE id = ?',
      [customerId, userId]);
  }

  const prices = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY,
    lifetime: process.env.STRIPE_PRICE_LIFETIME
  };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: prices[planType],
        quantity: 1,
      },
    ],
    mode: planType === 'lifetime' ? 'payment' : 'subscription',
    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    metadata: {
      userId: userId.toString(),
      planType: planType
    }
  });

  return session;
};

// Handle webhook events
export const handleWebhook = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.metadata.userId);
      const planType = session.metadata.planType;
      
      let premiumUntil;
      if (planType === 'lifetime') {
        premiumUntil = new Date('2099-12-31').toISOString();
      } else if (planType === 'yearly') {
        premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      dbRun(
        'UPDATE users SET is_premium = 1, premium_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [premiumUntil, userId]
      );

      dbRun(
        'INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status, plan_type) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, session.payment_intent || session.subscription, session.amount_total, session.currency, 'completed', planType]
      );

      console.log(`✅ User ${userId} upgraded to premium (${planType})`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      const user = dbGet('SELECT id FROM users WHERE stripe_customer_id = ?', [customerId]);
      
      if (user) {
        dbRun(
          'UPDATE users SET is_premium = 0, premium_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );
        console.log(`⚠️ User ${user.id} subscription cancelled`);
      }
      break;
    }
  }
};

// Get customer portal URL
export const getCustomerPortalUrl = async (userId) => {
  if (!stripe) throw new Error('Stripe not initialized');

  const user = dbGet('SELECT stripe_customer_id FROM users WHERE id = ?', [userId]);
  
  if (!user?.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/dashboard`,
  });

  return session.url;
};
