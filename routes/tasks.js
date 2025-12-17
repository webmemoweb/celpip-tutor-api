import { Router } from 'express';
import { dbRun, dbGet } from '../database.js';
import { requireAuth, checkDemoLimit } from '../middleware/auth.js';
import { 
  generateWritingTask, 
  generateSpeakingTask, 
  evaluateWriting, 
  evaluateSpeaking 
} from '../services/gemini.js';
import { DEMO_WRITING_TASK, DEMO_SPEAKING_TASK, INITIAL_TASKS } from '../constants.js';

const router = Router();

// Get available tasks based on user status
router.get('/available', (req, res) => {
  const isPremium = req.user?.isPremium;
  const demoTasksUsed = req.user?.demoTasksUsed || 0;

  if (isPremium) {
    res.json({
      status: 'premium',
      tasks: INITIAL_TASKS,
      canGenerate: true,
      message: 'You have unlimited access to all tasks!'
    });
  } else if (req.user) {
    if (demoTasksUsed >= 1) {
      res.json({
        status: 'demo_exhausted',
        tasks: [],
        canGenerate: false,
        message: 'You have used your free demo. Upgrade to premium for unlimited access!',
        upgradeRequired: true
      });
    } else {
      res.json({
        status: 'demo',
        tasks: [DEMO_WRITING_TASK],
        canGenerate: false,
        remainingDemo: 1 - demoTasksUsed,
        message: 'Try 1 free task! Upgrade for unlimited access.'
      });
    }
  } else {
    res.json({
      status: 'guest',
      tasks: [],
      canGenerate: false,
      message: 'Please log in to try a free demo task or upgrade to premium.',
      loginRequired: true
    });
  }
});

// Get a specific task
router.get('/:type', (req, res) => {
  const { type } = req.params;
  const isPremium = req.user?.isPremium;

  if (type === 'TASK_1_EMAIL' && !isPremium) {
    return res.json({ task: DEMO_WRITING_TASK });
  }

  if (!isPremium) {
    return res.status(403).json({ 
      error: 'Premium required',
      message: 'Upgrade to premium to access all tasks.'
    });
  }

  const task = INITIAL_TASKS.find(t => t.type === type);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ task });
});

// Generate new task (AI)
router.post('/generate', requireAuth, checkDemoLimit, async (req, res) => {
  try {
    const { type, mode } = req.body;

    let task;
    if (mode === 'WRITING') {
      task = await generateWritingTask(type);
    } else {
      task = await generateSpeakingTask(type);
    }

    // Track usage
    dbRun(
      'INSERT INTO task_usage (user_id, task_type, task_mode, is_demo) VALUES (?, ?, ?, ?)',
      [req.user.id, type, mode, req.user.isPremium ? 0 : 1]
    );

    // If demo user, increment demo count
    if (!req.user.isPremium) {
      dbRun('UPDATE users SET demo_tasks_used = demo_tasks_used + 1 WHERE id = ?',
        [req.user.id]);
    }

    res.json({ task });

  } catch (error) {
    console.error('Task generation error:', error);
    res.status(500).json({ error: 'Failed to generate task' });
  }
});

// Evaluate writing response
router.post('/evaluate/writing', requireAuth, checkDemoLimit, async (req, res) => {
  try {
    const { task, userText } = req.body;

    if (!userText || userText.trim().length < 20) {
      return res.status(400).json({ error: 'Response too short' });
    }

    const result = await evaluateWriting(task, userText);

    // Track usage
    dbRun(
      'INSERT INTO task_usage (user_id, task_type, task_mode, is_demo) VALUES (?, ?, ?, ?)',
      [req.user.id, task.type, 'WRITING', req.user.isPremium ? 0 : 1]
    );

    // If demo user, increment demo count
    if (!req.user.isPremium) {
      dbRun('UPDATE users SET demo_tasks_used = demo_tasks_used + 1 WHERE id = ?',
        [req.user.id]);
    }

    res.json({ result });

  } catch (error) {
    console.error('Writing evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

// Evaluate speaking response
router.post('/evaluate/speaking', requireAuth, checkDemoLimit, async (req, res) => {
  try {
    const { task, audioBase64 } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    const result = await evaluateSpeaking(task, audioBase64);

    // Track usage
    dbRun(
      'INSERT INTO task_usage (user_id, task_type, task_mode, is_demo) VALUES (?, ?, ?, ?)',
      [req.user.id, task.type, 'SPEAKING', req.user.isPremium ? 0 : 1]
    );

    // If demo user, increment demo count
    if (!req.user.isPremium) {
      dbRun('UPDATE users SET demo_tasks_used = demo_tasks_used + 1 WHERE id = ?',
        [req.user.id]);
    }

    res.json({ result });

  } catch (error) {
    console.error('Speaking evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

export default router;
