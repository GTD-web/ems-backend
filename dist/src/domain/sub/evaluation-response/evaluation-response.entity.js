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
exports.EvaluationResponse = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const evaluation_response_types_1 = require("./evaluation-response.types");
let EvaluationResponse = class EvaluationResponse extends base_entity_1.BaseEntity {
    questionId;
    evaluationId;
    evaluationType;
    answer;
    score;
    constructor(data) {
        super();
        if (data) {
            this.questionId = data.questionId;
            this.evaluationId = data.evaluationId;
            this.evaluationType = data.evaluationType;
            this.answer = data.answer;
            this.score = data.score;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    응답내용업데이트한다(answer, updatedBy) {
        this.answer = answer;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    응답점수업데이트한다(score, updatedBy) {
        this.score = score;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    응답전체업데이트한다(answer, score, updatedBy) {
        if (answer !== undefined) {
            this.answer = answer;
        }
        if (score !== undefined) {
            this.score = score;
        }
        if (updatedBy) {
            this.메타데이터를_업데이트한다(updatedBy);
        }
    }
    질문일치하는가(questionId) {
        return this.questionId === questionId;
    }
    평가일치하는가(evaluationId) {
        return this.evaluationId === evaluationId;
    }
    평가유형일치하는가(evaluationType) {
        return this.evaluationType === evaluationType;
    }
    자기평가인가() {
        return this.evaluationType === evaluation_response_types_1.EvaluationResponseType.SELF;
    }
    동료평가인가() {
        return this.evaluationType === evaluation_response_types_1.EvaluationResponseType.PEER;
    }
    하향평가인가() {
        return this.evaluationType === evaluation_response_types_1.EvaluationResponseType.DOWNWARD;
    }
    추가평가인가() {
        return this.evaluationType === evaluation_response_types_1.EvaluationResponseType.ADDITIONAL;
    }
    응답내용있는가() {
        return this.answer !== undefined && this.answer.trim() !== '';
    }
    응답점수있는가() {
        return this.score !== undefined;
    }
    완전한응답인가() {
        return this.응답내용있는가() || this.응답점수있는가();
    }
    점수범위유효한가(minScore, maxScore) {
        if (this.score === undefined) {
            return false;
        }
        return this.score >= minScore && this.score <= maxScore;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            questionId: this.questionId,
            evaluationId: this.evaluationId,
            evaluationType: this.evaluationType,
            answer: this.answer,
            score: this.score,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
};
exports.EvaluationResponse = EvaluationResponse;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '질문 ID',
    }),
    __metadata("design:type", String)
], EvaluationResponse.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 ID',
    }),
    __metadata("design:type", String)
], EvaluationResponse.prototype, "evaluationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: evaluation_response_types_1.EvaluationResponseType,
        comment: '평가 유형',
    }),
    __metadata("design:type", String)
], EvaluationResponse.prototype, "evaluationType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '응답 내용',
    }),
    __metadata("design:type", String)
], EvaluationResponse.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        nullable: true,
        comment: '응답 점수',
    }),
    __metadata("design:type", Number)
], EvaluationResponse.prototype, "score", void 0);
exports.EvaluationResponse = EvaluationResponse = __decorate([
    (0, typeorm_1.Entity)('evaluation_response'),
    (0, typeorm_1.Index)(['questionId']),
    (0, typeorm_1.Index)(['evaluationId']),
    (0, typeorm_1.Index)(['evaluationType']),
    (0, typeorm_1.Index)(['evaluationId', 'questionId'], { unique: true }),
    __metadata("design:paramtypes", [Object])
], EvaluationResponse);
//# sourceMappingURL=evaluation-response.entity.js.map