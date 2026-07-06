import db from './db';

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    await db.query(
      `INSERT INTO settings (key, value) VALUES ('telegram_chat_id', '584847845') ON CONFLICT DO NOTHING`
    );
    initialized = true;
  } catch (err) {
    console.error('Failed to init settings table:', err);
  }
}
