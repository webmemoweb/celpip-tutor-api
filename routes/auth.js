import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet } from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    console.log('Register attempt:', email);

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email exists
    const existing = dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = dbRun(
      'INSERT INTO users (email, password, name, demo_tasks_used) VALUES (?, ?, ?, 0)',
      [email, hashedPassword, name]
    );

    console.log('User created, result:', result);

    // Get the created user to verify
    const newUser = dbGet('SELECT id, email, name, is_premium, demo_tasks_used FROM users WHERE email = ?', [email]);
    console.log('New user from DB:', newUser);

    if (!newUser || !newUser.id) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate token with correct userId
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Token generated for userId:', newUser.id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isPremium: false,
        demoTasksUsed: 0
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user.id, user.email);

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check premium status
    let isPremium = !!user.is_premium;
    if (isPremium && user.premium_until) {
      const premiumUntil = new Date(user.premium_until);
      if (premiumUntil < new Date()) {
        dbRun('UPDATE users SET is_premium = 0 WHERE id = ?', [user.id]);
        isPremium = false;
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login successful for userId:', user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium,
        premiumUntil: user.premium_until,
        demoTasksUsed: user.demo_tasks_used || 0
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  console.log('Get me - user:', req.user);
  res.json({ user: req.user });
});

// Update profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    if (newPassword) {
      const user = dbGet('SELECT password FROM users WHERE id = ?', [req.user.id]);
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      dbRun('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, req.user.id]);
    }

    if (name) {
      dbRun('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, req.user.id]);
    }

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
