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
exports.EvaluationLineMapping = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let EvaluationLineMapping = class EvaluationLineMapping extends base_entity_1.BaseEntity {
    evaluationPeriodId;
    employeeId;
    evaluatorId;
    wbsItemId;
    evaluationLineId;
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluationPeriodId: this.evaluationPeriodId,
            employeeId: this.employeeId,
            evaluatorId: this.evaluatorId,
            wbsItemId: this.wbsItemId,
            evaluationLineId: this.evaluationLineId,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    평가자를_변경한다(evaluatorId) {
        this.evaluatorId = evaluatorId;
        this.메타데이터를_업데이트한다();
    }
    평가라인을_변경한다(evaluationLineId) {
        this.evaluationLineId = evaluationLineId;
        this.메타데이터를_업데이트한다();
    }
    WBS항목을_변경한다(wbsItemId) {
        this.wbsItemId = wbsItemId;
        this.메타데이터를_업데이트한다();
    }
    유효성을_검증한다() {
        return (this.evaluationPeriodId !== undefined &&
            this.employeeId !== undefined &&
            this.evaluatorId !== undefined &&
            this.evaluationLineId !== undefined &&
            this.employeeId !== this.evaluatorId);
    }
    WBS_기반_평가인가() {
        return this.wbsItemId !== undefined && this.wbsItemId !== null;
    }
    동일한_평가관계인가(evaluationPeriodId, employeeId, evaluatorId, wbsItemId) {
        return (this.evaluationPeriodId === evaluationPeriodId &&
            this.employeeId === employeeId &&
            this.evaluatorId === evaluatorId &&
            this.wbsItemId === wbsItemId);
    }
};
exports.EvaluationLineMapping = EvaluationLineMapping;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가기간 ID - 평가가 수행되는 평가기간 식별자',
    }),
    __metadata("design:type", String)
], EvaluationLineMapping.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '피평가자 ID - 평가를 받는 직원 식별자',
    }),
    __metadata("design:type", String)
], EvaluationLineMapping.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가자 ID - 평가를 수행하는 직원 식별자',
    }),
    __metadata("design:type", String)
], EvaluationLineMapping.prototype, "evaluatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: 'WBS 항목 ID - 평가가 수행되는 WBS 항목 식별자 (선택적)',
    }),
    __metadata("design:type", String)
], EvaluationLineMapping.prototype, "wbsItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 라인 ID - 실제 평가 라인 엔티티 식별자',
    }),
    __metadata("design:type", String)
], EvaluationLineMapping.prototype, "evaluationLineId", void 0);
exports.EvaluationLineMapping = EvaluationLineMapping = __decorate([
    (0, typeorm_1.Entity)('evaluation_line_mappings')
], EvaluationLineMapping);
//# sourceMappingURL=evaluation-line-mapping.entity.js.map