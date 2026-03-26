const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  }
});

console.log('Connecting to NeonDB (PostgreSQL)...');

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        picture TEXT,
        created_at TEXT,
        password_hash TEXT
      );

      CREATE TABLE IF NOT EXISTS hackathons (
        id VARCHAR(255) PRIMARY KEY,
        judge_id VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        created_at TEXT,
        FOREIGN KEY(judge_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(255) PRIMARY KEY,
        hackathon_id VARCHAR(255),
        team_name VARCHAR(255),
        raw_content TEXT,
        prototype_url TEXT,
        total_score REAL,
        confidence_tier VARCHAR(50),
        dimension_scores TEXT,
        agent_outputs TEXT,
        feedback_report TEXT,
        bias_flags TEXT,
        created_at TEXT,
        FOREIGN KEY(hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS overrides (
        id VARCHAR(255) PRIMARY KEY,
        submission_id VARCHAR(255),
        dimension VARCHAR(50),
        original_score REAL,
        new_score REAL,
        reason TEXT,
        judge_name VARCHAR(255),
        created_at TEXT,
        FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      );
    `);

    // Safely attempt to add columns if table already existed without them
    try {
      await client.query('ALTER TABLE submissions ADD COLUMN hackathon_id VARCHAR(255)');
    } catch (e) {
      // Ignore if column already exists (PG throws 42701 duplicate_column)
    }

    try {
      await client.query('ALTER TABLE hackathons ADD COLUMN judge_id VARCHAR(255)');
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await client.query('ALTER TABLE users ADD COLUMN password_hash TEXT');
    } catch (e) {
      // Ignore if column already exists
    }

    console.log('NeonDB tables initialized/patched successfully.');
  } catch (err) {
    console.error('Failed to initialize NeonDB tables:', err);
  } finally {
    client.release();
  }
}

initDB();

module.exports = pool;
