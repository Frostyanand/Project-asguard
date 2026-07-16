require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { Pool, neon } = require('@neondatabase/serverless');
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');

neonConfig.webSocketConstructor = ws;

async function main() {
  const sqlString = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
  console.log('Running migration over Neon WebSockets...');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Neon sql tag doesn't run multiple statements easily if there are many. 
  // But we can split by ';' and execute them or use Neon's raw execution if supported.
  const statements = sqlString
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Skipping existing schema component.');
      } else {
        throw err;
      }
    }
  }

  console.log('Migration successfully applied over WebSockets!');
}

main().catch(console.error);
