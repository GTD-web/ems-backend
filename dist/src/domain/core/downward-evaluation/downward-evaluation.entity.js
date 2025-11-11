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
exports.DownwardEvaluation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const downward_evaluation_types_1 = require("./downward-evaluation.types");
let DownwardEvaluation = class DownwardEvaluation extends base_entity_1.BaseEntity {
    employeeId;
    evaluatorId;
    wbsId;
    periodId;
    selfEvaluationId;
    downwardEvaluationContent;
    downwardEvaluationScore;
    evaluationDate;
    evaluationType;
    isCompleted;
    completedAt;
    constructor(data) {
        super();
        if (data) {
            this.employeeId = data.employeeId;
            this.evaluatorId = data.evaluatorId;
            this.wbsId = data.wbsId;
            this.periodId = data.periodId;
            this.selfEvaluationId = data.selfEvaluationId;
            this.downwardEvaluationContent = data.downwardEvaluationContent;
            this.downwardEvaluationScore = data.downwardEvaluationScore;
            this.evaluationType = data.evaluationType;
            this.evaluationDate = data.evaluationDate || new Date();
            this.isCompleted = data.isCompleted || false;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    완료되었는가() {
        return this.isCompleted;
    }
    점수가_유효한가() {
        return (this.downwardEvaluationScore !== undefined &&
            this.downwardEvaluationScore >= 1 &&
            this.downwardEvaluationScore <= 5);
    }
    평가를_완료한다(completedBy) {
        this.isCompleted = true;
        this.completedAt = new Date();
        if (completedBy) {
            this.메타데이터를_업데이트한다(completedBy);
        }
    }
    하향평가를_수정한다(content, score, updatedBy) {
        if (content !== undefined) {
            this.downwardEvaluationContent = content;
        }
        if (score !== undefined) {
            this.downwardEvaluationScore = score;
        }
        if (updatedBy) {
            this.메타데이터를_업데이트한다(updatedBy);
        }
    }
    해당_피평가자의_평가인가(employeeId) {
        return this.employeeId === employeeId;
    }
    해당_평가자의_평가인가(evaluatorId) {
        return this.evaluatorId === evaluatorId;
    }
    해당_WBS의_평가인가(wbsId) {
        return this.wbsId === wbsId;
    }
    해당_평가기간의_평가인가(periodId) {
        return this.periodId === periodId;
    }
    자기평가가_연결되어_있는가() {
        return (this.selfEvaluationId !== null && this.selfEvaluationId !== undefined);
    }
    자기평가를_연결한다(selfEvaluationId, connectedBy) {
        this.selfEvaluationId = selfEvaluationId;
        if (connectedBy) {
            this.메타데이터를_업데이트한다(connectedBy);
        }
    }
    자기평가_연결을_해제한다(disconnectedBy) {
        this.selfEvaluationId = undefined;
        if (disconnectedBy) {
            this.메타데이터를_업데이트한다(disconnectedBy);
        }
    }
    삭제한다() {
        this.deletedAt = new Date();
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            employeeId: this.employeeId,
            evaluatorId: this.evaluatorId,
            wbsId: this.wbsId,
            periodId: this.periodId,
            selfEvaluationId: this.selfEvaluationId,
            downwardEvaluationContent: this.downwardEvaluationContent,
            downwardEvaluationScore: this.downwardEvaluationScore,
            evaluationDate: this.evaluationDate,
            evaluationType: this.evaluationType,
            isCompleted: this.isCompleted,
            completedAt: this.completedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            version: this.version,
        };
    }
};
exports.DownwardEvaluation = DownwardEvaluation;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '피평가자 ID',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가자 ID',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "evaluatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: 'WBS ID',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "wbsId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 기간 ID',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '자기평가 ID',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "selfEvaluationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '하향평가 내용',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "downwardEvaluationContent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        nullable: true,
        comment: '하향평가 점수',
    }),
    __metadata("design:type", Number)
], DownwardEvaluation.prototype, "downwardEvaluationScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP',
        comment: '평가일',
    }),
    __metadata("design:type", Date)
], DownwardEvaluation.prototype, "evaluationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['primary', 'secondary'],
        comment: '평가 유형',
    }),
    __metadata("design:type", String)
], DownwardEvaluation.prototype, "evaluationType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '평가 완료 여부',
    }),
    __metadata("design:type", Boolean)
], DownwardEvaluation.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '평가 완료일',
    }),
    __metadata("design:type", Date)
], DownwardEvaluation.prototype, "completedAt", void 0);
exports.DownwardEvaluation = DownwardEvaluation = __decorate([
    (0, typeorm_1.Entity)('downward_evaluation'),
    (0, typeorm_1.Index)(['employeeId']),
    (0, typeorm_1.Index)(['evaluatorId']),
    (0, typeorm_1.Index)(['wbsId']),
    (0, typeorm_1.Index)(['periodId']),
    (0, typeorm_1.Index)(['selfEvaluationId']),
    (0, typeorm_1.Index)(['evaluationType']),
    (0, typeorm_1.Index)(['evaluationDate']),
    (0, typeorm_1.Index)(['downwardEvaluationScore']),
    (0, typeorm_1.Index)(['employeeId', 'evaluatorId', 'periodId']),
    __metadata("design:paramtypes", [Object])
], DownwardEvaluation);
//# sourceMappingURL=downward-evaluation.entity.js.map