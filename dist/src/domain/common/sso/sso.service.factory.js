"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SSOServiceFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOServiceFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sso_service_impl_1 = require("./sso.service.impl");
const sso_service_mock_1 = require("./sso.service.mock");
let SSOServiceFactory = SSOServiceFactory_1 = class SSOServiceFactory {
    config;
    systemName;
    configService;
    logger = new common_1.Logger(SSOServiceFactory_1.name);
    serviceInstance = null;
    constructor(config, systemName, configService) {
        this.config = config;
        this.systemName = systemName;
        this.configService = configService;
    }
    create() {
        if (this.serviceInstance) {
            return this.serviceInstance;
        }
        const useMockService = this.configService.get('SSO_USE_MOCK') === 'true' ||
            this.configService.get('NODE_ENV') === 'test';
        if (useMockService) {
            this.logger.log('Mock SSO 서비스를 사용합니다 (JSON 파일에서 데이터 로드)');
            this.serviceInstance = new sso_service_mock_1.MockSSOService();
        }
        else {
            this.logger.log('실제 SSO 서비스를 사용합니다 (외부 API 연동)');
            const enableJsonStorage = this.configService.get('SSO_ENABLE_JSON_STORAGE') === 'true';
            this.serviceInstance = new sso_service_impl_1.SSOServiceImpl(this.config, this.systemName, enableJsonStorage);
        }
        return this.serviceInstance;
    }
    async initialize() {
        const service = this.create();
        await service.초기화한다();
    }
};
exports.SSOServiceFactory = SSOServiceFactory;
exports.SSOServiceFactory = SSOServiceFactory = SSOServiceFactory_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SSO_CONFIG')),
    __param(1, (0, common_1.Inject)('SSO_SYSTEM_NAME')),
    __metadata("design:paramtypes", [Object, String, config_1.ConfigService])
], SSOServiceFactory);
//# sourceMappingURL=sso.service.factory.js.map