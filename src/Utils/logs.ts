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

class Logs {
  private database!: pg.PoolClient;
  private closeTimeout: NodeJS.Timeout | null = null;
  public closed: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.database = await pool.connect();

      await this.database.query(`
        CREATE TABLE IF NOT EXISTS logs (
          timestamp BIGINT,
          gold_price NUMERIC(18,2) PRIMARY KEY
        )
      `);

      this.updateTimeout();
    } catch (e) {
      console.error(e);
    }
  }

  private updateTimeout(delays?: number) {
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
    this.closeTimeout = setTimeout(() => this.end(), delays ?? 3600000);
  }

  public async end() {
    await this.database.release(); // release client back to pool
    this.closed = true;
  }

  public async append(currentValue: number) {
    const timestamp = Date.now();

    // Upsert in Postgres: INSERT ... ON CONFLICT DO NOTHING
    await this.database.query(
      `
      INSERT INTO logs (timestamp, gold_price)
      VALUES ($1, $2)
      ON CONFLICT (gold_price) DO NOTHING
    `,
      [timestamp, currentValue]
    );

    this.updateTimeout();
  }

  public async loads(startIndex: number) {
    const pageSize = 10;

    const result = await this.database.query(
      `
      SELECT *
      FROM logs
      ORDER BY timestamp ASC
      OFFSET $1
      LIMIT $2
    `,
      [startIndex, pageSize]
    );

    this.updateTimeout();
    return result.rows; // 'rows' is the array of results in pg
  }

  public async clear() {
    const result = await this.database.query(`DELETE FROM logs`);
    this.updateTimeout();
    return result.rowCount; // number of rows deleted
  }

  public async clearOlderThan7Days() {
    const sevenDaysAgo = Date.now() - MILLISECONDS_7_DAYS;

    const result = await this.database.query(
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
