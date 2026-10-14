import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from './src/app.module';

let handlerPromise: Promise<(req: Request, res: Response) => void> | null = null;

async function buildHandler() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const origins = process.env.WEB_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins?.length ? origins : true });
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function vercelHandler(req: Request, res: Response) {
  if (!handlerPromise) {
    handlerPromise = buildHandler().catch((error) => {
      handlerPromise = null;
      throw error;
    });
  }
  try {
    const express = await handlerPromise;
    express(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
  }
}
