import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../gabarita.db');
const db = new Database(dbPath);

export function initDatabase() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Study Plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      hours_per_day INTEGER NOT NULL,
      days_per_week INTEGER NOT NULL,
      total_weeks INTEGER NOT NULL,
      study_sections TEXT NOT NULL,
      schedule_weeks TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 0
    )
  `);

  // Quiz Progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_progress (
      id TEXT PRIMARY KEY,
      study_plan_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      answered_at TEXT NOT NULL,
      FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
    )
  `);

  // Schedule Progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_progress (
      id TEXT PRIMARY KEY,
      study_plan_id TEXT NOT NULL,
      block_id TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
    )
  `);

  // User Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  console.log('Database initialized successfully');
}

export default db;
