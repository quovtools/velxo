import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe, Logger } from '@nestjs/common'
import { RequestMethod } from '@nestjs/common'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    // Ensure all log levels are visible in Render logs
    logger: ['log', 'warn', 'error', 'debug', 'verbose'],
  })

  // Trust Render's proxy so rate limiter and IP detection work correctly
  const expressApp = app.getHttpAdapter().getInstance()
  expressApp.set('trust proxy', 1)

  // Register global exception filter — catches ALL errors and logs them to Render
  app.useGlobalFilters(new AllExceptionsFilter())

  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.use(helmet())
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: { success: false, message: 'Too many requests. Please try again later.' },
      validate: { xForwardedForHeader: false },
    }),
  )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Return detailed validation errors in the response
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((e) =>
          Object.values(e.constraints || {})
        )
        const { BadRequestException } = require('@nestjs/common')
        return new BadRequestException({
          success: false,
          message: messages.join('; '),
          errors: messages,
        })
      },
    }),
  )

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.HEAD },
    ],
  })

  // Handle health checks at /api/v1 (Render pings this path)
  const healthPayload = JSON.stringify({
    status: 'ok',
    service: 'Velxo API',
    version: '1.0.0',
  })
  expressApp.get('/api/v1', (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(healthPayload)
  })
  expressApp.head('/api/v1', (_req, res) => {
    res.status(200).end()
  })

  const port = process.env.PORT || 3001
  const nodeEnv = process.env.NODE_ENV || 'development'
  const apiUrl =
    nodeEnv === 'production'
      ? process.env.API_URL || `https://velxo.onrender.com/api/v1`
      : `http://localhost:${port}/api/v1`

  // Log key config at startup so it's visible in Render logs
  logger.log(`🚀 Velxo API running on ${apiUrl}`)
  logger.log(`📦 Environment: ${nodeEnv}`)
  logger.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'ALL (open)'}`)
  logger.log(`🗄️  Supabase URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING ⚠️'}`)
  logger.log(`🔑 Supabase service key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING ⚠️'}`)
  logger.log(`🗃️  Database URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING ⚠️'}`)

  await app.listen(port)
}

// Catch bootstrap-level errors (e.g. DB connection failures) and print them clearly
bootstrap().catch((err) => {
  console.error('❌ Failed to start Velxo API:', err)
  process.exit(1)
})
