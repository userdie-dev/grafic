import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from '../devices/devices.module.js';
import { Shift } from '../entities/shift.entity.js';
import { Subscription } from '../entities/subscription.entity.js';
import { EventsModule } from '../events/events.module.js';
import { ShiftsController } from './shifts.controller.js';
import { ShiftsService } from './shifts.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Subscription]), DevicesModule, EventsModule],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
