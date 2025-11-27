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
exports.EvaluationPeriodEmployeeMapping = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let EvaluationPeriodEmployeeMapping = class EvaluationPeriodEmployeeMapping extends base_entity_1.BaseEntity {
    evaluationPeriodId;
    employeeId;
    isExcluded;
    excludeReason;
    excludedBy;
    excludedAt;
    isCriteriaSubmitted;
    criteriaSubmittedAt;
    criteriaSubmittedBy;
    isNewEnrolled;
    constructor(data) {
        super();
        if (data) {
            this.evaluationPeriodId = data.evaluationPeriodId;
            this.employeeId = data.employeeId;
            this.isExcluded = false;
            this.excludeReason = null;
            this.excludedBy = null;
            this.excludedAt = null;
            this.isCriteriaSubmitted = false;
            this.criteriaSubmittedAt = null;
            this.criteriaSubmittedBy = null;
            this.isNewEnrolled = true;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    해당_평가기간의_맵핑인가(evaluationPeriodId) {
        return this.evaluationPeriodId === evaluationPeriodId;
    }
    해당_직원의_맵핑인가(employeeId) {
        return this.employeeId === employeeId;
    }
    제외되었는가() {
        return this.isExcluded;
    }
    평가대상인가() {
        return !this.isExcluded && !this.삭제되었는가();
    }
    평가대상에서_제외한다(excludeReason, excludedBy) {
        this.isExcluded = true;
        this.excludeReason = excludeReason;
        this.excludedBy = excludedBy;
        this.excludedAt = new Date();
        this.메타데이터를_업데이트한다(excludedBy);
    }
    평가대상에_포함한다(updatedBy) {
        this.isExcluded = false;
        this.excludeReason = null;
        this.excludedBy = null;
        this.excludedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    제외사유를_수정한다(excludeReason, updatedBy) {
        if (!this.isExcluded) {
            throw new Error('제외되지 않은 대상의 제외 사유를 수정할 수 없습니다.');
        }
        this.excludeReason = excludeReason;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    평가기준을_제출한다(submittedBy) {
        this.isCriteriaSubmitted = true;
        this.criteriaSubmittedAt = new Date();
        this.criteriaSubmittedBy = submittedBy;
        this.메타데이터를_업데이트한다(submittedBy);
    }
    평가기준_제출을_초기화한다(updatedBy) {
        this.isCriteriaSubmitted = false;
        this.criteriaSubmittedAt = null;
        this.criteriaSubmittedBy = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    평가기준이_제출되었는가() {
        return this.isCriteriaSubmitted;
    }
    삭제한다() {
        this.deletedAt = new Date();
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluationPeriodId: this.evaluationPeriodId,
            employeeId: this.employeeId,
            isExcluded: this.isExcluded,
            excludeReason: this.excludeReason,
            excludedBy: this.excludedBy,
            excludedAt: this.excludedAt,
            isCriteriaSubmitted: this.isCriteriaSubmitted,
            criteriaSubmittedAt: this.criteriaSubmittedAt,
            criteriaSubmittedBy: this.criteriaSubmittedBy,
            isNewEnrolled: this.isNewEnrolled,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
};
exports.EvaluationPeriodEmployeeMapping = EvaluationPeriodEmployeeMapping;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가기간 ID',
    }),
    __metadata("design:type", String)
], EvaluationPeriodEmployeeMapping.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '직원 ID',
    }),
    __metadata("design:type", String)
], EvaluationPeriodEmployeeMapping.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '평가 대상 제외 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodEmployeeMapping.prototype, "isExcluded", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 500,
        nullable: true,
        comment: '평가 대상 제외 사유',
    }),
    __metadata("design:type", Object)
], EvaluationPeriodEmployeeMapping.prototype, "excludeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '제외 처리자 ID',
    }),
    __metadata("design:type", Object)
], EvaluationPeriodEmployeeMapping.prototype, "excludedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '제외 처리 일시',
    }),
    __metadata("design:type", Object)
], EvaluationPeriodEmployeeMapping.prototype, "excludedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '평가기준 제출 여부',
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodEmployeeMapping.prototype, "isCriteriaSubmitted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '평가기준 제출 일시',
    }),
    __metadata("design:type", Object)
], EvaluationPeriodEmployeeMapping.prototype, "criteriaSubmittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '평가기준 제출 처리자 ID',
    }),
    __metadata("design:type", Object)
], EvaluationPeriodEmployeeMapping.prototype, "criteriaSubmittedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '신규 등록 여부 (등록 후 24시간 이내)',
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodEmployeeMapping.prototype, "isNewEnrolled", void 0);
exports.EvaluationPeriodEmployeeMapping = EvaluationPeriodEmployeeMapping = __decorate([
    (0, typeorm_1.Entity)('evaluation_period_employee_mapping'),
    (0, typeorm_1.Index)(['evaluationPeriodId']),
    (0, typeorm_1.Index)(['employeeId']),
    (0, typeorm_1.Index)(['isExcluded']),
    (0, typeorm_1.Index)(['evaluationPeriodId', 'employeeId']),
    (0, typeorm_1.Unique)(['evaluationPeriodId', 'employeeId']),
    __metadata("design:paramtypes", [Object])
], EvaluationPeriodEmployeeMapping);
//# sourceMappingURL=evaluation-period-employee-mapping.entity.js.map