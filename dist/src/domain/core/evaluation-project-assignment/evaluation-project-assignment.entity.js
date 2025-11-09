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
exports.EvaluationProjectAssignment = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let EvaluationProjectAssignment = class EvaluationProjectAssignment extends base_entity_1.BaseEntity {
    periodId;
    employeeId;
    projectId;
    assignedDate;
    assignedBy;
    displayOrder;
    constructor(data) {
        super();
        if (data) {
            this.periodId = data.periodId;
            this.employeeId = data.employeeId;
            this.projectId = data.projectId;
            this.assignedBy = data.assignedBy;
            this.assignedDate = new Date();
            this.displayOrder = data.displayOrder ?? 0;
            this.메타데이터를_업데이트한다(data.assignedBy);
        }
    }
    평가기간과_일치하는가(periodId) {
        return this.periodId === periodId;
    }
    해당_직원의_할당인가(employeeId) {
        return this.employeeId === employeeId;
    }
    해당_프로젝트_할당인가(projectId) {
        return this.projectId === projectId;
    }
    순서를_변경한다(newOrder) {
        if (newOrder < 0) {
            throw new Error('표시 순서는 0 이상이어야 합니다.');
        }
        this.displayOrder = newOrder;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            periodId: this.periodId,
            employeeId: this.employeeId,
            projectId: this.projectId,
            assignedDate: this.assignedDate,
            assignedBy: this.assignedBy,
            displayOrder: this.displayOrder,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            version: this.version,
        };
    }
};
exports.EvaluationProjectAssignment = EvaluationProjectAssignment;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 기간 ID',
    }),
    __metadata("design:type", String)
], EvaluationProjectAssignment.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '직원 ID',
    }),
    __metadata("design:type", String)
], EvaluationProjectAssignment.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '프로젝트 ID',
    }),
    __metadata("design:type", String)
], EvaluationProjectAssignment.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '할당일',
    }),
    __metadata("design:type", Date)
], EvaluationProjectAssignment.prototype, "assignedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '할당자 ID',
    }),
    __metadata("design:type", String)
], EvaluationProjectAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '표시 순서 (같은 직원-평가기간 내에서의 순서)',
        default: 0,
    }),
    __metadata("design:type", Number)
], EvaluationProjectAssignment.prototype, "displayOrder", void 0);
exports.EvaluationProjectAssignment = EvaluationProjectAssignment = __decorate([
    (0, typeorm_1.Entity)('evaluation_project_assignment'),
    (0, typeorm_1.Index)(['periodId', 'employeeId']),
    (0, typeorm_1.Index)(['periodId', 'projectId']),
    (0, typeorm_1.Index)(['employeeId', 'projectId']),
    (0, typeorm_1.Index)(['assignedDate']),
    (0, typeorm_1.Index)(['periodId', 'employeeId', 'displayOrder']),
    __metadata("design:paramtypes", [Object])
], EvaluationProjectAssignment);
//# sourceMappingURL=evaluation-project-assignment.entity.js.map