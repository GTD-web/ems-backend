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
exports.EvaluationRevisionRequestRecipient = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const evaluation_revision_request_exceptions_1 = require("./evaluation-revision-request.exceptions");
const evaluation_revision_request_entity_1 = require("./evaluation-revision-request.entity");
let EvaluationRevisionRequestRecipient = class EvaluationRevisionRequestRecipient extends base_entity_1.BaseEntity {
    revisionRequestId;
    revisionRequest;
    recipientId;
    recipientType;
    isRead;
    readAt;
    isCompleted;
    completedAt;
    responseComment;
    constructor(data) {
        super();
        if (data) {
            this.revisionRequestId = data.revisionRequestId;
            this.recipientId = data.recipientId;
            this.recipientType = data.recipientType;
            this.isRead = false;
            this.readAt = null;
            this.isCompleted = false;
            this.completedAt = null;
            this.responseComment = null;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    읽음처리한다() {
        if (this.isRead) {
            return;
        }
        this.isRead = true;
        this.readAt = new Date();
        this.메타데이터를_업데이트한다(this.recipientId);
    }
    읽지않음으로_변경한다() {
        this.isRead = false;
        this.readAt = null;
        this.메타데이터를_업데이트한다(this.recipientId);
    }
    읽음상태인가() {
        return this.isRead;
    }
    재작성완료_응답한다(responseComment) {
        if (!responseComment || responseComment.trim() === '') {
            throw new evaluation_revision_request_exceptions_1.EmptyResponseCommentException();
        }
        if (this.isCompleted) {
            throw new evaluation_revision_request_exceptions_1.RevisionRequestAlreadyCompletedException(this.revisionRequestId);
        }
        this.isCompleted = true;
        this.completedAt = new Date();
        this.responseComment = responseComment;
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = new Date();
        }
        this.메타데이터를_업데이트한다(this.recipientId);
    }
    재작성완료_응답을_취소한다() {
        this.isCompleted = false;
        this.completedAt = null;
        this.responseComment = null;
        this.메타데이터를_업데이트한다(this.recipientId);
    }
    특정수신자의_요청인가(recipientId) {
        return this.recipientId === recipientId;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            revisionRequestId: this.revisionRequestId,
            recipientId: this.recipientId,
            recipientType: this.recipientType,
            isRead: this.isRead,
            readAt: this.readAt,
            isCompleted: this.isCompleted,
            completedAt: this.completedAt,
            responseComment: this.responseComment,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
};
exports.EvaluationRevisionRequestRecipient = EvaluationRevisionRequestRecipient;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '재작성 요청 ID',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequestRecipient.prototype, "revisionRequestId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => evaluation_revision_request_entity_1.EvaluationRevisionRequest, (request) => request.recipients),
    (0, typeorm_1.JoinColumn)({ name: 'revisionRequestId' }),
    __metadata("design:type", evaluation_revision_request_entity_1.EvaluationRevisionRequest)
], EvaluationRevisionRequestRecipient.prototype, "revisionRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '수신자 ID',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequestRecipient.prototype, "recipientId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['evaluatee', 'primary_evaluator', 'secondary_evaluator'],
        comment: '수신자 타입',
    }),
    __metadata("design:type", String)
], EvaluationRevisionRequestRecipient.prototype, "recipientType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '읽음 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationRevisionRequestRecipient.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '읽은 일시',
    }),
    __metadata("design:type", Object)
], EvaluationRevisionRequestRecipient.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '재작성 완료 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationRevisionRequestRecipient.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '재작성 완료 일시',
    }),
    __metadata("design:type", Object)
], EvaluationRevisionRequestRecipient.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '재작성 완료 응답 코멘트',
    }),
    __metadata("design:type", Object)
], EvaluationRevisionRequestRecipient.prototype, "responseComment", void 0);
exports.EvaluationRevisionRequestRecipient = EvaluationRevisionRequestRecipient = __decorate([
    (0, typeorm_1.Entity)('evaluation_revision_request_recipient'),
    (0, typeorm_1.Index)(['revisionRequestId']),
    (0, typeorm_1.Index)(['recipientId']),
    (0, typeorm_1.Index)(['isRead']),
    (0, typeorm_1.Index)(['isCompleted']),
    __metadata("design:paramtypes", [Object])
], EvaluationRevisionRequestRecipient);
//# sourceMappingURL=evaluation-revision-request-recipient.entity.js.map