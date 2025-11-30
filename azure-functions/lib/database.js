"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.query = query;
exports.queryOne = queryOne;
exports.transaction = transaction;
exports.checkDatabaseHealth = checkDatabaseHealth;
const pg_1 = require("pg");
let pool = null;
function getPool() {
    if (!pool) {
        const connectionString = process.env.AZURE_POSTGRESQL_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('AZURE_POSTGRESQL_CONNECTION_STRING environment variable is required');
        }
        pool = new pg_1.Pool({
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected error on idle PostgreSQL client', err);
        });
    }
    return pool;
}
async function query(text, params) {
    const pool = getPool();
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV !== 'production') {
            console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
        }
        return result.rows;
    }
    catch (error) {
        console.error('Database query error:', { text: text.substring(0, 100), error });
        throw error;
    }
}
async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows.length > 0 ? rows[0] : null;
}
async function transaction(callback) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
// Health check function
async function checkDatabaseHealth() {
    try {
        const result = await query('SELECT 1 as health');
        return result.length > 0 && result[0].health === 1;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=database.js.map