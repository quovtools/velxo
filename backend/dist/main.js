"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_1 = __importDefault(require("express"));
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const child_process_1 = require("child_process");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'warn', 'error', 'debug', 'verbose'],
        bodyParser: false,
    });
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    const rawOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = rawOrigin
        ? rawOrigin.split(',').map((o) => o.trim())
        : null;
    app.enableCors({
        origin: allowedOrigins
            ? (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin))
                    return callback(null, true);
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
            : true,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password'],
    });
    expressApp.use(express_1.default.json({
        limit: '25mb',
        verify: (req, _res, buf) => {
            if (buf && buf.length)
                req.rawBody = buf.toString('utf8');
        },
    }));
    expressApp.use(express_1.default.urlencoded({ limit: '25mb', extended: true }));
    app.use((0, helmet_1.default)());
    app.use((0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 100,
        message: { success: false, message: 'Too many requests. Please try again later.' },
        validate: { xForwardedForHeader: false },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => {
            const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
            return new common_1.BadRequestException({
                success: false,
                message: messages.join('; '),
                errors: messages,
            });
        },
    }));
    app.setGlobalPrefix('api/v1', {
        exclude: [
            { path: '/', method: common_2.RequestMethod.GET },
            { path: '/', method: common_2.RequestMethod.HEAD },
        ],
    });
    const healthPayload = JSON.stringify({
        status: 'ok',
        service: 'Velxo API',
        version: '1.0.0',
    });
    expressApp.get('/api/v1', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(healthPayload);
    });
    expressApp.head('/api/v1', (_req, res) => {
        res.status(200).end();
    });
    try {
        logger.log('Running schema migration (prisma db push)...');
        (0, child_process_1.execSync)('npx prisma db push --accept-data-loss --skip-generate', {
            stdio: 'inherit',
            env: process.env,
        });
        logger.log('Schema migration complete');
    }
    catch (schemaErr) {
        logger.error('Schema migration failed (app will still try to start):', schemaErr);
    }
    const port = process.env.PORT || 3001;
    const nodeEnv = process.env.NODE_ENV || 'development';
    const apiUrl = nodeEnv === 'production'
        ? process.env.API_URL || `https://velxo.onrender.com/api/v1`
        : `http://localhost:${port}/api/v1`;
    logger.log(`🚀 Velxo API running on ${apiUrl}`);
    logger.log(`📦 Environment: ${nodeEnv}`);
    logger.log(`🌐 CORS origins: ${allowedOrigins ? allowedOrigins.join(', ') : 'ALL (open)'}`);
    logger.log(`🗃️  Database URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING ⚠️'}`);
    logger.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'SET' : 'MISSING — using fallback ⚠️'}`);
    await app.listen(port);
}
bootstrap().catch((err) => {
    console.error('❌ Failed to start Velxo API:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map