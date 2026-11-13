import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Shift } from '../src/entities/shift.entity';
import { Subscription } from '../src/entities/subscription.entity';

let dataSource: DataSource | null = null;

async function getDataSource() {
  if (!dataSource) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    console.log('Creating DataSource with URL:', databaseUrl.substring(0, 30) + '...');
    
    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [User, Shift, Subscription],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
      connectTimeoutMS: 10000,
      extra: {
        max: 1,
        idleTimeoutMillis: 3000,
      },
    });

    console.log('Initializing DataSource...');
    await dataSource.initialize();
    console.log('DataSource initialized successfully');
  }
  
  return dataSource;
}

export default async function handler(req: any, res: any) {
  try {
    console.log('Test endpoint called');
    const ds = await getDataSource();
    
    // Простой запрос
    const userCount = await ds.getRepository(User).count();
    
    res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
  }
}
