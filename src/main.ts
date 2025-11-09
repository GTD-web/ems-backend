import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { setupSwagger } from '../libs/config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ConfigService 가져오기
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 정적 파일 서빙 설정 (public 폴더)
  app.useStaticAssets(join(process.cwd(), 'public'));

  // CORS 설정
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 환경변수에서 포트 가져오기
  const port = configService.get<number>('PORT', 4000);

  // 관리자용 Swagger 설정
  setupSwagger(app, {
    title: 'Lumir Admin API',
    description: '루미르 평가 관리 시스템 - 관리자용 API 문서입니다.',
    version: '1.0',
    path: 'admin/api-docs',
  });

  // 사용자용 Swagger 설정
  setupSwagger(app, {
    title: 'Lumir User API',
    description: '루미르 평가 관리 시스템 - 일반 사용자용 API 문서입니다.',
    version: '1.0',
    path: 'user/api-docs',
  });

  // 평가자용 Swagger 설정
  setupSwagger(app, {
    title: 'Lumir Evaluator API',
    description: '루미르 평가 관리 시스템 - 평가자용 API 문서입니다.',
    version: '1.0',
    path: 'evaluator/api-docs',
  });

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Admin API documentation: http://localhost:${port}/admin/api-docs`,
  );
  console.log(
    `📚 User API documentation: http://localhost:${port}/user/api-docs`,
  );
  console.log(
    `📚 Evaluator API documentation: http://localhost:${port}/evaluator/api-docs`,
  );
}

bootstrap();
