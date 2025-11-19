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
exports.SecondaryEvaluationStepApproval = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const employee_evaluation_step_approval_types_1 = require("../employee-evaluation-step-approval/employee-evaluation-step-approval.types");
let SecondaryEvaluationStepApproval = class SecondaryEvaluationStepApproval extends base_entity_1.BaseEntity {
    evaluationPeriodEmployeeMappingId;
    evaluatorId;
    status;
    approvedBy;
    approvedAt;
    revisionRequestId;
    constructor(data) {
        super();
        if (data) {
            this.evaluationPeriodEmployeeMappingId =
                data.evaluationPeriodEmployeeMappingId;
            this.evaluatorId = data.evaluatorId;
            this.status = data.status || employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
            this.approvedBy = data.approvedBy ?? null;
            this.approvedAt = data.approvedAt ?? null;
            this.revisionRequestId = data.revisionRequestId ?? null;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    승인한다(approvedBy) {
        this.status = employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED;
        this.approvedBy = approvedBy;
        this.approvedAt = new Date();
        this.메타데이터를_업데이트한다(approvedBy);
    }
    대기로_변경한다(updatedBy) {
        this.status = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
        this.approvedBy = null;
        this.approvedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    재작성요청상태로_변경한다(updatedBy, revisionRequestId) {
        this.status = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED;
        this.revisionRequestId = revisionRequestId;
        this.approvedBy = null;
        this.approvedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    재작성완료상태로_변경한다(updatedBy, revisionRequestId) {
        this.status = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED;
        if (revisionRequestId !== undefined) {
            this.revisionRequestId = revisionRequestId;
        }
        this.approvedBy = null;
        this.approvedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluationPeriodEmployeeMappingId: this.evaluationPeriodEmployeeMappingId,
            evaluatorId: this.evaluatorId,
            status: this.status,
            approvedBy: this.approvedBy,
            approvedAt: this.approvedAt,
            revisionRequestId: this.revisionRequestId,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
};
exports.SecondaryEvaluationStepApproval = SecondaryEvaluationStepApproval;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가기간-직원 맵핑 ID',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStepApproval.prototype, "evaluationPeriodEmployeeMappingId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '2차 평가자 ID',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStepApproval.prototype, "evaluatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_evaluation_step_approval_types_1.StepApprovalStatus,
        enumName: 'step_approval_status_enum',
        default: employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING,
        comment: '승인 상태',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStepApproval.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '승인자 ID',
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStepApproval.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '승인 일시',
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStepApproval.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '재작성 요청 ID',
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStepApproval.prototype, "revisionRequestId", void 0);
exports.SecondaryEvaluationStepApproval = SecondaryEvaluationStepApproval = __decorate([
    (0, typeorm_1.Entity)('secondary_evaluation_step_approval'),
    (0, typeorm_1.Index)(['evaluationPeriodEmployeeMappingId', 'evaluatorId'], {
        unique: true,
    }),
    __metadata("design:paramtypes", [Object])
], SecondaryEvaluationStepApproval);
//# sourceMappingURL=secondary-evaluation-step-approval.entity.js.map