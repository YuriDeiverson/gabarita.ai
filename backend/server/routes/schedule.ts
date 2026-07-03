import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateSchedule } from '../utils/scheduleGenerator.js';

const router = express.Router();

// GET schedule progress for a study plan
router.get('/progress/:studyPlanId', (req, res) => {
  try {
    const progress = db.prepare('SELECT * FROM schedule_progress WHERE study_plan_id = ?').all(req.params.studyPlanId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule progress' });
  }
});

// POST save schedule progress
router.post('/progress', (req, res) => {
  try {
    const { studyPlanId, blockId, isCompleted } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO schedule_progress (id, study_plan_id, block_id, is_completed, completed_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, studyPlanId, blockId, isCompleted ? 1 : 0, isCompleted ? now : null);

    res.status(201).json({ id, ...req.body });
  } catch (error) {
    console.error('Error saving schedule progress:', error);
    res.status(500).json({ error: 'Failed to save schedule progress' });
  }
});

// PUT update schedule progress
router.put('/progress/:id', (req, res) => {
  try {
    const { isCompleted } = req.body;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE schedule_progress
      SET is_completed = ?, completed_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(isCompleted ? 1 : 0, isCompleted ? now : null, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule progress not found' });
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.error('Error updating schedule progress:', error);
    res.status(500).json({ error: 'Failed to update schedule progress' });
  }
});

// DELETE schedule progress entry
router.delete('/progress/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM schedule_progress WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule progress not found' });
    }

    res.json({ message: 'Schedule progress deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule progress' });
  }
});

// POST generate schedule based on study parameters
router.post('/generate', (req, res) => {
  try {
    const {
      courseId,
      examDate,
      studyDays,
      studySections
    } = req.body;

    const scheduleWeeks = generateSchedule({
      courseId,
      examDate,
      studyDays,
      studySections
    });

    res.json({ scheduleWeeks });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// GET schedule statistics for a study plan
router.get('/stats/:studyPlanId', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_blocks,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_blocks
      FROM schedule_progress
      WHERE study_plan_id = ?
    `).get(req.params.studyPlanId);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule statistics' });
  }
});

export default router;
