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
var EvaluationPeriodBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodBusinessService = void 0;
const common_1 = require("@nestjs/common");
const evaluation_period_management_service_1 = require("../../context/evaluation-period-management-context/evaluation-period-management.service");
let EvaluationPeriodBusinessService = EvaluationPeriodBusinessService_1 = class EvaluationPeriodBusinessService {
    evaluationPeriodManagementService;
    logger = new common_1.Logger(EvaluationPeriodBusinessService_1.name);
    constructor(evaluationPeriodManagementService) {
        this.evaluationPeriodManagementService = evaluationPeriodManagementService;
    }
    async 평가기간을_생성한다(createData, createdBy) {
        const result = await this.evaluationPeriodManagementService
            .평가기간을_대상자와_함께_생성한다(createData, createdBy);
        return result;
    }
    async 평가대상자를_대량_등록한다(evaluationPeriodId, employeeIds, createdBy) {
        this.logger.log(`평가 대상자 대량 등록 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}명`);
        const results = [];
        for (const employeeId of employeeIds) {
            try {
                const result = await this.evaluationPeriodManagementService
                    .평가대상자를_자동평가자와_함께_등록한다(evaluationPeriodId, employeeId, createdBy);
                results.push(result);
            }
            catch (error) {
                this.logger.warn(`직원 등록 실패 - 직원: ${employeeId}`, error.message);
                results.push({
                    mapping: null,
                    primaryEvaluatorAssigned: false,
                    primaryEvaluatorId: null,
                    warning: `등록 실패: ${error.message}`,
                });
            }
        }
        const successCount = results.filter(r => r.primaryEvaluatorAssigned).length;
        const warningCount = results.filter(r => r.warning).length;
        this.logger.log(`평가 대상자 대량 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, ` +
            `총 직원: ${employeeIds.length}명, 성공: ${successCount}명, 경고: ${warningCount}개`);
        return results;
    }
    async 단계_변경한다(periodId, targetPhase, changedBy) {
        this.logger.log(`평가기간 단계 변경 비즈니스 로직 시작 - 평가기간: ${periodId}, 대상 단계: ${targetPhase}`);
        const result = await this.evaluationPeriodManagementService.단계_변경한다(periodId, targetPhase, changedBy);
        this.logger.log(`평가기간 단계 변경 완료 - 평가기간: ${periodId}, 변경된 단계: ${result.currentPhase}`);
        return result;
    }
    async 자동_단계_전이를_실행한다() {
        this.logger.log('자동 단계 전이 비즈니스 로직 시작');
        const result = await this.evaluationPeriodManagementService.자동_단계_전이를_실행한다();
        this.logger.log(`자동 단계 전이 완료 - 전이된 평가기간 수: ${result}`);
        return result;
    }
};
exports.EvaluationPeriodBusinessService = EvaluationPeriodBusinessService;
exports.EvaluationPeriodBusinessService = EvaluationPeriodBusinessService = EvaluationPeriodBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_period_management_service_1.EvaluationPeriodManagementContextService])
], EvaluationPeriodBusinessService);
//# sourceMappingURL=evaluation-period-business.service.js.map