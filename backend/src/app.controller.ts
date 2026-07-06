import { Controller, Get, HttpCode, HttpStatus, Head } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Head()
  @HttpCode(HttpStatus.OK)
  healthCheckHead() {
    return;
  }
}
