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
exports.PeerEvaluationManagementController = void 0;
const peer_evaluation_business_service_1 = require("../../../business/peer-evaluation/peer-evaluation-business.service");
const employee_sync_service_1 = require("../../../context/organization-management-context/employee-sync.service");
const evaluation_question_management_service_1 = require("../../../context/evaluation-question-management-context/evaluation-question-management.service");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const uuid_1 = require("uuid");
const peer_evaluation_api_decorators_1 = require("../../common/decorators/performance-evaluation/peer-evaluation-api.decorators");
const peer_evaluation_dto_1 = require("../../common/dto/performance-evaluation/peer-evaluation.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let PeerEvaluationManagementController = class PeerEvaluationManagementController {
    peerEvaluationBusinessService;
    employeeSyncService;
    evaluationQuestionManagementService;
    constructor(peerEvaluationBusinessService, employeeSyncService, evaluationQuestionManagementService) {
        this.peerEvaluationBusinessService = peerEvaluationBusinessService;
        this.employeeSyncService = employeeSyncService;
        this.evaluationQuestionManagementService = evaluationQuestionManagementService;
    }
    async requestPeerEvaluation(dto, user) {
        const requestedBy = user.id;
        const evaluationId = await this.peerEvaluationBusinessService.동료평가를_요청한다({
            evaluatorId: dto.evaluatorId,
            evaluateeId: dto.evaluateeId,
            periodId: dto.periodId,
            requestDeadline: dto.requestDeadline,
            questionIds: dto.questionIds,
            requestedBy,
        });
        return {
            id: evaluationId,
            message: '동료평가가 성공적으로 요청되었습니다.',
        };
    }
    async requestPeerEvaluationToMultipleEvaluators(dto, user) {
        const requestedBy = user.id;
        const result = await this.peerEvaluationBusinessService.여러_평가자에게_동료평가를_요청한다({
            evaluatorIds: dto.evaluatorIds,
            evaluateeId: dto.evaluateeId,
            periodId: dto.periodId,
            requestDeadline: dto.requestDeadline,
            questionIds: dto.questionIds,
            requestedBy,
        });
        return {
            results: result.results,
            summary: result.summary,
            message: result.summary.failed > 0
                ? `${result.summary.total}건 중 ${result.summary.success}건의 동료평가 요청이 생성되었습니다. (실패: ${result.summary.failed}건)`
                : `${result.summary.success}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
            ids: result.results.filter((r) => r.success).map((r) => r.evaluationId),
            count: result.summary.success,
        };
    }
    async requestMultiplePeerEvaluations(dto, user) {
        const requestedBy = user.id;
        const result = await this.peerEvaluationBusinessService.여러_피평가자에_대한_동료평가를_요청한다({
            evaluatorId: dto.evaluatorId,
            evaluateeIds: dto.evaluateeIds,
            periodId: dto.periodId,
            requestDeadline: dto.requestDeadline,
            questionIds: dto.questionIds,
            requestedBy,
        });
        return {
            results: result.results,
            summary: result.summary,
            message: result.summary.failed > 0
                ? `${result.summary.total}건 중 ${result.summary.success}건의 동료평가 요청이 생성되었습니다. (실패: ${result.summary.failed}건)`
                : `${result.summary.success}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
            ids: result.results.filter((r) => r.success).map((r) => r.evaluationId),
            count: result.summary.success,
        };
    }
    async requestPartLeaderPeerEvaluations(dto) {
        const requestedBy = dto.requestedBy || (0, uuid_1.v4)();
        let evaluatorIds;
        let evaluateeIds;
        if (dto.evaluatorIds && dto.evaluatorIds.length > 0) {
            evaluatorIds = dto.evaluatorIds;
        }
        else {
            const partLeaders = await this.employeeSyncService.getPartLeaders(false);
            evaluatorIds = partLeaders.map((emp) => emp.id);
        }
        if (dto.evaluateeIds && dto.evaluateeIds.length > 0) {
            evaluateeIds = dto.evaluateeIds;
        }
        else {
            const partLeaders = await this.employeeSyncService.getPartLeaders(false);
            evaluateeIds = partLeaders.map((emp) => emp.id);
        }
        if (evaluatorIds.length === 0 || evaluateeIds.length === 0) {
            return {
                results: [],
                summary: { total: 0, success: 0, failed: 0, partLeaderCount: 0 },
                message: '평가자 또는 피평가자가 없어 동료평가 요청을 생성하지 않았습니다.',
                ids: [],
                count: 0,
            };
        }
        let questionIds = dto.questionIds;
        if (!questionIds || questionIds.length === 0) {
            const questionGroups = await this.evaluationQuestionManagementService.질문그룹목록을_조회한다({
                nameSearch: '파트장 평가 질문',
            });
            const partLeaderGroup = questionGroups.find((group) => group.name === '파트장 평가 질문');
            if (partLeaderGroup) {
                const groupMappings = await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(partLeaderGroup.id);
                questionIds = groupMappings
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((mapping) => mapping.questionId);
            }
        }
        const allResults = [];
        let successCount = 0;
        let failedCount = 0;
        for (const evaluatorId of evaluatorIds) {
            const targetEvaluateeIds = evaluateeIds.filter((id) => id !== evaluatorId);
            if (targetEvaluateeIds.length > 0) {
                const result = await this.peerEvaluationBusinessService.여러_피평가자에_대한_동료평가를_요청한다({
                    evaluatorId,
                    evaluateeIds: targetEvaluateeIds,
                    periodId: dto.periodId,
                    requestDeadline: dto.requestDeadline,
                    questionIds,
                    requestedBy,
                });
                allResults.push(...result.results);
                successCount += result.summary.success;
                failedCount += result.summary.failed;
            }
        }
        const uniquePartLeaderIds = new Set([...evaluatorIds, ...evaluateeIds]);
        const partLeaderCount = uniquePartLeaderIds.size;
        return {
            results: allResults,
            summary: {
                total: allResults.length,
                success: successCount,
                failed: failedCount,
                partLeaderCount,
            },
            message: failedCount > 0
                ? `파트장 ${partLeaderCount}명에 대해 ${allResults.length}건 중 ${successCount}건의 동료평가 요청이 생성되었습니다. (실패: ${failedCount}건)`
                : `파트장 ${partLeaderCount}명에 대해 ${successCount}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
            ids: allResults.filter((r) => r.success).map((r) => r.evaluationId),
            count: successCount,
        };
    }
    async submitPeerEvaluation(id, user) {
        const submittedBy = user.id;
        await this.peerEvaluationBusinessService.동료평가를_제출한다({
            evaluationId: id,
            submittedBy,
        });
    }
    async getPeerEvaluations(filter) {
        return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
            evaluatorId: filter.evaluatorId,
            evaluateeId: filter.evaluateeId,
            periodId: filter.periodId,
            status: filter.status,
            page: filter.page || 1,
            limit: filter.limit || 10,
        });
    }
    async getEvaluatorPeerEvaluations(evaluatorId, filter) {
        return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
            evaluatorId,
            evaluateeId: filter.evaluateeId,
            periodId: filter.periodId,
            status: filter.status,
            page: filter.page || 1,
            limit: filter.limit || 10,
        });
    }
    async getEvaluateePeerEvaluations(evaluateeId, filter) {
        return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
            evaluatorId: filter.evaluatorId,
            evaluateeId,
            periodId: filter.periodId,
            status: filter.status,
            page: filter.page || 1,
            limit: filter.limit || 10,
        });
    }
    async getAllPeerEvaluations(filter) {
        return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
            evaluatorId: undefined,
            evaluateeId: filter.evaluateeId,
            periodId: filter.periodId,
            status: filter.status,
            page: filter.page || 1,
            limit: filter.limit || 10,
        });
    }
    async getPeerEvaluationDetail(id) {
        return await this.peerEvaluationBusinessService.동료평가_상세정보를_조회한다({
            evaluationId: id,
        });
    }
    async getEvaluatorAssignedEvaluatees(evaluatorId, query) {
        return await this.peerEvaluationBusinessService.평가자에게_할당된_피평가자_목록을_조회한다({
            evaluatorId,
            periodId: query.periodId,
            includeCompleted: query.includeCompleted,
        });
    }
    async cancelPeerEvaluation(id, user) {
        const cancelledBy = user.id;
        await this.peerEvaluationBusinessService.동료평가_요청을_취소한다({
            evaluationId: id,
            cancelledBy,
        });
    }
    async cancelPeerEvaluationsByPeriod(evaluateeId, periodId, user) {
        const cancelledBy = user.id;
        const result = await this.peerEvaluationBusinessService.피평가자의_동료평가_요청을_일괄_취소한다({
            evaluateeId,
            periodId,
            cancelledBy,
        });
        return {
            message: '동료평가 요청들이 성공적으로 취소되었습니다.',
            cancelledCount: result.cancelledCount,
        };
    }
    async upsertPeerEvaluationAnswers(dto, user) {
        const answeredBy = user.id;
        const result = await this.peerEvaluationBusinessService.동료평가_답변을_저장한다({
            peerEvaluationId: dto.peerEvaluationId,
            answers: dto.answers.map((a) => ({
                questionId: a.questionId,
                answer: a.answer,
                score: a.score,
            })),
            answeredBy,
        });
        return {
            savedCount: result.savedCount,
            message: '답변이 성공적으로 저장되었습니다.',
        };
    }
};
exports.PeerEvaluationManagementController = PeerEvaluationManagementController;
__decorate([
    (0, peer_evaluation_api_decorators_1.RequestPeerEvaluation)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestPeerEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestPeerEvaluation", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.RequestPeerEvaluationToMultipleEvaluators)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestPeerEvaluationToMultipleEvaluatorsDto, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestPeerEvaluationToMultipleEvaluators", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.RequestMultiplePeerEvaluations)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestMultiplePeerEvaluationsDto, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestMultiplePeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.RequestPartLeaderPeerEvaluations)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestPartLeaderPeerEvaluationsDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestPartLeaderPeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.SubmitPeerEvaluation)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "submitPeerEvaluation", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetPeerEvaluations)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.PeerEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getPeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetEvaluatorPeerEvaluations)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.PeerEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getEvaluatorPeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetEvaluateePeerEvaluations)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluateeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.PeerEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getEvaluateePeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetAllPeerEvaluations)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.PeerEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getAllPeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetPeerEvaluationDetail)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getPeerEvaluationDetail", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetEvaluatorAssignedEvaluatees)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.GetEvaluatorAssignedEvaluateesQueryDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getEvaluatorAssignedEvaluatees", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.CancelPeerEvaluation)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "cancelPeerEvaluation", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.CancelPeerEvaluationsByPeriod)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluateeId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "cancelPeerEvaluationsByPeriod", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.UpsertPeerEvaluationAnswers)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.UpsertPeerEvaluationAnswersDto, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "upsertPeerEvaluationAnswers", null);
exports.PeerEvaluationManagementController = PeerEvaluationManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-5. 관리자 - 성과평가 - 동료평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/performance-evaluation/peer-evaluations'),
    __metadata("design:paramtypes", [peer_evaluation_business_service_1.PeerEvaluationBusinessService,
        employee_sync_service_1.EmployeeSyncService,
        evaluation_question_management_service_1.EvaluationQuestionManagementService])
], PeerEvaluationManagementController);
//# sourceMappingURL=peer-evaluation-management.controller.js.map