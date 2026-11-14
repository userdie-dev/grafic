import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import pg from 'pg';
import { DatabaseModule } from './database/database.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { Shift } from './entities/shift.entity.js';
import { Subscription } from './entities/subscription.entity.js';
import { User } from './entities/user.entity.js';
import { EventsModule } from './events/events.module.js';
import { ShiftsModule } from './shifts/shifts.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';

// Database configuration based on environment
const getDatabaseConfig = () => {
  // If DATABASE_URL is set (production with an external database)
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL from DATABASE_URL');
    return {
      type: 'postgres' as const,
      // Make the driver visible to serverless dependency tracing and avoid
      // TypeORM's dynamic require('pg') in the deployed function.
      driver: pg,
      url: process.env.DATABASE_URL,
      entities: [User, Shift, Subscription],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
      connectTimeoutMS: 10000,
      extra: {
        max: 1, // Minimal pool size for serverless
        idleTimeoutMillis: 3000,
      },
    };
  }
  
  // Local development with SQLite
  console.log('Using SQLite for local development');
  return {
    type: 'better-sqlite3' as const,
    database: process.env.DB_PATH ?? 'grafic.sqlite',
    entities: [User, Shift, Subscription],
    synchronize: true,
  };
};

@Module({
  imports: [
    // Must come first so .env is loaded before getDatabaseConfig() runs.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'test' || !!process.env.VITEST,
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    DevicesModule,
    EventsModule,
    ShiftsModule,
    SubscriptionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
