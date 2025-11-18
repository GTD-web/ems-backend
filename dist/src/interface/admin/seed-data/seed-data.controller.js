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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDataController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seed_data_service_1 = require("../../../context/seed-data-context/seed-data.service");
const seed_data_1 = require("../../common/dto/seed-data");
const clear_seed_data_decorator_1 = require("../../common/decorators/seed-data/clear-seed-data.decorator");
const generate_seed_data_decorator_1 = require("../../common/decorators/seed-data/generate-seed-data.decorator");
const generate_seed_data_with_real_data_decorator_1 = require("../../common/decorators/seed-data/generate-seed-data-with-real-data.decorator");
const get_seed_data_status_decorator_1 = require("../../common/decorators/seed-data/get-seed-data-status.decorator");
let SeedDataController = class SeedDataController {
    seedDataService;
    constructor(seedDataService) {
        this.seedDataService = seedDataService;
    }
    async generateSeedData(config, req) {
        const startTime = Date.now();
        const configWithUser = {
            ...config,
            currentUserId: config.includeCurrentUserAsEvaluator
                ? req.user?.id
                : undefined,
        };
        const results = await this.seedDataService.시드_데이터를_생성한다(configWithUser);
        const totalDuration = Date.now() - startTime;
        return {
            success: true,
            message: '시드 데이터가 성공적으로 생성되었습니다.',
            results,
            totalDuration,
        };
    }
    async generateSeedDataWithRealData(config, req) {
        const startTime = Date.now();
        const seedConfig = {
            scenario: config.scenario,
            clearExisting: config.clearExisting ?? false,
            dataScale: {
                departmentCount: 0,
                employeeCount: 0,
                projectCount: config.projectCount ?? 5,
                wbsPerProject: config.wbsPerProject ?? 10,
            },
            evaluationConfig: {
                periodCount: config.evaluationConfig?.periodCount ?? 1,
            },
            stateDistribution: config.stateDistribution,
            useRealDepartments: true,
            useRealEmployees: true,
            currentUserId: config.includeCurrentUserAsEvaluator
                ? req.user?.id
                : undefined,
        };
        if (config.stateDistribution) {
            console.log('[Controller] stateDistribution.selfEvaluationProgress:', JSON.stringify(config.stateDistribution.selfEvaluationProgress));
        }
        if (config.includeCurrentUserAsEvaluator) {
            console.log('[Controller] 현재 사용자를 평가자로 등록:', req.user?.id);
        }
        const results = await this.seedDataService.시드_데이터를_생성한다(seedConfig);
        const totalDuration = Date.now() - startTime;
        return {
            success: true,
            message: '실제 데이터 기반 시드 데이터가 성공적으로 생성되었습니다.',
            results,
            totalDuration,
        };
    }
    async clearSeedData() {
        await this.seedDataService.시드_데이터를_삭제한다(true);
        return {
            message: '시드 데이터가 성공적으로 삭제되었습니다.',
        };
    }
    async getSeedDataStatus() {
        const status = await this.seedDataService.시드_데이터_상태를_조회한다();
        return status;
    }
};
exports.SeedDataController = SeedDataController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, generate_seed_data_decorator_1.ApiGenerateSeedData)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [seed_data_1.SeedDataConfigDto, Object]),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "generateSeedData", null);
__decorate([
    (0, common_1.Post)('generate-with-real-data'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, generate_seed_data_with_real_data_decorator_1.ApiGenerateSeedDataWithRealData)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [seed_data_1.RealDataSeedConfigDto, Object]),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "generateSeedDataWithRealData", null);
__decorate([
    (0, common_1.Delete)('clear'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, clear_seed_data_decorator_1.ApiClearSeedData)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "clearSeedData", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, get_seed_data_status_decorator_1.ApiGetSeedDataStatus)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "getSeedDataStatus", null);
exports.SeedDataController = SeedDataController = __decorate([
    (0, swagger_1.ApiTags)('A-0-1. Seed Data'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/seed'),
    __metadata("design:paramtypes", [seed_data_service_1.SeedDataService])
], SeedDataController);
//# sourceMappingURL=seed-data.controller.js.map