import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { setupSwagger } from '../libs/config/swagger.config';
import { ValidationPipe } from '@nestjs/common';

// 환경 변수 로드
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // 정적 파일 서빙 설정 (public 폴더)
  app.useStaticAssets(join(process.cwd(), 'public'));

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

  // CORS 설정 (필요한 경우)
  app.enableCors();

  await app.listen(process.env.PORT || 4000);

  const port = process.env.PORT || 4000;
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
