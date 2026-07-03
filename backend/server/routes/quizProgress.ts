import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const router = express.Router();

// GET all quiz progress for a study plan
router.get('/study-plan/:studyPlanId', (req, res) => {
  try {
    const progress = db.prepare('SELECT * FROM quiz_progress WHERE study_plan_id = ?').all(req.params.studyPlanId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz progress' });
  }
});

// GET single quiz progress entry
router.get('/:id', (req, res) => {
  try {
    const progress = db.prepare('SELECT * FROM quiz_progress WHERE id = ?').get(req.params.id);
    if (!progress) {
      return res.status(404).json({ error: 'Quiz progress not found' });
    }
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz progress' });
  }
});

// POST save quiz answer
router.post('/', (req, res) => {
  try {
    const { studyPlanId, questionId, answer, isCorrect } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO quiz_progress (id, study_plan_id, question_id, answer, is_correct, answered_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, studyPlanId, questionId, answer, isCorrect ? 1 : 0, now);

    res.status(201).json({ id, ...req.body });
  } catch (error) {
    console.error('Error saving quiz progress:', error);
    res.status(500).json({ error: 'Failed to save quiz progress' });
  }
});

// PUT update quiz answer
router.put('/:id', (req, res) => {
  try {
    const { answer, isCorrect } = req.body;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE quiz_progress
      SET answer = ?, is_correct = ?, answered_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(answer, isCorrect ? 1 : 0, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quiz progress not found' });
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.error('Error updating quiz progress:', error);
    res.status(500).json({ error: 'Failed to update quiz progress' });
  }
});

// DELETE quiz progress entry
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM quiz_progress WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quiz progress not found' });
    }

    res.json({ message: 'Quiz progress deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz progress' });
  }
});

// DELETE all quiz progress for a study plan
router.delete('/study-plan/:studyPlanId', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM quiz_progress WHERE study_plan_id = ?');
    stmt.run(req.params.studyPlanId);

    res.json({ message: 'All quiz progress deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz progress' });
  }
});

// GET quiz statistics for a study plan
router.get('/stats/:studyPlanId', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_answered,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as wrong_answers
      FROM quiz_progress
      WHERE study_plan_id = ?
    `).get(req.params.studyPlanId);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz statistics' });
  }
});

export default router;
