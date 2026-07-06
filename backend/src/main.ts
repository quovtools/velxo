import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { RequestMethod } from '@nestjs/common'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })

  app.use(helmet())
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: { success: false, message: 'Too many requests. Please try again later.' },
    }),
  )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.HEAD },
    ],
  })

  const port = process.env.PORT || 3001
  const nodeEnv = process.env.NODE_ENV || 'development'
  const apiUrl = nodeEnv === 'production' 
    ? process.env.API_URL || `https://velxo.onrender.com/api/v1`
    : `http://localhost:${port}/api/v1`
  
  await app.listen(port)
  console.log(`🚀 Velxo API running on ${apiUrl}`)
}
bootstrap()
