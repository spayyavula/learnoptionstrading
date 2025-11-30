/**
 * Database Schema Migration Script
 * Runs the Azure PostgreSQL schema migration
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string with URL-encoded password (@ = %40, ! = %21)
const connectionString = 'postgresql://optionsadmin:%40Sree870709%21@optionsacademy-staging-db.postgres.database.azure.com:5432/optionsacademy?sslmode=require';

async function runMigration() {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Azure PostgreSQL...');

    // Test connection
    const testResult = await pool.query('SELECT current_database(), current_user, version()');
    console.log('Connected successfully!');
    console.log('Database:', testResult.rows[0].current_database);
    console.log('User:', testResult.rows[0].current_user);
    console.log('PostgreSQL version:', testResult.rows[0].version.split(',')[0]);

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'azure-schema.sql');
    console.log('\nReading schema from:', schemaPath);

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file loaded (' + Math.round(schema.length / 1024) + ' KB)');

    // Execute schema
    console.log('\nExecuting schema migration...');
    await pool.query(schema);
    console.log('Schema migration completed successfully!');

    // Verify tables were created
    console.log('\nVerifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nCreated tables:');
    tablesResult.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.position) {
      console.error('Error at position:', error.position);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
