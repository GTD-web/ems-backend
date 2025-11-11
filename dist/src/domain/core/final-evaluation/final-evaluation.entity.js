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
exports.FinalEvaluation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const final_evaluation_types_1 = require("./final-evaluation.types");
const final_evaluation_exceptions_1 = require("./final-evaluation.exceptions");
let FinalEvaluation = class FinalEvaluation extends base_entity_1.BaseEntity {
    employeeId;
    periodId;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    isConfirmed;
    confirmedAt;
    confirmedBy;
    DTO로_변환한다() {
        return {
            id: this.id,
            employeeId: this.employeeId,
            periodId: this.periodId,
            evaluationGrade: this.evaluationGrade,
            jobGrade: this.jobGrade,
            jobDetailedGrade: this.jobDetailedGrade,
            finalComments: this.finalComments,
            isConfirmed: this.isConfirmed,
            confirmedAt: this.confirmedAt,
            confirmedBy: this.confirmedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            version: this.version,
        };
    }
    평가등급을_변경한다(evaluationGrade, updatedBy) {
        if (this.isConfirmed) {
            throw new Error('확정된 평가는 수정할 수 없습니다.');
        }
        this.evaluationGrade = evaluationGrade;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    직무등급을_변경한다(jobGrade, updatedBy) {
        if (this.isConfirmed) {
            throw new Error('확정된 평가는 수정할 수 없습니다.');
        }
        this.jobGrade = jobGrade;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    직무_상세등급을_변경한다(jobDetailedGrade, updatedBy) {
        if (this.isConfirmed) {
            throw new Error('확정된 평가는 수정할 수 없습니다.');
        }
        this.jobDetailedGrade = jobDetailedGrade;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    최종_평가_의견을_변경한다(finalComments, updatedBy) {
        if (this.isConfirmed) {
            throw new Error('확정된 평가는 수정할 수 없습니다.');
        }
        this.finalComments = finalComments;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    평가를_확정한다(confirmedBy) {
        if (this.isConfirmed) {
            throw new final_evaluation_exceptions_1.AlreadyConfirmedEvaluationException(this.id);
        }
        this.isConfirmed = true;
        this.confirmedAt = new Date();
        this.confirmedBy = confirmedBy;
        this.메타데이터를_업데이트한다(confirmedBy);
    }
    평가_확정을_취소한다(updatedBy) {
        if (!this.isConfirmed) {
            throw new final_evaluation_exceptions_1.NotConfirmedEvaluationException(this.id, '확정 취소');
        }
        this.isConfirmed = false;
        this.confirmedAt = null;
        this.confirmedBy = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    확정되었는가() {
        return this.isConfirmed;
    }
    수정_가능한가() {
        return !this.isConfirmed;
    }
    유효성을_검증한다() {
        return (!!this.employeeId &&
            !!this.periodId &&
            !!this.evaluationGrade &&
            !!this.jobGrade &&
            !!this.jobDetailedGrade &&
            Object.values(final_evaluation_types_1.JobGrade).includes(this.jobGrade) &&
            Object.values(final_evaluation_types_1.JobDetailedGrade).includes(this.jobDetailedGrade));
    }
};
exports.FinalEvaluation = FinalEvaluation;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '피평가자(직원) ID',
    }),
    __metadata("design:type", String)
], FinalEvaluation.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '평가기간 ID',
    }),
    __metadata("design:type", String)
], FinalEvaluation.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 10,
        comment: '평가등급 (예: S, A, B, C, D)',
    }),
    __metadata("design:type", String)
], FinalEvaluation.prototype, "evaluationGrade", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: final_evaluation_types_1.JobGrade,
        comment: '직무등급 (T1: 낮음, T2: 중간, T3: 높음)',
    }),
    __metadata("design:type", String)
], FinalEvaluation.prototype, "jobGrade", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: final_evaluation_types_1.JobDetailedGrade,
        comment: '직무 상세등급 (u: 낮음, n: 중간, a: 높음)',
    }),
    __metadata("design:type", String)
], FinalEvaluation.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '최종 평가 의견/코멘트',
    }),
    __metadata("design:type", String)
], FinalEvaluation.prototype, "finalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '확정 여부',
    }),
    __metadata("design:type", Boolean)
], FinalEvaluation.prototype, "isConfirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '확정일시',
    }),
    __metadata("design:type", Object)
], FinalEvaluation.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '확정자 ID',
    }),
    __metadata("design:type", Object)
], FinalEvaluation.prototype, "confirmedBy", void 0);
exports.FinalEvaluation = FinalEvaluation = __decorate([
    (0, typeorm_1.Entity)('final_evaluations'),
    (0, typeorm_1.Index)(['employeeId', 'periodId'], { unique: true })
], FinalEvaluation);
//# sourceMappingURL=final-evaluation.entity.js.map