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
var EvaluationTargetBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationTargetBusinessService = void 0;
const common_1 = require("@nestjs/common");
const evaluation_period_management_service_1 = require("../../context/evaluation-period-management-context/evaluation-period-management.service");
const evaluation_line_mapping_service_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
let EvaluationTargetBusinessService = EvaluationTargetBusinessService_1 = class EvaluationTargetBusinessService {
    evaluationPeriodManagementService;
    evaluationLineMappingService;
    logger = new common_1.Logger(EvaluationTargetBusinessService_1.name);
    constructor(evaluationPeriodManagementService, evaluationLineMappingService) {
        this.evaluationPeriodManagementService = evaluationPeriodManagementService;
        this.evaluationLineMappingService = evaluationLineMappingService;
    }
    async 평가대상자를_등록한다(evaluationPeriodId, employeeId, createdBy) {
        this.logger.log(`평가 대상자 등록 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        const result = await this.evaluationPeriodManagementService.평가대상자를_자동평가자와_함께_등록한다(evaluationPeriodId, employeeId, createdBy);
        this.logger.log(`평가 대상자 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, ` +
            `1차 평가자 할당: ${result.primaryEvaluatorAssigned ? '성공' : '실패'}`);
        return result;
    }
    async 평가대상자를_대량_등록한다(evaluationPeriodId, employeeIds, createdBy) {
        this.logger.log(`평가 대상자 대량 등록 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}명`);
        const results = [];
        for (const employeeId of employeeIds) {
            try {
                const result = await this.evaluationPeriodManagementService.평가대상자를_자동평가자와_함께_등록한다(evaluationPeriodId, employeeId, createdBy);
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
        const successCount = results.filter((r) => r.primaryEvaluatorAssigned).length;
        const warningCount = results.filter((r) => r.warning).length;
        this.logger.log(`평가 대상자 대량 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, ` +
            `총 직원: ${employeeIds.length}명, 성공: ${successCount}명, 경고: ${warningCount}개`);
        return results;
    }
    async 평가대상자_등록_해제한다(evaluationPeriodId, employeeId, deletedBy) {
        this.logger.log(`평가 대상자 등록 해제 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const result = await this.evaluationPeriodManagementService.평가대상자_등록_해제한다(evaluationPeriodId, employeeId);
            if (!result) {
                this.logger.warn(`평가 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
                return false;
            }
            try {
                const mappings = await this.evaluationLineMappingService.필터_조회한다({
                    evaluationPeriodId,
                    employeeId,
                });
                let deletedMappingCount = 0;
                for (const mapping of mappings) {
                    const mappingId = mapping.DTO로_변환한다().id;
                    await this.evaluationLineMappingService.삭제한다(mappingId, deletedBy);
                    deletedMappingCount++;
                }
                this.logger.log(`평가라인 매핑 삭제 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, ` +
                    `삭제된 매핑 수: ${deletedMappingCount}`);
            }
            catch (error) {
                this.logger.warn(`평가라인 매핑 삭제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.message);
            }
            this.logger.log(`평가 대상자 등록 해제 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`평가 대상자 등록 해제 비즈니스 로직 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.EvaluationTargetBusinessService = EvaluationTargetBusinessService;
exports.EvaluationTargetBusinessService = EvaluationTargetBusinessService = EvaluationTargetBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService])
], EvaluationTargetBusinessService);
//# sourceMappingURL=evaluation-target-business.service.js.map