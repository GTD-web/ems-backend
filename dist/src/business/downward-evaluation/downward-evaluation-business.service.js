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
var DownwardEvaluationBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownwardEvaluationBusinessService = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const evaluation_period_management_service_1 = require("../../context/evaluation-period-management-context/evaluation-period-management.service");
let DownwardEvaluationBusinessService = DownwardEvaluationBusinessService_1 = class DownwardEvaluationBusinessService {
    performanceEvaluationService;
    evaluationCriteriaManagementService;
    evaluationPeriodManagementContextService;
    logger = new common_1.Logger(DownwardEvaluationBusinessService_1.name);
    constructor(performanceEvaluationService, evaluationCriteriaManagementService, evaluationPeriodManagementContextService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.evaluationPeriodManagementContextService = evaluationPeriodManagementContextService;
    }
    async 일차_하향평가를_저장한다(params) {
        this.logger.log('1차 하향평가 저장 비즈니스 로직 시작', {
            evaluatorId: params.evaluatorId,
            evaluateeId: params.evaluateeId,
            wbsId: params.wbsId,
        });
        await this.evaluationCriteriaManagementService.평가라인을_검증한다(params.evaluateeId, params.evaluatorId, params.wbsId, 'primary');
        if (params.downwardEvaluationScore !== undefined &&
            params.downwardEvaluationScore !== null) {
            await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(params.periodId, params.downwardEvaluationScore);
        }
        const evaluationId = await this.performanceEvaluationService.하향평가를_저장한다(params.evaluatorId, params.evaluateeId, params.periodId, params.wbsId, params.selfEvaluationId, 'primary', params.downwardEvaluationContent, params.downwardEvaluationScore, params.actionBy);
        this.logger.log('1차 하향평가 저장 완료', { evaluationId });
        return evaluationId;
    }
    async 이차_하향평가를_저장한다(params) {
        this.logger.log('2차 하향평가 저장 비즈니스 로직 시작', {
            evaluatorId: params.evaluatorId,
            evaluateeId: params.evaluateeId,
            wbsId: params.wbsId,
        });
        await this.evaluationCriteriaManagementService.평가라인을_검증한다(params.evaluateeId, params.evaluatorId, params.wbsId, 'secondary');
        if (params.downwardEvaluationScore !== undefined &&
            params.downwardEvaluationScore !== null) {
            await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(params.periodId, params.downwardEvaluationScore);
        }
        const evaluationId = await this.performanceEvaluationService.하향평가를_저장한다(params.evaluatorId, params.evaluateeId, params.periodId, params.wbsId, params.selfEvaluationId, 'secondary', params.downwardEvaluationContent, params.downwardEvaluationScore, params.actionBy);
        this.logger.log('2차 하향평가 저장 완료', { evaluationId });
        return evaluationId;
    }
};
exports.DownwardEvaluationBusinessService = DownwardEvaluationBusinessService;
exports.DownwardEvaluationBusinessService = DownwardEvaluationBusinessService = DownwardEvaluationBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_period_management_service_1.EvaluationPeriodManagementContextService])
], DownwardEvaluationBusinessService);
//# sourceMappingURL=downward-evaluation-business.service.js.map