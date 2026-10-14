"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: ['log', 'warn', 'error'] });
    const origins = process.env.WEB_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({ origin: origins?.length ? origins : true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Wallet Ledger API')
        .setDescription('Peer-to-peer wallet with a double-entry ledger. Amounts are integers in minor units; transfers are atomic, idempotent and concurrency-safe.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    app.enableShutdownHooks();
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    logger.log(`API listening on port ${port}`);
}
bootstrap();
