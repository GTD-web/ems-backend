"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sso_service_1 = require("./sso.service");
let SSOModule = class SSOModule {
};
exports.SSOModule = SSOModule;
exports.SSOModule = SSOModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'SSO_CONFIG',
                useFactory: (configService) => {
                    const config = {
                        baseUrl: configService.get('SSO_BASE_URL') ||
                            'https://lsso.vercel.app',
                        clientId: configService.get('SSO_CLIENT_ID') || '',
                        clientSecret: configService.get('SSO_CLIENT_SECRET') || '',
                        timeoutMs: configService.get('SSO_TIMEOUT_MS') || 10000,
                        retries: configService.get('SSO_RETRIES') || 3,
                        retryDelay: configService.get('SSO_RETRY_DELAY') || 200,
                        enableLogging: configService.get('SSO_ENABLE_LOGGING') === 'true',
                    };
                    if (!config.clientId || !config.clientSecret) {
                        throw new Error('SSO_CLIENT_ID와 SSO_CLIENT_SECRET 환경 변수가 필요합니다.');
                    }
                    return config;
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: 'SSO_SYSTEM_NAME',
                useFactory: (configService) => {
                    return configService.get('SSO_SYSTEM_NAME') || 'EMS-PROD';
                },
                inject: [config_1.ConfigService],
            },
            sso_service_1.SSOService,
        ],
        exports: ['SSO_CONFIG', 'SSO_SYSTEM_NAME', sso_service_1.SSOService],
    })
], SSOModule);
//# sourceMappingURL=sso.module.js.map