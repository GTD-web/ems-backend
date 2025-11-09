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
exports.EvaluationLine = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const evaluation_line_types_1 = require("./evaluation-line.types");
let EvaluationLine = class EvaluationLine extends base_entity_1.BaseEntity {
    evaluatorType;
    order;
    isRequired;
    isAutoAssigned;
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluatorType: this.evaluatorType,
            order: this.order,
            isRequired: this.isRequired,
            isAutoAssigned: this.isAutoAssigned,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    평가자_유형을_변경한다(evaluatorType) {
        this.evaluatorType = evaluatorType;
        this.메타데이터를_업데이트한다();
    }
    평가_순서를_변경한다(order) {
        if (order < 1) {
            throw new Error('평가 순서는 1 이상이어야 합니다.');
        }
        this.order = order;
        this.메타데이터를_업데이트한다();
    }
    필수_평가자_여부를_변경한다(isRequired) {
        this.isRequired = isRequired;
        this.메타데이터를_업데이트한다();
    }
    자동_할당_여부를_변경한다(isAutoAssigned) {
        this.isAutoAssigned = isAutoAssigned;
        this.메타데이터를_업데이트한다();
    }
    유효성을_검증한다() {
        return (this.order > 0 &&
            Object.values(evaluation_line_types_1.EvaluatorType).includes(this.evaluatorType));
    }
};
exports.EvaluationLine = EvaluationLine;
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: evaluation_line_types_1.EvaluatorType,
        comment: '평가자 유형 (primary: 주평가자, secondary: 부평가자, additional: 추가평가자)',
    }),
    __metadata("design:type", String)
], EvaluationLine.prototype, "evaluatorType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '평가 순서',
    }),
    __metadata("design:type", Number)
], EvaluationLine.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: '필수 평가자 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationLine.prototype, "isRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '자동 할당 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationLine.prototype, "isAutoAssigned", void 0);
exports.EvaluationLine = EvaluationLine = __decorate([
    (0, typeorm_1.Entity)('evaluation_lines')
], EvaluationLine);
//# sourceMappingURL=evaluation-line.entity.js.map