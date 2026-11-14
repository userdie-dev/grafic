import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';

@Injectable()
export class DatabaseService {
  private readonly sql: ReturnType<typeof neon> | null;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    // Keep the service injectable when the app runs on SQLite (local dev/tests).
    this.sql = databaseUrl ? neon(databaseUrl) : null;
  }

  async getData() {
    if (!this.sql) {
      throw new Error('DATABASE_URL is not configured');
    }
    const data = await this.sql`SELECT current_database() AS database, now() AS now`;
    return data;
  }
}
