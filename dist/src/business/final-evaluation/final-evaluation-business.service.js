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
var FinalEvaluationBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalEvaluationBusinessService = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const final_evaluation_1 = require("../../context/performance-evaluation-context/handlers/final-evaluation");
let FinalEvaluationBusinessService = FinalEvaluationBusinessService_1 = class FinalEvaluationBusinessService {
    performanceEvaluationService;
    activityLogContextService;
    logger = new common_1.Logger(FinalEvaluationBusinessService_1.name);
    constructor(performanceEvaluationService, activityLogContextService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.activityLogContextService = activityLogContextService;
    }
    async 최종평가를_저장한다(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, actionBy) {
        this.logger.log('최종평가 저장 시작', {
            employeeId,
            periodId,
            evaluationGrade,
        });
        const existingEvaluation = await this.performanceEvaluationService.직원_평가기간별_최종평가를_조회한다(new final_evaluation_1.GetFinalEvaluationByEmployeePeriodQuery(employeeId, periodId));
        const isNewEvaluation = !existingEvaluation;
        const evaluationId = await this.performanceEvaluationService.최종평가를_저장한다(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, actionBy);
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId,
                employeeId,
                activityType: 'final_evaluation',
                activityAction: isNewEvaluation ? 'created' : 'updated',
                activityTitle: isNewEvaluation ? '최종평가 생성' : '최종평가 수정',
                relatedEntityType: 'final_evaluation',
                relatedEntityId: evaluationId,
                performedBy: actionBy,
                activityMetadata: {
                    evaluationGrade,
                    jobGrade,
                    jobDetailedGrade,
                },
            });
        }
        catch (error) {
            this.logger.warn('최종평가 저장 활동 내역 기록 실패', {
                evaluationId,
                employeeId,
                periodId,
                error: error.message,
            });
        }
        this.logger.log('최종평가 저장 완료', {
            evaluationId,
            isNewEvaluation,
        });
        return evaluationId;
    }
};
exports.FinalEvaluationBusinessService = FinalEvaluationBusinessService;
exports.FinalEvaluationBusinessService = FinalEvaluationBusinessService = FinalEvaluationBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], FinalEvaluationBusinessService);
//# sourceMappingURL=final-evaluation-business.service.js.map