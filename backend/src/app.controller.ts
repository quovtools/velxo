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
      timestamp: new Date().toISOString(),
    }
  }

  @Head()
  @HttpCode(HttpStatus.OK)
  healthCheckHead(@Res() res: Response) {
    res.status(HttpStatus.OK).end()
  }
}
