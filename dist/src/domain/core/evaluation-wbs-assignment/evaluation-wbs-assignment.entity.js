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
exports.EvaluationWbsAssignment = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let EvaluationWbsAssignment = class EvaluationWbsAssignment extends base_entity_1.BaseEntity {
    periodId;
    employeeId;
    projectId;
    wbsItemId;
    assignedDate;
    assignedBy;
    displayOrder;
    weight;
    constructor(data) {
        super();
        if (data) {
            this.periodId = data.periodId;
            this.employeeId = data.employeeId;
            this.projectId = data.projectId;
            this.wbsItemId = data.wbsItemId;
            this.assignedBy = data.assignedBy;
            this.assignedDate = new Date();
            this.displayOrder = 0;
            this.weight = 0;
        }
    }
    평가기간과_일치하는가(periodId) {
        return this.periodId === periodId;
    }
    해당_직원의_할당인가(employeeId) {
        return this.employeeId === employeeId;
    }
    해당_프로젝트의_WBS_할당인가(projectId) {
        return this.projectId === projectId;
    }
    해당_WBS_항목의_할당인가(wbsItemId) {
        return this.wbsItemId === wbsItemId;
    }
    순서를_변경한다(newOrder) {
        if (newOrder < 0) {
            throw new Error('표시 순서는 0 이상이어야 합니다.');
        }
        this.displayOrder = newOrder;
    }
    가중치를_설정한다(weight) {
        if (weight < 0 || weight > 100) {
            throw new Error('가중치는 0~100 사이여야 합니다.');
        }
        this.weight = weight;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            periodId: this.periodId,
            employeeId: this.employeeId,
            projectId: this.projectId,
            wbsItemId: this.wbsItemId,
            assignedDate: this.assignedDate,
            assignedBy: this.assignedBy,
            displayOrder: this.displayOrder,
            weight: this.weight,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            version: this.version,
        };
    }
};
exports.EvaluationWbsAssignment = EvaluationWbsAssignment;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 기간 ID',
    }),
    __metadata("design:type", String)
], EvaluationWbsAssignment.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '직원 ID',
    }),
    __metadata("design:type", String)
], EvaluationWbsAssignment.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '프로젝트 ID',
    }),
    __metadata("design:type", String)
], EvaluationWbsAssignment.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: 'WBS 항목 ID',
    }),
    __metadata("design:type", String)
], EvaluationWbsAssignment.prototype, "wbsItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '할당일',
    }),
    __metadata("design:type", Date)
], EvaluationWbsAssignment.prototype, "assignedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '할당자 ID',
    }),
    __metadata("design:type", String)
], EvaluationWbsAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '표시 순서 (같은 프로젝트-평가기간 내에서의 순서)',
        default: 0,
    }),
    __metadata("design:type", Number)
], EvaluationWbsAssignment.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 5,
        scale: 2,
        comment: '가중치 (0~100, 직원별 WBS 중요도 기반 자동 계산)',
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => (value ? parseFloat(value) : 0),
        },
    }),
    __metadata("design:type", Number)
], EvaluationWbsAssignment.prototype, "weight", void 0);
exports.EvaluationWbsAssignment = EvaluationWbsAssignment = __decorate([
    (0, typeorm_1.Entity)('evaluation_wbs_assignment'),
    (0, typeorm_1.Index)(['periodId', 'employeeId']),
    (0, typeorm_1.Index)(['periodId', 'projectId']),
    (0, typeorm_1.Index)(['employeeId', 'wbsItemId']),
    (0, typeorm_1.Index)(['projectId', 'wbsItemId']),
    (0, typeorm_1.Index)(['assignedDate']),
    (0, typeorm_1.Index)(['periodId', 'projectId', 'displayOrder']),
    __metadata("design:paramtypes", [Object])
], EvaluationWbsAssignment);
//# sourceMappingURL=evaluation-wbs-assignment.entity.js.map