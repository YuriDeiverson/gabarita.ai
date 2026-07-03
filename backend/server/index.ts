import express from 'express';
import cors from 'cors';
import bodyparser from 'body-parser';
import { initDatabase } from './database.js';
import studyPlansRouter from './routes/studyPlans.js';
import quizProgressRouter from './routes/quizProgress.js';
import scheduleRouter from './routes/schedule.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Routes
app.use('/api/study-plans', studyPlansRouter);
app.use('/api/quiz-progress', quizProgressRouter);
app.use('/api/schedule', scheduleRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
