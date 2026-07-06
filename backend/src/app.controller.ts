import { Controller, Get, Head, HttpCode, HttpStatus, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller()
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return {
      status: 'ok',
      service: 'Velxo API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  }

  @Head()
  @HttpCode(HttpStatus.OK)
  healthCheckHead(@Res() res: Response) {
    res.status(HttpStatus.OK).end()
  }
}
