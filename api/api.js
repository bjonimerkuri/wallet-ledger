"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = vercelHandler;
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
let handlerPromise = null;
async function buildHandler() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: false });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const origins = process.env.WEB_ORIGIN?.split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    app.enableCors({ origin: origins?.length ? origins : true });
    await app.init();
    return app.getHttpAdapter().getInstance();
}
async function vercelHandler(req, res) {
    if (!handlerPromise) {
        handlerPromise = buildHandler().catch((error) => {
            handlerPromise = null;
            throw error;
        });
    }
    try {
        const express = await handlerPromise;
        express(req, res);
    }
    catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(500).json({ statusCode: 500, message: 'Internal server error' });
        }
    }
}
