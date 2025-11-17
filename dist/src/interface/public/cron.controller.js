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
var CronController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const public_decorator_1 = require("../common/decorators/public.decorator");
const evaluation_period_auto_phase_service_1 = require("../../domain/core/evaluation-period/evaluation-period-auto-phase.service");
const employee_sync_service_1 = require("../../context/organization-management-context/employee-sync.service");
const department_sync_service_1 = require("../../context/organization-management-context/department-sync.service");
let CronController = CronController_1 = class CronController {
    evaluationPeriodAutoPhaseService;
    employeeSyncService;
    departmentSyncService;
    configService;
    logger = new common_1.Logger(CronController_1.name);
    constructor(evaluationPeriodAutoPhaseService, employeeSyncService, departmentSyncService, configService) {
        this.evaluationPeriodAutoPhaseService = evaluationPeriodAutoPhaseService;
        this.employeeSyncService = employeeSyncService;
        this.departmentSyncService = departmentSyncService;
        this.configService = configService;
    }
    validateCronSecret(authHeader) {
        const cronSecret = this.configService.get('CRON_SECRET');
        if (!cronSecret) {
            this.logger.warn('CRON_SECRET이 설정되지 않았습니다. 보안을 위해 설정을 권장합니다.');
            return;
        }
        const expectedAuth = `Bearer ${cronSecret}`;
        if (authHeader !== expectedAuth) {
            this.logger.warn(`잘못된 크론 시크릿: ${authHeader}`);
            throw new common_1.UnauthorizedException('Invalid cron secret');
        }
    }
    async triggerEvaluationPeriodAutoPhase(authHeader) {
        this.validateCronSecret(authHeader);
        const isVercel = !!this.configService.get('VERCEL');
        if (!isVercel) {
            this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
            return { message: 'Vercel 환경이 아닙니다.' };
        }
        try {
            const count = await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();
            return {
                success: true,
                message: `평가기간 자동 단계 변경 완료: ${count}개 평가기간 전이됨`,
                transitionedCount: count,
            };
        }
        catch (error) {
            this.logger.error('평가기간 자동 단계 변경 실패:', error);
            throw error;
        }
    }
    async triggerEmployeeSync(authHeader) {
        this.validateCronSecret(authHeader);
        const isVercel = !!this.configService.get('VERCEL');
        if (!isVercel) {
            this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
            return { message: 'Vercel 환경이 아닙니다.' };
        }
        try {
            await this.employeeSyncService.scheduledSync();
            return {
                success: true,
                message: '직원 동기화 완료',
            };
        }
        catch (error) {
            this.logger.error('직원 동기화 실패:', error);
            throw error;
        }
    }
    async triggerDepartmentSync(authHeader) {
        this.validateCronSecret(authHeader);
        const isVercel = !!this.configService.get('VERCEL');
        if (!isVercel) {
            this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
            return { message: 'Vercel 환경이 아닙니다.' };
        }
        try {
            await this.departmentSyncService.scheduledSync();
            return {
                success: true,
                message: '부서 동기화 완료',
            };
        }
        catch (error) {
            this.logger.error('부서 동기화 실패:', error);
            throw error;
        }
    }
};
exports.CronController = CronController;
__decorate([
    (0, common_1.Get)('evaluation-period-auto-phase'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '평가기간 자동 단계 변경 크론 작업',
        description: '매 시간마다 실행되어 평가기간의 단계를 자동으로 전이합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '평가기간 자동 단계 변경 완료',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패 (잘못된 크론 시크릿)',
    }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CronController.prototype, "triggerEvaluationPeriodAutoPhase", null);
__decorate([
    (0, common_1.Get)('employee-sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '직원 동기화 크론 작업',
        description: '10분마다 실행되어 SSO 서비스와 직원 데이터를 동기화합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '직원 동기화 완료',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패 (잘못된 크론 시크릿)',
    }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CronController.prototype, "triggerEmployeeSync", null);
__decorate([
    (0, common_1.Get)('department-sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '부서 동기화 크론 작업',
        description: '10분마다 실행되어 SSO 서비스와 부서 데이터를 동기화합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '부서 동기화 완료',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패 (잘못된 크론 시크릿)',
    }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CronController.prototype, "triggerDepartmentSync", null);
exports.CronController = CronController = CronController_1 = __decorate([
    (0, swagger_1.ApiTags)('Public - 크론 작업'),
    (0, common_1.Controller)('cron'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService,
        employee_sync_service_1.EmployeeSyncService,
        department_sync_service_1.DepartmentSyncService,
        config_1.ConfigService])
], CronController);
//# sourceMappingURL=cron.controller.js.map