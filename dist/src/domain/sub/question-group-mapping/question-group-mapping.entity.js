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
exports.QuestionGroupMapping = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const evaluation_question_entity_1 = require("../evaluation-question/evaluation-question.entity");
const question_group_entity_1 = require("../question-group/question-group.entity");
let QuestionGroupMapping = class QuestionGroupMapping extends base_entity_1.BaseEntity {
    groupId;
    group;
    questionId;
    question;
    displayOrder;
    constructor(data) {
        super();
        if (data) {
            this.groupId = data.groupId;
            this.questionId = data.questionId;
            this.displayOrder = data.displayOrder || 0;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    표시순서변경한다(order, updatedBy) {
        this.displayOrder = order;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    그룹일치하는가(groupId) {
        return this.groupId === groupId;
    }
    질문일치하는가(questionId) {
        return this.questionId === questionId;
    }
    매핑일치하는가(groupId, questionId) {
        return this.groupId === groupId && this.questionId === questionId;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            groupId: this.groupId,
            questionId: this.questionId,
            displayOrder: this.displayOrder,
            group: this.group ? this.group.DTO로_변환한다() : undefined,
            question: this.question ? this.question.DTO로_변환한다() : undefined,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
};
exports.QuestionGroupMapping = QuestionGroupMapping;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '질문 그룹 ID',
    }),
    __metadata("design:type", String)
], QuestionGroupMapping.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => question_group_entity_1.QuestionGroup, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", question_group_entity_1.QuestionGroup)
], QuestionGroupMapping.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 질문 ID',
    }),
    __metadata("design:type", String)
], QuestionGroupMapping.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => evaluation_question_entity_1.EvaluationQuestion, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'questionId' }),
    __metadata("design:type", evaluation_question_entity_1.EvaluationQuestion)
], QuestionGroupMapping.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        default: 0,
        comment: '표시 순서',
    }),
    __metadata("design:type", Number)
], QuestionGroupMapping.prototype, "displayOrder", void 0);
exports.QuestionGroupMapping = QuestionGroupMapping = __decorate([
    (0, typeorm_1.Entity)('question_group_mapping'),
    (0, typeorm_1.Index)(['groupId']),
    (0, typeorm_1.Index)(['questionId']),
    (0, typeorm_1.Index)(['groupId', 'questionId'], { unique: true }),
    (0, typeorm_1.Index)(['displayOrder']),
    __metadata("design:paramtypes", [Object])
], QuestionGroupMapping);
//# sourceMappingURL=question-group-mapping.entity.js.map