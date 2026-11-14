import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard, CurrentUser } from '../devices/device-auth.guard.js';
import { User } from '../entities/user.entity.js';
import { UpsertShiftsDto } from './shifts.dto.js';
import { ShiftsService } from './shifts.service.js';

@UseGuards(DeviceAuthGuard)
@Controller('me/shifts')
export class ShiftsController {
  constructor(private readonly shifts: ShiftsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query('from') from?: string, @Query('to') to?: string) {
    return this.shifts.list(user.id, from, to);
  }

  @Put()
  upsert(@CurrentUser() user: User, @Body() dto: UpsertShiftsDto) {
    return this.shifts.upsert(user.id, dto.shifts);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.shifts.remove(user.id, id);
  }
}
