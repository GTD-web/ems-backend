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
exports.EvaluationActivityLog = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let EvaluationActivityLog = class EvaluationActivityLog extends base_entity_1.BaseEntity {
    periodId;
    employeeId;
    activityType;
    activityAction;
    activityTitle;
    activityDescription;
    relatedEntityType;
    relatedEntityId;
    performedBy;
    performedByName;
    activityMetadata;
    activityDate;
    constructor(data) {
        super();
        if (data) {
            this.periodId = data.periodId;
            this.employeeId = data.employeeId;
            this.activityType = data.activityType;
            this.activityAction = data.activityAction;
            this.activityTitle = data.activityTitle;
            this.activityDescription = data.activityDescription;
            this.relatedEntityType = data.relatedEntityType;
            this.relatedEntityId = data.relatedEntityId;
            this.performedBy = data.performedBy;
            this.performedByName = data.performedByName;
            this.activityMetadata = data.activityMetadata;
            this.activityDate = data.activityDate || new Date();
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            periodId: this.periodId,
            employeeId: this.employeeId,
            activityType: this.activityType,
            activityAction: this.activityAction,
            activityTitle: this.activityTitle,
            activityDescription: this.activityDescription,
            relatedEntityType: this.relatedEntityType,
            relatedEntityId: this.relatedEntityId,
            performedBy: this.performedBy,
            performedByName: this.performedByName,
            activityMetadata: this.activityMetadata,
            activityDate: this.activityDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            version: this.version,
        };
    }
};
exports.EvaluationActivityLog = EvaluationActivityLog;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 기간 ID',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '피평가자 ID',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        comment: '활동 유형',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "activityType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        comment: '활동 액션',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "activityAction", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '활동 제목',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "activityTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '활동 설명',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "activityDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '관련 엔티티 유형',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "relatedEntityType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '관련 엔티티 ID',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "relatedEntityId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '활동 수행자 ID',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '활동 수행자 이름',
    }),
    __metadata("design:type", String)
], EvaluationActivityLog.prototype, "performedByName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: '활동 메타데이터',
    }),
    __metadata("design:type", Object)
], EvaluationActivityLog.prototype, "activityMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP',
        comment: '활동 일시',
    }),
    __metadata("design:type", Date)
], EvaluationActivityLog.prototype, "activityDate", void 0);
exports.EvaluationActivityLog = EvaluationActivityLog = __decorate([
    (0, typeorm_1.Entity)('evaluation_activity_log'),
    (0, typeorm_1.Index)(['periodId', 'employeeId']),
    (0, typeorm_1.Index)(['activityType']),
    (0, typeorm_1.Index)(['activityDate']),
    (0, typeorm_1.Index)(['performedBy']),
    __metadata("design:paramtypes", [Object])
], EvaluationActivityLog);
//# sourceMappingURL=evaluation-activity-log.entity.js.map