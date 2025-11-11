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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationRevisionRequest = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const evaluation_revision_request_recipient_entity_1 = require("./evaluation-revision-request-recipient.entity");
let EvaluationRevisionRequest = class EvaluationRevisionRequest extends base_entity_1.BaseEntity {
    evaluationPeriodId;
    employeeId;
    step;
    comment;
    requestedBy;
    requestedAt;
    recipients;
    constructor(data) {
        super();
        if (data) {
            this.evaluationPeriodId = data.evaluationPeriodId;
            this.employeeId = data.employeeId;
            this.step = data.step;
            this.comment = data.comment;
            this.requestedBy = data.requestedBy;
            this.requestedAt = new Date();
            this.recipients = [];
            if (data.recipients && data.recipients.length > 0) {
                for (const recipientData of data.recipients) {
                    this.수신자를_추가한다(recipientData.recipientId, recipientData.recipientType, data.createdBy);
                }
            }
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    수신자를_추가한다(recipientId, recipientType, createdBy) {
        const exists = this.recipients.some((r) => r.recipientId === recipientId && r.recipientType === recipientType);
        if (exists) {
            return;
        }
        const recipient = new evaluation_revision_request_recipient_entity_1.EvaluationRevisionRequestRecipient({
            revisionRequestId: this.id,
            recipientId,
            recipientType,
            createdBy,
        });
        this.recipients.push(recipient);
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluationPeriodId: this.evaluationPeriodId,
            employeeId: this.employeeId,
            step: this.step,
            comment: this.comment,
            requestedBy: this.requestedBy,
            requestedAt: this.requestedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
};
exports.EvaluationRevisionRequest = EvaluationRevisionRequest;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가기간 ID',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequest.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '피평가자 ID',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequest.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['criteria', 'self', 'primary', 'secondary'],
        comment: '재작성 요청 단계',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequest.prototype, "step", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: '재작성 요청 코멘트',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequest.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '요청자 ID (관리자)',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequest.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '요청 일시',
    }),
    __metadata("design:type", Date)
], EvaluationRevisionRequest.prototype, "requestedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => evaluation_revision_request_recipient_entity_1.EvaluationRevisionRequestRecipient, (recipient) => recipient.revisionRequest, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], EvaluationRevisionRequest.prototype, "recipients", void 0);
exports.EvaluationRevisionRequest = EvaluationRevisionRequest = __decorate([
    (0, typeorm_1.Entity)('evaluation_revision_request'),
    (0, typeorm_1.Index)(['evaluationPeriodId']),
    (0, typeorm_1.Index)(['employeeId']),
    (0, typeorm_1.Index)(['step']),
    (0, typeorm_1.Index)(['requestedBy']),
    (0, typeorm_1.Index)(['requestedAt']),
    __metadata("design:paramtypes", [Object])
], EvaluationRevisionRequest);
//# sourceMappingURL=evaluation-revision-request.entity.js.map