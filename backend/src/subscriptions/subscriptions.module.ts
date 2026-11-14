import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from '../devices/devices.module.js';
import { Subscription } from '../entities/subscription.entity.js';
import { User } from '../entities/user.entity.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User]), DevicesModule, ShiftsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
