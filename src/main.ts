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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
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
      operationsSorter: (a, b) => {
        // HTTP 메서드 우선순위 정의
        const methodOrder = { get: 1, post: 2, patch: 3, put: 4, delete: 5 };
        const methodA = a.get('method').toLowerCase();
        const methodB = b.get('method').toLowerCase();

        // 메서드가 다르면 메서드 순서로 정렬
        if (methodA !== methodB) {
          return (methodOrder[methodA] || 999) - (methodOrder[methodB] || 999);
        }

        // 같은 메서드면 경로 순서로 정렬 (원본 순서 유지)
        return 0;
      },
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
