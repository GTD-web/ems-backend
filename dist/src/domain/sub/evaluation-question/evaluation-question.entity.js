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
exports.EvaluationQuestion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const evaluation_question_exceptions_1 = require("./evaluation-question.exceptions");
let EvaluationQuestion = class EvaluationQuestion extends base_entity_1.BaseEntity {
    text;
    minScore;
    maxScore;
    constructor(data) {
        super();
        if (data) {
            if (!data.text || data.text.trim() === '') {
                throw new evaluation_question_exceptions_1.EmptyQuestionTextException();
            }
            if (data.minScore !== undefined &&
                data.minScore !== null &&
                data.maxScore !== undefined &&
                data.maxScore !== null) {
                if (data.minScore >= data.maxScore) {
                    throw new evaluation_question_exceptions_1.InvalidScoreRangeException(data.minScore, data.maxScore);
                }
            }
            this.text = data.text;
            this.minScore = data.minScore;
            this.maxScore = data.maxScore;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    질문내용업데이트한다(text, updatedBy) {
        if (!text || text.trim() === '') {
            throw new evaluation_question_exceptions_1.EmptyQuestionTextException();
        }
        this.text = text;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    점수범위설정한다(minScore, maxScore, updatedBy) {
        if (minScore !== null &&
            minScore !== undefined &&
            maxScore !== null &&
            maxScore !== undefined) {
            if (minScore >= maxScore) {
                throw new evaluation_question_exceptions_1.InvalidScoreRangeException(minScore, maxScore);
            }
        }
        this.minScore = minScore ?? undefined;
        this.maxScore = maxScore ?? undefined;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    점수범위유효한가() {
        if (this.minScore === undefined || this.maxScore === undefined) {
            return true;
        }
        return this.minScore < this.maxScore;
    }
    질문내용유효한가() {
        return this.text !== undefined && this.text.trim() !== '';
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            text: this.text,
            minScore: this.minScore ?? undefined,
            maxScore: this.maxScore ?? undefined,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
};
exports.EvaluationQuestion = EvaluationQuestion;
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: '질문 내용',
    }),
    __metadata("design:type", String)
], EvaluationQuestion.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        nullable: true,
        comment: '최소 점수',
    }),
    __metadata("design:type", Number)
], EvaluationQuestion.prototype, "minScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        nullable: true,
        comment: '최대 점수',
    }),
    __metadata("design:type", Number)
], EvaluationQuestion.prototype, "maxScore", void 0);
exports.EvaluationQuestion = EvaluationQuestion = __decorate([
    (0, typeorm_1.Entity)('evaluation_question'),
    (0, typeorm_1.Index)(['text']),
    __metadata("design:paramtypes", [Object])
], EvaluationQuestion);
//# sourceMappingURL=evaluation-question.entity.js.map