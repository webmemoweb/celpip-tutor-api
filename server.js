import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database
import { initDatabase } from './database.js';

// Import services
import { initializeGemini } from './services/gemini.js';
import { initializeStripe } from './services/stripe.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import paymentRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize everything
const init = async () => {
  // Initialize database first
  await initDatabase();
  
  // Initialize services
  initializeGemini();
  initializeStripe();

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  app.use(cors(corsOptions));

  // Parse JSON
  app.use(express.json({ limit: '10mb' }));

  // Auth middleware
  app.use(authenticateToken);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      user: req.user ? { id: req.user.id, isPremium: req.user.isPremium } : null
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/payments', paymentRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CELPIP AI Tutor API Server                          ║
║                                                           ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
};

// Start the server
init().catch(console.error);

export default app;
