import { Controller, Get, Header } from '@nestjs/common';
import { homePage } from './home-page.js';

@Controller()
export class AppController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  home(): string {
    return homePage;
  }
}
