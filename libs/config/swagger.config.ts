import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfigOptions {
  title: string;
  description: string;
  version: string;
  path: string;
}

/**
 * Swagger 문서를 설정한다
 * @param app NestJS 애플리케이션 인스턴스
 * @param options Swagger 설정 옵션
 */
export function setupSwagger(
  app: INestApplication,
  options: SwaggerConfigOptions,
): void {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'Bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(options.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: (a, b) => {
        const methodOrder = { get: 1, post: 2, patch: 3, put: 4, delete: 5 };
        const methodA = a.get('method').toLowerCase();
        const methodB = b.get('method').toLowerCase();

        if (methodA !== methodB) {
          return (methodOrder[methodA] || 999) - (methodOrder[methodB] || 999);
        }

        return 0;
      },
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      displayRequestDuration: true, // 요청 시간 표시
    },
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
      '/swagger-custom.js', // 커스텀 파라미터 초기화 기능
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
    ],
    customfavIcon: 'https://swagger.io/favicon.ico',
    customSiteTitle: options.title,
  });
}
