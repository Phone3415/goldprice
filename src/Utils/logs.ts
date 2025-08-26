import pg from "pg";
import env from "dotenv";
import { MILLISECONDS_7_DAYS } from "./types";

env.config();

const pool = new pg.Pool({
  connectionString: process.env.DB_CONNECTION,
  ssl: {
    rejectUnauthorized: Boolean(process.env.DB_REJECTUNAUTH ?? true),
  },
});

export let database: pg.PoolClient;
(async function () {
  try {
    database = await pool.connect();

    await database.query(`
        CREATE TABLE IF NOT EXISTS logs (
          timestamp BIGINT,
          gold_price NUMERIC(18,2) PRIMARY KEY
        )
      `);
  } catch (e) {
    console.error(e);
  }
})();

class Logs {
  constructor() {}

  public async append(currentValue: number) {
    const timestamp = Date.now();

    // Upsert in Postgres: INSERT ... ON CONFLICT DO NOTHING
    await database.query(
      `
      INSERT INTO logs (timestamp, gold_price)
      VALUES ($1, $2)
      ON CONFLICT (gold_price) DO NOTHING
    `,
      [timestamp, currentValue]
    );
  }

  public async loads(startIndex: number) {
    const pageSize = 10;

    const result = await database.query(
      `
      SELECT *
      FROM logs
      ORDER BY timestamp ASC
      OFFSET $1
      LIMIT $2
    `,
      [startIndex, pageSize]
    );

    return result.rows; // 'rows' is the array of results in pg
  }

  public async clear() {
    const result = await database.query(`DELETE FROM logs`);

    return result.rowCount; // number of rows deleted
  }

  public async clearOlderThan7Days() {
    const sevenDaysAgo = Date.now() - MILLISECONDS_7_DAYS;

    const result = await database.query(
      `
      DELETE FROM logs
      WHERE timestamp < $1
    `,
      [sevenDaysAgo]
    );

    return result.rowCount;
  }
}

export default Logs;
