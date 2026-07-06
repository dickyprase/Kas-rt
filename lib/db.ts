import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://kasadmin:kas_rahasia_2026@localhost:5432/kas_db',
});

export default pool;
