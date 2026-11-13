import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    console.log('Creating pg Pool...');
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 3000,
      connectionTimeoutMillis: 10000,
    });
  }
  
  return pool;
}

export default async function handler(req: any, res: any) {
  try {
    console.log('Direct pg test endpoint called');
    const pool = getPool();
    
    // Простой запрос
    const result = await pool.query('SELECT NOW() as now');
    
    res.status(200).json({
      status: 'ok',
      message: 'Direct pg connection successful',
      serverTime: result.rows[0].now,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in direct pg test:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
  }
}
