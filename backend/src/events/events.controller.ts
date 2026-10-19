import { Controller, Sse, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Observable, map } from 'rxjs';
import { CurrentUser, DeviceAuthGuard } from '../devices/device-auth.guard';
import { User } from '../entities/user.entity';
import { EventsService } from './events.service';

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @SkipThrottle()
  @UseGuards(DeviceAuthGuard)
  @Sse('events')
  stream(@CurrentUser() user: User): Observable<{ type: string; data: unknown }> {
    return this.events.stream(user.id).pipe(map((m) => ({ type: m.type, data: m.data })));
  }
}
