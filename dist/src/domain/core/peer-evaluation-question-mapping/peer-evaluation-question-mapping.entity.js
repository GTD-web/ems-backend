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
exports.PeerEvaluationQuestionMapping = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let PeerEvaluationQuestionMapping = class PeerEvaluationQuestionMapping extends base_entity_1.BaseEntity {
    peerEvaluationId;
    questionId;
    questionGroupId;
    displayOrder;
    answer;
    score;
    answeredAt;
    answeredBy;
    constructor(data) {
        super();
        if (data) {
            this.peerEvaluationId = data.peerEvaluationId;
            this.questionId = data.questionId;
            this.questionGroupId = data.questionGroupId;
            this.displayOrder = data.displayOrder;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    표시순서변경한다(displayOrder, updatedBy) {
        this.displayOrder = displayOrder;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    동료평가가_일치하는가(peerEvaluationId) {
        return this.peerEvaluationId === peerEvaluationId;
    }
    질문이_일치하는가(questionId) {
        return this.questionId === questionId;
    }
    그룹단위로_추가되었는가() {
        return this.questionGroupId !== undefined && this.questionGroupId !== null;
    }
    질문그룹이_일치하는가(questionGroupId) {
        return this.questionGroupId === questionGroupId;
    }
    답변이_있는가() {
        return (this.answer !== undefined &&
            this.answer !== null &&
            this.answer.trim() !== '');
    }
    답변을_저장한다(answer, answeredBy, score) {
        this.answer = answer;
        this.score = score;
        this.answeredAt = new Date();
        this.answeredBy = answeredBy;
        this.메타데이터를_업데이트한다(answeredBy);
    }
    답변을_삭제한다(deletedBy) {
        this.answer = undefined;
        this.score = undefined;
        this.answeredAt = undefined;
        this.answeredBy = undefined;
        this.메타데이터를_업데이트한다(deletedBy);
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            peerEvaluationId: this.peerEvaluationId,
            questionId: this.questionId,
            questionGroupId: this.questionGroupId,
            displayOrder: this.displayOrder,
            answer: this.answer,
            score: this.score,
            answeredAt: this.answeredAt,
            answeredBy: this.answeredBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
};
exports.PeerEvaluationQuestionMapping = PeerEvaluationQuestionMapping;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '동료평가 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluationQuestionMapping.prototype, "peerEvaluationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 질문 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluationQuestionMapping.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '질문 그룹 ID (그룹 단위 추가 시 사용)',
    }),
    __metadata("design:type", String)
], PeerEvaluationQuestionMapping.prototype, "questionGroupId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '표시 순서',
    }),
    __metadata("design:type", Number)
], PeerEvaluationQuestionMapping.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '답변 내용',
    }),
    __metadata("design:type", String)
], PeerEvaluationQuestionMapping.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        nullable: true,
        comment: '답변 점수',
    }),
    __metadata("design:type", Number)
], PeerEvaluationQuestionMapping.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '답변일',
    }),
    __metadata("design:type", Date)
], PeerEvaluationQuestionMapping.prototype, "answeredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '답변자 ID',
    }),
    __metadata("design:type", String)
], PeerEvaluationQuestionMapping.prototype, "answeredBy", void 0);
exports.PeerEvaluationQuestionMapping = PeerEvaluationQuestionMapping = __decorate([
    (0, typeorm_1.Entity)('peer_evaluation_question_mapping'),
    (0, typeorm_1.Index)(['peerEvaluationId', 'questionId'], { unique: true }),
    (0, typeorm_1.Index)(['peerEvaluationId', 'displayOrder']),
    __metadata("design:paramtypes", [Object])
], PeerEvaluationQuestionMapping);
//# sourceMappingURL=peer-evaluation-question-mapping.entity.js.map