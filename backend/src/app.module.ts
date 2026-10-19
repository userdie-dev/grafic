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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'grafic.sqlite',
      entities: [User, Shift, Subscription],
      synchronize: true, // fine for SQLite dev; switch to migrations before production
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DevicesModule,
    EventsModule,
    ShiftsModule,
    SubscriptionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
