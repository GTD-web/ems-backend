"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
function setupSwagger(app, options) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle(options.title)
        .setDescription(options.description)
        .setVersion(options.version)
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
    }, 'Bearer')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, options.includeModules
        ? {
            include: options.includeModules,
        }
        : undefined);
    swagger_1.SwaggerModule.setup(options.path, app, document, {
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
            displayRequestDuration: true,
        },
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
            '/swagger-custom.js',
        ],
        customCssUrl: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
        ],
        customfavIcon: 'https://swagger.io/favicon.ico',
        customSiteTitle: options.title,
    });
}
//# sourceMappingURL=swagger.config.js.map