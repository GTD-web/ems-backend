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
exports.PeerEvaluation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const peer_evaluation_types_1 = require("./peer-evaluation.types");
let PeerEvaluation = class PeerEvaluation extends base_entity_1.BaseEntity {
    evaluateeId;
    evaluatorId;
    periodId;
    evaluationDate;
    status;
    isCompleted;
    completedAt;
    requestDeadline;
    mappedDate;
    mappedBy;
    isActive;
    constructor(data) {
        super();
        if (data) {
            this.evaluateeId = data.evaluateeId;
            this.evaluatorId = data.evaluatorId;
            this.periodId = data.periodId;
            this.status = data.status || peer_evaluation_types_1.PeerEvaluationStatus.PENDING;
            this.evaluationDate = data.evaluationDate || new Date();
            this.isCompleted = data.isCompleted || false;
            this.requestDeadline = data.requestDeadline;
            this.mappedDate = data.mappedDate || new Date();
            this.mappedBy = data.mappedBy || data.createdBy;
            this.isActive = data.isActive !== undefined ? data.isActive : true;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    완료되었는가() {
        return this.isCompleted;
    }
    진행중인가() {
        return this.status === peer_evaluation_types_1.PeerEvaluationStatus.IN_PROGRESS;
    }
    대기중인가() {
        return this.status === peer_evaluation_types_1.PeerEvaluationStatus.PENDING;
    }
    마감일이_지났는가() {
        if (!this.requestDeadline) {
            return false;
        }
        return new Date() > this.requestDeadline;
    }
    마감일이_있는가() {
        return this.requestDeadline !== null && this.requestDeadline !== undefined;
    }
    평가를_완료한다(completedBy) {
        this.status = peer_evaluation_types_1.PeerEvaluationStatus.COMPLETED;
        this.isCompleted = true;
        this.completedAt = new Date();
        if (completedBy) {
            this.메타데이터를_업데이트한다(completedBy);
        }
    }
    진행중으로_변경한다(updatedBy) {
        this.status = peer_evaluation_types_1.PeerEvaluationStatus.IN_PROGRESS;
        this.isCompleted = false;
        this.completedAt = undefined;
        if (updatedBy) {
            this.메타데이터를_업데이트한다(updatedBy);
        }
    }
    취소한다(cancelledBy) {
        this.status = peer_evaluation_types_1.PeerEvaluationStatus.CANCELLED;
        this.isCompleted = false;
        this.completedAt = undefined;
        if (cancelledBy) {
            this.메타데이터를_업데이트한다(cancelledBy);
        }
    }
    삭제한다() {
        this.deletedAt = new Date();
    }
    해당_피평가자의_평가인가(evaluateeId) {
        return this.evaluateeId === evaluateeId;
    }
    해당_평가자의_평가인가(evaluatorId) {
        return this.evaluatorId === evaluatorId;
    }
    해당_평가기간의_평가인가(periodId) {
        return this.periodId === periodId;
    }
    자기_자신을_평가하는가() {
        return this.evaluateeId === this.evaluatorId;
    }
    활성화한다(activatedBy) {
        this.isActive = true;
        if (activatedBy) {
            this.메타데이터를_업데이트한다(activatedBy);
        }
    }
    비활성화한다(deactivatedBy) {
        this.isActive = false;
        if (deactivatedBy) {
            this.메타데이터를_업데이트한다(deactivatedBy);
        }
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluateeId: this.evaluateeId,
            evaluatorId: this.evaluatorId,
            periodId: this.periodId,
            evaluationDate: this.evaluationDate,
            status: this.status,
            isCompleted: this.isCompleted,
            completedAt: this.completedAt,
            requestDeadline: this.requestDeadline,
            mappedDate: this.mappedDate,
            mappedBy: this.mappedBy,
            isActive: this.isActive,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            version: this.version,
        };
    }
};
exports.PeerEvaluation = PeerEvaluation;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '피평가자 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluation.prototype, "evaluateeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가자 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluation.prototype, "evaluatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 기간 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluation.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP',
        comment: '평가일',
    }),
    __metadata("design:type", Date)
], PeerEvaluation.prototype, "evaluationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
        comment: '평가 상태',
    }),
    __metadata("design:type", String)
], PeerEvaluation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '평가 완료 여부',
    }),
    __metadata("design:type", Boolean)
], PeerEvaluation.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '평가 완료일',
    }),
    __metadata("design:type", Date)
], PeerEvaluation.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '요청 마감일',
    }),
    __metadata("design:type", Date)
], PeerEvaluation.prototype, "requestDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP',
        comment: '매핑일',
    }),
    __metadata("design:type", Date)
], PeerEvaluation.prototype, "mappedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '매핑자 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluation.prototype, "mappedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: '활성 상태',
    }),
    __metadata("design:type", Boolean)
], PeerEvaluation.prototype, "isActive", void 0);
exports.PeerEvaluation = PeerEvaluation = __decorate([
    (0, typeorm_1.Entity)('peer_evaluation'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['evaluationDate']),
    (0, typeorm_1.Index)(['evaluateeId']),
    (0, typeorm_1.Index)(['evaluatorId']),
    (0, typeorm_1.Index)(['periodId']),
    (0, typeorm_1.Index)(['evaluateeId', 'evaluatorId', 'periodId']),
    __metadata("design:paramtypes", [Object])
], PeerEvaluation);
//# sourceMappingURL=peer-evaluation.entity.js.map