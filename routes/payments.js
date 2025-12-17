import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { dbRun, dbGet, dbAll } from '../database.js';
import { 
  createCheckoutSession, 
  handleWebhook, 
  getCustomerPortalUrl 
} from '../services/stripe.js';

const router = Router();

// Get pricing plans
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'monthly',
        name: 'Monthly',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited Writing Tasks',
          'Unlimited Speaking Tasks',
          'AI-Powered Evaluation',
          'Detailed Feedback',
          'Progress Tracking'
        ]
      },
      {
        id: 'yearly',
        name: 'Yearly',
        price: 79.99,
        currency: 'USD',
        interval: 'year',
        savings: '33%',
        features: [
          'Everything in Monthly',
          'Priority Support',
          'New Features First',
          'Save 33%'
        ],
        popular: true
      },
      {
        id: 'lifetime',
        name: 'Lifetime',
        price: 149.99,
        currency: 'USD',
        interval: 'one-time',
        features: [
          'Everything Forever',
          'No Recurring Payments',
          'Lifetime Updates',
          'VIP Support'
        ]
      }
    ]
  });
});

// Create checkout session
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { planType } = req.body;

    if (!['monthly', 'yearly', 'lifetime'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const session = await createCheckoutSession(
      req.user.id,
      req.user.email,
      planType
    );

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify payment success
router.get('/verify/:sessionId', requireAuth, async (req, res) => {
  try {
    const user = dbGet('SELECT is_premium, premium_until FROM users WHERE id = ?',
      [req.user.id]);

    if (user && user.is_premium) {
      res.json({
        success: true,
        isPremium: true,
        premiumUntil: user.premium_until,
        message: 'Payment successful! You now have premium access.'
      });
    } else {
      res.json({
        success: false,
        isPremium: false,
        message: 'Payment is being processed. Please wait a moment.'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get customer portal URL
router.get('/portal', requireAuth, async (req, res) => {
  try {
    const url = await getCustomerPortalUrl(req.user.id);
    res.json({ url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to get portal URL' });
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    await handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

// Get payment history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const payments = dbAll(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );

    res.json({ payments });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

export default router;
