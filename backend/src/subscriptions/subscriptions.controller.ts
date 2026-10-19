import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';
import { CurrentUser, DeviceAuthGuard } from '../devices/device-auth.guard';
import { User } from '../entities/user.entity';
import { SubscriptionsService } from './subscriptions.service';

class SubscribeDto {
  @IsString()
  @Length(4, 6)
  code: string;
}

@UseGuards(DeviceAuthGuard)
@Controller()
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  // short codes are guessable, so brute force is rate-limited
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('subscriptions')
  subscribe(@CurrentUser() user: User, @Body() dto: SubscribeDto) {
    return this.subs.subscribe(user, dto.code);
  }

  @Get('subscriptions')
  list(@CurrentUser() user: User) {
    return this.subs.list(user);
  }

  @Delete('subscriptions/:id')
  unsubscribe(@CurrentUser() user: User, @Param('id') id: string) {
    return this.subs.unsubscribe(user, id);
  }

  @Get('friends/:ownerId/shifts')
  friendShifts(
    @CurrentUser() user: User,
    @Param('ownerId') ownerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.subs.friendShifts(user, ownerId, from, to);
  }
}
