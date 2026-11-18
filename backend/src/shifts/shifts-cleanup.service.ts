import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from '../entities/shift.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class ShiftsCleanupService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ShiftsCleanupService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(@InjectRepository(Shift) private readonly shifts: Repository<Shift>) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => void this.cleanup(), 24 * 60 * 60 * 1000);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  async cleanup() {
    if (this.running) return;
    this.running = true;
    try {
      const users = this.shifts.manager.createQueryBuilder(User, 'owner')
        .select('owner.id').getQuery();
      const result = await this.shifts.createQueryBuilder().delete()
        .where(`"userId" IS NULL OR "userId" NOT IN (${users})`).execute();
      this.logger.log(`Deleted ${result.affected ?? 0} shifts without a user`);
    } catch (error) {
      this.logger.error('Failed to delete shifts without a user', error);
    } finally {
      this.running = false;
    }
  }
}
