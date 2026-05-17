require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setup() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const conn = await pool.getConnection();
  try {
    console.log('Creating database...');
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    await conn.query(`USE \`${process.env.DB_NAME}\``);
    console.log('✓ Database created and selected');

    console.log('Loading schema...');
    const schema = fs.readFileSync(__dirname + '/schema_mysql_simple.sql', 'utf8');
    
    // Remove comments and split by semicolon
    const cleaned = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const stmt of cleaned) {
      try {
        await conn.query(stmt);
      } catch (err) {
        console.error('SQL Error:', err.message);
        console.error('Statement:', stmt.substring(0, 100));
      }
    }
    console.log('✓ Schema loaded');
    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await conn.release();
    await pool.end();
  }
}

setup();
