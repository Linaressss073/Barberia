import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AppConfig } from '@config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const cfg = app.get(ConfigService).getOrThrow<AppConfig>('app');
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(cfg.globalPrefix);
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: cfg.frontendUrls,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.enableShutdownHooks();

  if (cfg.nodeEnv !== 'production') {
    const swaggerCfg = new DocumentBuilder()
      .setTitle(`${cfg.name} API`)
      .setDescription('Sistema de Agendamiento para Barberia')
      .setVersion(cfg.version)
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup(`${cfg.globalPrefix}/docs`, app, doc);
    logger.log(`Swagger UI -> /${cfg.globalPrefix}/docs`);
  }

  await app.listen(cfg.port, '0.0.0.0');
  logger.log(`🚀 ${cfg.name} v${cfg.version} listening on :${cfg.port} [${cfg.nodeEnv}]`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
