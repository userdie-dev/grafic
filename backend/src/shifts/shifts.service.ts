import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isValid, parseISO } from 'date-fns';
import { keyBy, uniq } from 'lodash';
import { Between, Repository } from 'typeorm';
import { EventsService } from '../events/events.service';
import { Shift } from '../entities/shift.entity';
import { Subscription } from '../entities/subscription.entity';
import { ShiftDto } from './shifts.dto';

const key = (s: { date: string; start: string }) => `${s.date}|${s.start}`;

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift) private readonly shifts: Repository<Shift>,
    @InjectRepository(Subscription) private readonly subs: Repository<Subscription>,
    private readonly events: EventsService,
  ) {}

  list(userId: string, from?: string, to?: string) {
    this.assertDate(from);
    this.assertDate(to);
    return this.shifts.find({
      where: { userId, ...(from && to ? { date: Between(from, to) } : {}) },
      order: { date: 'ASC', start: 'ASC' },
    });
  }

  async upsert(userId: string, items: ShiftDto[]) {
    items.forEach((i) => this.assertDate(i.date));
    const dates = uniq(items.map((i) => i.date));
    const existing = keyBy(await this.shifts.find({ where: dates.map((date) => ({ userId, date })) }), key);

    const saved = await this.shifts.save(
      items.map((i) =>
        this.shifts.create({ ...existing[key(i)], userId, date: i.date, start: i.start, end: i.end, note: i.note ?? null }),
      ),
    );
    await this.notify(userId, dates);
    return saved;
  }

  async remove(userId: string, id: string) {
    const shift = await this.shifts.findOne({ where: { id, userId } });
    if (!shift) return { deleted: false };
    await this.shifts.remove(shift);
    await this.notify(userId, [shift.date]);
    return { deleted: true };
  }

  private async notify(ownerId: string, dates: string[]) {
    const subscribers = await this.subs.find({ where: { ownerId } });
    for (const { subscriberId } of subscribers) {
      this.events.emit(subscriberId, { type: 'schedule.changed', ownerId, dates });
    }
  }

  private assertDate(value?: string) {
    if (value !== undefined && !isValid(parseISO(value))) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }
  }
}
