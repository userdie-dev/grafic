import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { DevicesModule } from './devices/devices.module';
import { Shift } from './entities/shift.entity';
import { Subscription } from './entities/subscription.entity';
import { User } from './entities/user.entity';
import { EventsModule } from './events/events.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

// Database configuration based on environment
const getDatabaseConfig = () => {
  // If DATABASE_URL is set (production with an external database)
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL from DATABASE_URL');
    return {
      type: 'postgres' as const,
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
