import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }

    const sql = neon(databaseUrl);
    const result = await sql`SELECT NOW() as now, version() as version`;
    
    res.status(200).json({
      status: 'success',
      message: 'Neon работает через корневой package.json!',
      serverTime: result[0].now,
      postgresVersion: result[0].version,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
