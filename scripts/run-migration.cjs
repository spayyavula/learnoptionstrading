const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://optionsadmin:@Sree870709!@optionsacademy-prod-db.postgres.database.azure.com:5432/optionsacademy?sslmode=require';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    const migrationFile = path.join(__dirname, '..', 'database', 'migrations', '001_add_password_auth.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('Running migration...');

    // Run the entire SQL file at once (handles $$ delimited functions)
    await client.query(sql);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
