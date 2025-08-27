"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDatabase = initDatabase;
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("./types");
dotenv_1.default.config();
exports.pool = new pg_1.default.Pool({
    connectionString: process.env.DB_CONNECTION,
    ssl: {
        rejectUnauthorized: Boolean(process.env.DB_REJECTUNAUTH ?? true),
    },
});
async function initDatabase() {
    await exports.pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
          timestamp BIGINT,
          gold_price NUMERIC(18,2) PRIMARY KEY
        )
      `);
}
class Logs {
    constructor() { }
    static async init() {
        await initDatabase();
        return new Logs();
    }
    async append(currentValue) {
        const timestamp = Date.now();
        // Upsert in Postgres: INSERT ... ON CONFLICT DO NOTHING
        await exports.pool.query(`
      INSERT INTO logs (timestamp, gold_price)
      VALUES ($1, $2)
      ON CONFLICT (gold_price) DO NOTHING
    `, [timestamp, currentValue]);
    }
    async loads(startIndex) {
        const pageSize = 10;
        const result = await exports.pool.query(`
      SELECT *
      FROM logs
      ORDER BY timestamp ASC
      OFFSET $1
      LIMIT $2
    `, [startIndex, pageSize]);
        return result.rows; // 'rows' is the array of results in pg
    }
    async clear() {
        const result = await exports.pool.query(`DELETE FROM logs`);
        return result.rowCount; // number of rows deleted
    }
    async clearOlderThan7Days() {
        const sevenDaysAgo = Date.now() - types_1.MILLISECONDS_7_DAYS;
        const result = await exports.pool.query(`
      DELETE FROM logs
      WHERE timestamp < $1
    `, [sevenDaysAgo]);
        return result.rowCount;
    }
}
exports.default = Logs;
