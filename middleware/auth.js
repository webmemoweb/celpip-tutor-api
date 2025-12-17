import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../database.js';

// Verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = dbGet('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      req.user = null;
      return next();
    }

    // Check if premium is still valid
    let isPremium = !!user.is_premium;
    if (isPremium && user.premium_until) {
      const premiumUntil = new Date(user.premium_until);
      if (premiumUntil < new Date()) {
        dbRun('UPDATE users SET is_premium = 0 WHERE id = ?', [user.id]);
        isPremium = false;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: isPremium,
      premiumUntil: user.premium_until,
      demoTasksUsed: user.demo_tasks_used || 0
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    req.user = null;
    next();
  }
};

// Require authentication
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Require premium
export const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.isPremium) {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  next();
};

// Check demo limit
export const checkDemoLimit = (req, res, next) => {
  const DEMO_LIMIT = 1;
  
  if (req.user && req.user.isPremium) {
    return next();
  }

  if (req.user) {
    if (req.user.demoTasksUsed >= DEMO_LIMIT) {
      return res.status(403).json({ 
        error: 'Demo limit reached',
        message: 'You have used your free demo task. Please upgrade to premium for unlimited access.',
        upgradeRequired: true
      });
    }
  } else {
    return res.status(401).json({ 
      error: 'Login required',
      message: 'Please log in to try a free demo task or upgrade to premium.'
    });
  }

  next();
};
