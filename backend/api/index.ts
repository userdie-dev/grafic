import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from '../src/app.module';

// Явный импорт pg чтобы Vercel включил его в бандл
import * as pg from 'pg';

const server = express();
let app: any;

async function bootstrap() {
  if (!app) {
    console.log('Initializing NestJS app...');
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn', 'log'] }
    );
    
    console.log('NestJS app created, enabling CORS...');
    nestApp.enableCors();
    nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    console.log('Initializing NestJS app...');
    await nestApp.init();
    
    console.log('NestJS app initialized successfully');
    app = expressApp;
  }
  return app;
}

export default async (req: any, res: any) => {
  try {
    const server = await bootstrap();
    server(req, res);
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({
      error: 'Server initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  }
};
