import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

// no 0/O/1/I/L to keep codes readable when typed by hand
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class DevicesService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async register() {
    const token = randomBytes(32).toString('base64url');
    const user = await this.users.save(
      this.users.create({ tokenHash: hashToken(token), shareCode: await this.uniqueCode() }),
    );
    return { userId: user.id, token, shareCode: user.shareCode };
  }

  findByToken(token: string) {
    return this.users.findOne({ where: { tokenHash: hashToken(token) } });
  }

  async regenerateCode(user: User) {
    user.shareCode = await this.uniqueCode();
    await this.users.save(user);
    return { shareCode: user.shareCode };
  }

  private async uniqueCode(): Promise<string> {
    for (;;) {
      const bytes = randomBytes(CODE_LENGTH);
      const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
      if (!(await this.users.exists({ where: { shareCode: code } }))) return code;
    }
  }
}
