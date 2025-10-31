import { Pool, type PoolConfig } from 'pg';

class Database {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool({ ...config });

    this.pool.on('error', (error: Error) => console.error(`[!] unexpected error on idle client: `, error));
  }

  async query(query: string, params: unknown[] = []) {
    return this.pool.query(query, params);
  }
}

export { Database };
