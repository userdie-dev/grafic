import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { ShiftsService } from '../shifts/shifts.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private readonly subs: Repository<Subscription>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly shifts: ShiftsService,
  ) {}

  async subscribe(user: User, code: string) {
    const owner = await this.users.findOne({ where: { shareCode: code.trim().toUpperCase() } });
    if (!owner) throw new NotFoundException('Unknown code');
    if (owner.id === user.id) throw new BadRequestException('Cannot subscribe to yourself');

    const existing = await this.subs.findOne({ where: { subscriberId: user.id, ownerId: owner.id } });
    return existing ?? this.subs.save(this.subs.create({ subscriberId: user.id, ownerId: owner.id }));
  }

  list(user: User) {
    return this.subs.find({ where: { subscriberId: user.id } });
  }

  async unsubscribe(user: User, id: string) {
    const res = await this.subs.delete({ id, subscriberId: user.id });
    return { deleted: !!res.affected };
  }

  async friendShifts(user: User, ownerId: string, from?: string, to?: string) {
    const sub = await this.subs.findOne({ where: { subscriberId: user.id, ownerId } });
    if (!sub) throw new ForbiddenException();
    return this.shifts.list(ownerId, from, to);
  }
}
