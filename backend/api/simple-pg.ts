// Простой endpoint без импортов
export default async function handler(req: any, res: any) {
  try {
    // Динамический импорт pg
    const { Pool } = await import('pg');
    
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    
    const result = await pool.query('SELECT NOW() as now, version() as version');
    await pool.end();
    
    res.status(200).json({
      status: 'success',
      serverTime: result.rows[0].now,
      postgresVersion: result.rows[0].version,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
