import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AIService } from './aiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Configuration Status
app.get('/api/config/status', (_req, res) => {
  res.json(AIService.getStatus());
});

// AI Plan Generation
app.post('/api/plan/generate', async (req, res) => {
  try {
    const { goalText, dailyHours, targetDays } = req.body;
    if (!goalText || typeof goalText !== 'string') {
      return res.status(400).json({ error: 'goalText is required' });
    }

    const plan = await AIService.generatePlan({
      goalText,
      dailyHours: Number(dailyHours) || 4,
      targetDays: Number(targetDays) || 3,
    });

    res.json(plan);
  } catch (error: any) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Failed to generate plan', details: error.message });
  }
});

// AI Assistant Contextual Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await AIService.chat({
      message,
      context: context || { tasks: [], goals: [], schedule: [], focusSessions: [] },
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: 'Failed to process chat', details: error.message });
  }
});

// Only start the standalone listener if not running in a Vercel serverless function environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[FlowPilot Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
