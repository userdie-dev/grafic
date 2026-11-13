import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from './devices/devices.module';
import { Shift } from './entities/shift.entity';
import { Subscription } from './entities/subscription.entity';
import { User } from './entities/user.entity';
import { EventsModule } from './events/events.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

// Database configuration based on environment
const getDatabaseConfig = () => {
  // If DATABASE_URL is set (production on Vercel with external DB)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      entities: [User, Shift, Subscription],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    };
  }
  
  // Local development with SQLite
  return {
    type: 'better-sqlite3' as const,
    database: process.env.DB_PATH ?? 'grafic.sqlite',
    entities: [User, Shift, Subscription],
    synchronize: true,
  };
};

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DevicesModule,
    EventsModule,
    ShiftsModule,
    SubscriptionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
