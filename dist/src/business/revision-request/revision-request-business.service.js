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
var RevisionRequestBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionRequestBusinessService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const revision_request_context_service_1 = require("../../context/revision-request-context/revision-request-context.service");
const handlers_1 = require("../../context/evaluation-activity-log-context/handlers");
let RevisionRequestBusinessService = RevisionRequestBusinessService_1 = class RevisionRequestBusinessService {
    revisionRequestContextService;
    commandBus;
    logger = new common_1.Logger(RevisionRequestBusinessService_1.name);
    constructor(revisionRequestContextService, commandBus) {
        this.revisionRequestContextService = revisionRequestContextService;
        this.commandBus = commandBus;
    }
    async 재작성완료_응답을_제출한다(requestId, recipientId, responseComment) {
        this.logger.log(`재작성 완료 응답 제출 시작 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
        const request = await this.revisionRequestContextService.재작성완료_응답을_제출한다_내부(requestId, recipientId, responseComment);
        try {
            let allCompleted;
            if (request.step === 'secondary') {
                allCompleted =
                    await this.revisionRequestContextService.모든_2차평가자의_재작성요청이_완료했는가_내부(request.evaluationPeriodId, request.employeeId);
            }
            else {
                allCompleted =
                    await this.revisionRequestContextService.모든_수신자가_완료했는가_내부(requestId);
            }
            await this.commandBus.execute(new handlers_1.재작성완료활동내역을생성한다(request.evaluationPeriodId, request.employeeId, request.step, requestId, recipientId, responseComment, allCompleted));
            this.logger.log('재작성 완료 활동 내역 기록 완료');
        }
        catch (error) {
            this.logger.warn('재작성 완료 활동 내역 기록 실패', {
                requestId,
                recipientId,
                error: error.message,
            });
        }
        this.logger.log(`재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
    }
    async 평가기간_직원_평가자로_재작성완료_응답을_제출한다(evaluationPeriodId, employeeId, evaluatorId, step, responseComment) {
        this.logger.log(`재작성 완료 응답 제출 시작 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step}`);
        const request = await this.revisionRequestContextService.평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(evaluationPeriodId, employeeId, evaluatorId, step, responseComment);
        try {
            let allCompleted;
            if (request.step === 'secondary') {
                allCompleted =
                    await this.revisionRequestContextService.모든_2차평가자의_재작성요청이_완료했는가_내부(request.evaluationPeriodId, request.employeeId);
            }
            else {
                allCompleted =
                    await this.revisionRequestContextService.모든_수신자가_완료했는가_내부(request.id);
            }
            await this.commandBus.execute(new handlers_1.재작성완료활동내역을생성한다(request.evaluationPeriodId, request.employeeId, request.step, request.id, evaluatorId, responseComment, allCompleted));
            this.logger.log('재작성 완료 활동 내역 기록 완료');
        }
        catch (error) {
            this.logger.warn('재작성 완료 활동 내역 기록 실패', {
                evaluationPeriodId,
                employeeId,
                evaluatorId,
                error: error.message,
            });
        }
        this.logger.log(`재작성 완료 응답 제출 완료 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`);
    }
};
exports.RevisionRequestBusinessService = RevisionRequestBusinessService;
exports.RevisionRequestBusinessService = RevisionRequestBusinessService = RevisionRequestBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [revision_request_context_service_1.RevisionRequestContextService,
        cqrs_1.CommandBus])
], RevisionRequestBusinessService);
//# sourceMappingURL=revision-request-business.service.js.map