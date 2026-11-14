import { Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { User } from '../entities/user.entity.js';
import { CurrentUser, DeviceAuthGuard } from './device-auth.guard.js';
import { DevicesService } from './devices.service.js';

@Controller()
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('devices')
  register() {
    return this.devices.register();
  }

  @UseGuards(DeviceAuthGuard)
  @Post('me/share-code/regenerate')
  regenerate(@CurrentUser() user: User) {
    return this.devices.regenerateCode(user);
  }
}
