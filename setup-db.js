require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const connection = await pool.getConnection();

  try {
    // 1. Create database
    console.log('Creating database...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✓ Database created/exists');

    // 2. Select database
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    console.log('✓ Database selected');

    // 3. Execute schema
    console.log('Loading schema...');
    const schema = fs.readFileSync('./backend/schema_mysql_simple.sql', 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    console.log('✓ Schema loaded');

    console.log('\n✅ Database setup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

setupDatabase();
