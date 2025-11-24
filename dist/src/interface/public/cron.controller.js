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
var CronController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../common/decorators/public.decorator");
const evaluation_period_auto_phase_service_1 = require("../../domain/core/evaluation-period/evaluation-period-auto-phase.service");
const evaluation_period_service_1 = require("../../domain/core/evaluation-period/evaluation-period.service");
const evaluation_period_types_1 = require("../../domain/core/evaluation-period/evaluation-period.types");
const employee_sync_service_1 = require("../../context/organization-management-context/employee-sync.service");
const department_sync_service_1 = require("../../context/organization-management-context/department-sync.service");
let CronController = CronController_1 = class CronController {
    evaluationPeriodAutoPhaseService;
    evaluationPeriodService;
    employeeSyncService;
    departmentSyncService;
    logger = new common_1.Logger(CronController_1.name);
    constructor(evaluationPeriodAutoPhaseService, evaluationPeriodService, employeeSyncService, departmentSyncService) {
        this.evaluationPeriodAutoPhaseService = evaluationPeriodAutoPhaseService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.employeeSyncService = employeeSyncService;
        this.departmentSyncService = departmentSyncService;
    }
    async triggerEvaluationPeriodAutoPhase() {
        try {
            const now = new Date();
            const nowUTC = now.toISOString();
            this.logger.log(`[평가기간 자동 단계 변경] 현재 서버 시간 (UTC): ${nowUTC}`);
            const activePeriods = await this.evaluationPeriodService.전체_조회한다();
            const inProgressPeriods = activePeriods.filter((period) => period.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS);
            this.logger.log(`[평가기간 자동 단계 변경] 진행 중인 평가기간 수: ${inProgressPeriods.length}개`);
            for (const period of inProgressPeriods) {
                const periodInfo = {
                    id: period.id,
                    name: period.name,
                    startDate: period.startDate?.toISOString() || 'N/A',
                    currentPhase: period.currentPhase || 'N/A',
                    evaluationSetupDeadline: period.evaluationSetupDeadline?.toISOString() || 'N/A',
                    performanceDeadline: period.performanceDeadline?.toISOString() || 'N/A',
                    selfEvaluationDeadline: period.selfEvaluationDeadline?.toISOString() || 'N/A',
                    peerEvaluationDeadline: period.peerEvaluationDeadline?.toISOString() || 'N/A',
                };
                this.logger.log(`[평가기간 자동 단계 변경] 평가기간 정보 - ID: ${periodInfo.id}, 이름: ${periodInfo.name}, 시작일: ${periodInfo.startDate}, 현재 단계: ${periodInfo.currentPhase}, 평가설정 마감일: ${periodInfo.evaluationSetupDeadline}, 업무수행 마감일: ${periodInfo.performanceDeadline}, 자기평가 마감일: ${periodInfo.selfEvaluationDeadline}, 동료평가 마감일: ${periodInfo.peerEvaluationDeadline}`);
            }
            const count = await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();
            if (count > 0) {
                this.logger.log(`[평가기간 자동 단계 변경] ${count}개 평가기간의 단계가 전이되었습니다.`);
                const updatedPeriods = await this.evaluationPeriodService.전체_조회한다();
                const updatedInProgressPeriods = updatedPeriods.filter((period) => period.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS);
                for (const period of updatedInProgressPeriods) {
                    if (inProgressPeriods.find((p) => p.id === period.id)?.currentPhase !==
                        period.currentPhase) {
                        const beforePhase = inProgressPeriods.find((p) => p.id === period.id)?.currentPhase;
                        this.logger.log(`[평가기간 자동 단계 변경] 평가기간 ${period.id} (${period.name}) 단계 변경됨: ${beforePhase} → ${period.currentPhase}`);
                    }
                }
            }
            else {
                this.logger.log(`[평가기간 자동 단계 변경] 전이된 평가기간이 없습니다.`);
            }
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
    async triggerEmployeeSync() {
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
    async triggerDepartmentSync() {
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronController.prototype, "triggerDepartmentSync", null);
exports.CronController = CronController = CronController_1 = __decorate([
    (0, swagger_1.ApiTags)('Public - 크론 작업'),
    (0, common_1.Controller)('cron'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService,
        evaluation_period_service_1.EvaluationPeriodService,
        employee_sync_service_1.EmployeeSyncService,
        department_sync_service_1.DepartmentSyncService])
], CronController);
//# sourceMappingURL=cron.controller.js.map