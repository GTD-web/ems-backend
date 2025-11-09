"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const swagger_config_1 = require("../libs/config/swagger.config");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'));
    (0, swagger_config_1.setupSwagger)(app, {
        title: 'Lumir Admin API',
        description: '루미르 평가 관리 시스템 - 관리자용 API 문서입니다.',
        version: '1.0',
        path: 'admin/api-docs',
    });
    (0, swagger_config_1.setupSwagger)(app, {
        title: 'Lumir User API',
        description: '루미르 평가 관리 시스템 - 일반 사용자용 API 문서입니다.',
        version: '1.0',
        path: 'user/api-docs',
    });
    (0, swagger_config_1.setupSwagger)(app, {
        title: 'Lumir Evaluator API',
        description: '루미르 평가 관리 시스템 - 평가자용 API 문서입니다.',
        version: '1.0',
        path: 'evaluator/api-docs',
    });
    app.enableCors();
    const port = configService.get('PORT', 4000);
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 Admin API documentation: http://localhost:${port}/admin/api-docs`);
    console.log(`📚 User API documentation: http://localhost:${port}/user/api-docs`);
    console.log(`📚 Evaluator API documentation: http://localhost:${port}/evaluator/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map