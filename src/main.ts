import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

// 환경 변수 로드
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 서빙 설정 (public 폴더)
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Swagger 설정
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lumir Evaluation Management System API')
    .setDescription('루미르 평가 관리 시스템의 API 문서입니다.')
    .setVersion('1.0')
    .addTag('common', '공통 API')
    .addTag('project', '평가 관련 API')
    .addTag('hierarchy', '평가 계층구조 API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'Bearer', // 이 이름으로 컨트롤러에서 참조할 수 있습니다
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 인증 정보를 브라우저 세션에 저장
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
    ],
    customfavIcon: 'https://swagger.io/favicon.ico',
    customSiteTitle: 'Lumir Evaluation Management API',
  });

  // CORS 설정 (필요한 경우)
  app.enableCors();

  await app.listen(process.env.PORT || 3000);

  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT || 3000}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${process.env.PORT || 3000}/api-docs`,
  );
}
bootstrap();
