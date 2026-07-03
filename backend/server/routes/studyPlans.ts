import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const router = express.Router();

// GET all study plans
router.get('/', (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM study_plans ORDER BY created_at DESC').all();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch study plans' });
  }
});

// GET single study plan
router.get('/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM study_plans WHERE id = ?').get(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
});

// POST create new study plan
router.post('/', (req, res) => {
  try {
    const {
      courseId,
      title,
      examDate,
      hoursPerDay,
      daysPerWeek,
      totalWeeks,
      studySections,
      scheduleWeeks
    } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO study_plans (
        id, course_id, title, exam_date, hours_per_day, days_per_week,
        total_weeks, study_sections, schedule_weeks, created_at, updated_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
      id,
      courseId,
      title,
      examDate,
      hoursPerDay,
      daysPerWeek,
      totalWeeks,
      JSON.stringify(studySections),
      JSON.stringify(scheduleWeeks),
      now,
      now
    );

    res.status(201).json({ id, ...req.body });
  } catch (error) {
    console.error('Error creating study plan:', error);
    res.status(500).json({ error: 'Failed to create study plan' });
  }
});

// PUT update study plan
router.put('/:id', (req, res) => {
  try {
    const {
      courseId,
      title,
      examDate,
      hoursPerDay,
      daysPerWeek,
      totalWeeks,
      studySections,
      scheduleWeeks
    } = req.body;

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE study_plans
      SET course_id = ?, title = ?, exam_date = ?, hours_per_day = ?,
          days_per_week = ?, total_weeks = ?, study_sections = ?,
          schedule_weeks = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      courseId,
      title,
      examDate,
      hoursPerDay,
      daysPerWeek,
      totalWeeks,
      JSON.stringify(studySections),
      JSON.stringify(scheduleWeeks),
      now,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.error('Error updating study plan:', error);
    res.status(500).json({ error: 'Failed to update study plan' });
  }
});

// DELETE study plan
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM study_plans WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    res.json({ message: 'Study plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete study plan' });
  }
});

// PATCH set active study plan
router.patch('/:id/activate', (req, res) => {
  try {
    // Deactivate all plans
    db.prepare('UPDATE study_plans SET is_active = 0').run();

    // Activate the specified plan
    const stmt = db.prepare('UPDATE study_plans SET is_active = 1 WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    res.json({ message: 'Study plan activated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate study plan' });
  }
});

// GET active study plan
router.get('/active/current', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM study_plans WHERE is_active = 1').get();
    if (!plan) {
      return res.status(404).json({ error: 'No active study plan found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active study plan' });
  }
});

export default router;
