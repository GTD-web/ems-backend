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
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const uuid_1 = require("uuid");
const peer_evaluation_business_service_1 = require("../../../business/peer-evaluation/peer-evaluation-business.service");
const decorators_1 = require("../../decorators");
const peer_evaluation_api_decorators_1 = require("./decorators/peer-evaluation-api.decorators");
const peer_evaluation_dto_1 = require("./dto/peer-evaluation.dto");
let PeerEvaluationManagementController = class PeerEvaluationManagementController {
    peerEvaluationBusinessService;
    constructor(peerEvaluationBusinessService) {
        this.peerEvaluationBusinessService = peerEvaluationBusinessService;
    }
    async requestPeerEvaluation(dto) {
        const requestedBy = dto.requestedBy || (0, uuid_1.v4)();
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
    async requestPeerEvaluationToMultipleEvaluators(dto) {
        const requestedBy = dto.requestedBy || (0, uuid_1.v4)();
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
    async requestMultiplePeerEvaluations(dto) {
        const requestedBy = dto.requestedBy || (0, uuid_1.v4)();
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
    async cancelPeerEvaluation(id) {
        const cancelledBy = (0, uuid_1.v4)();
        await this.peerEvaluationBusinessService.동료평가_요청을_취소한다({
            evaluationId: id,
            cancelledBy,
        });
    }
    async cancelPeerEvaluationsByPeriod(evaluateeId, periodId) {
        const cancelledBy = (0, uuid_1.v4)();
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
    async upsertPeerEvaluationAnswers(id, dto, user) {
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestPeerEvaluationDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestPeerEvaluation", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.RequestPeerEvaluationToMultipleEvaluators)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestPeerEvaluationToMultipleEvaluatorsDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestPeerEvaluationToMultipleEvaluators", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.RequestMultiplePeerEvaluations)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.RequestMultiplePeerEvaluationsDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "requestMultiplePeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.SubmitPeerEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
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
    __param(0, (0, decorators_1.ParseUUID)('evaluatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.PeerEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getEvaluatorPeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetEvaluateePeerEvaluations)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
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
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getPeerEvaluationDetail", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetEvaluatorAssignedEvaluatees)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.GetEvaluatorAssignedEvaluateesQueryDto]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "getEvaluatorAssignedEvaluatees", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.CancelPeerEvaluation)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "cancelPeerEvaluation", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.CancelPeerEvaluationsByPeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "cancelPeerEvaluationsByPeriod", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.UpsertPeerEvaluationAnswers)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.UpsertPeerEvaluationAnswersDto, Object]),
    __metadata("design:returntype", Promise)
], PeerEvaluationManagementController.prototype, "upsertPeerEvaluationAnswers", null);
exports.PeerEvaluationManagementController = PeerEvaluationManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-5. 관리자 - 성과평가 - 동료평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/performance-evaluation/peer-evaluations'),
    __metadata("design:paramtypes", [peer_evaluation_business_service_1.PeerEvaluationBusinessService])
], PeerEvaluationManagementController);
//# sourceMappingURL=peer-evaluation-management.controller.js.map