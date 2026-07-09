import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common'
import { RequestMethod } from '@nestjs/common'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import express from 'express'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { execSync } from 'child_process'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    // Ensure all log levels are visible in Render logs
    logger: ['log', 'warn', 'error', 'debug', 'verbose'],
    // Disable the default body parser so we can raise the size limit below
    // (base64 image uploads from the admin panel exceed the 100kb default)
    bodyParser: false,
  })

  // Trust Render's proxy so rate limiter and IP detection work correctly
  const expressApp = app.getHttpAdapter().getInstance()
  expressApp.set('trust proxy', 1)

  // Register global exception filter — catches ALL errors and logs them to Render
  app.useGlobalFilters(new AllExceptionsFilter())

  // Support multiple allowed origins via comma-separated CORS_ORIGIN env var
  // e.g. CORS_ORIGIN=https://market.velxo.shop,https://velxo-azure.vercel.app
  const rawOrigin = process.env.CORS_ORIGIN
  const allowedOrigins = rawOrigin
    ? rawOrigin.split(',').map((o) => o.trim())
    : null

  app.enableCors({
    origin: allowedOrigins
      ? (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, Render health checks)
          if (!origin) return callback(null, true)
          if (allowedOrigins.includes(origin)) return callback(null, true)
          callback(new Error(`CORS: origin ${origin} not allowed`))
        }
      : true, // Allow all origins if CORS_ORIGIN is not set
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password'],
  })

  // Allow larger request bodies (base64 image uploads via the admin panel).
  // Default Nest/Express JSON limit is 100kb, which rejects base64 images.
  // `verify` captures the raw body so payment webhooks can verify their HMAC signature.
  expressApp.use(express.json({
    limit: '25mb',
    verify: (req: any, _res, buf) => {
      if (buf && buf.length) req.rawBody = buf.toString('utf8')
    },
  }))
  expressApp.use(express.urlencoded({ limit: '25mb', extended: true }))

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

  // Self-healing schema migration: apply the full Prisma schema to the
  // production database at startup, using the app's own runtime DATABASE_URL.
  // This guarantees every table/column added in newer code exists, regardless
  // of whether the build-time push reached the runtime database.
  try {
    logger.log('Running schema migration (prisma db push)...')
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      env: process.env,
    })
    logger.log('Schema migration complete')
  } catch (schemaErr) {
    logger.error('Schema migration failed (app will still try to start):', schemaErr)
  }

  const port = process.env.PORT || 3001
  const nodeEnv = process.env.NODE_ENV || 'development'
  const apiUrl =
    nodeEnv === 'production'
      ? process.env.API_URL || `https://velxo.onrender.com/api/v1`
      : `http://localhost:${port}/api/v1`

  // Log key config at startup so it's visible in Render logs
  logger.log(`🚀 Velxo API running on ${apiUrl}`)
  logger.log(`📦 Environment: ${nodeEnv}`)
  logger.log(`🌐 CORS origins: ${allowedOrigins ? allowedOrigins.join(', ') : 'ALL (open)'}`)
  logger.log(`🗃️  Database URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING ⚠️'}`)
  logger.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'SET' : 'MISSING — using fallback ⚠️'}`)

  await app.listen(port, '0.0.0.0')
}

// Catch bootstrap-level errors (e.g. DB connection failures) and print them clearly
bootstrap().catch((err) => {
  console.error('❌ Failed to start Velxo API:', err)
  process.exit(1)
})
