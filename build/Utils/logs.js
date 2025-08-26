"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("./types");
dotenv_1.default.config();
const pool = new pg_1.default.Pool({
    connectionString: process.env.DB_CONNECTION,
    ssl: {
        rejectUnauthorized: Boolean(process.env.DB_REJECTUNAUTH ?? true),
    },
});
class Logs {
    database;
    closeTimeout = null;
    closed = false;
    constructor() {
        this.init();
    }
    async init() {
        try {
            this.database = await pool.connect();
            await this.database.query(`
        CREATE TABLE IF NOT EXISTS logs (
          timestamp BIGINT,
          gold_price NUMERIC(18,2) PRIMARY KEY
        )
      `);
            this.updateTimeout();
        }
        catch (e) {
            console.error(e);
        }
    }
    updateTimeout(delays) {
        if (this.closeTimeout)
            clearTimeout(this.closeTimeout);
        this.closeTimeout = setTimeout(() => this.end(), delays ?? 3600000);
    }
    async end() {
        await this.database.release(); // release client back to pool
        this.closed = true;
    }
    async append(currentValue) {
        const timestamp = Date.now();
        // Upsert in Postgres: INSERT ... ON CONFLICT DO NOTHING
        await this.database.query(`
      INSERT INTO logs (timestamp, gold_price)
      VALUES ($1, $2)
      ON CONFLICT (gold_price) DO NOTHING
    `, [timestamp, currentValue]);
        this.updateTimeout();
    }
    async loads(startIndex) {
        const pageSize = 10;
        const result = await this.database.query(`
      SELECT *
      FROM logs
      ORDER BY timestamp ASC
      OFFSET $1
      LIMIT $2
    `, [startIndex, pageSize]);
        this.updateTimeout();
        return result.rows; // 'rows' is the array of results in pg
    }
    async clear() {
        const result = await this.database.query(`DELETE FROM logs`);
        this.updateTimeout();
        return result.rowCount; // number of rows deleted
    }
    async clearOlderThan7Days() {
        const sevenDaysAgo = Date.now() - types_1.MILLISECONDS_7_DAYS;
        const result = await this.database.query(`
      DELETE FROM logs
      WHERE timestamp < $1
    `, [sevenDaysAgo]);
        return result.rowCount;
    }
}
exports.default = Logs;
