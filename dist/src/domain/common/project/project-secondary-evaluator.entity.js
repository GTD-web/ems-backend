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
var ProjectSecondaryEvaluator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSecondaryEvaluator = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let ProjectSecondaryEvaluator = ProjectSecondaryEvaluator_1 = class ProjectSecondaryEvaluator extends base_entity_1.BaseEntity {
    projectId;
    evaluatorId;
    static 생성한다(projectId, evaluatorId, createdBy) {
        const entity = new ProjectSecondaryEvaluator_1();
        entity.projectId = projectId;
        entity.evaluatorId = evaluatorId;
        entity.생성자를_설정한다(createdBy);
        return entity;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            projectId: this.projectId,
            evaluatorId: this.evaluatorId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            version: this.version,
        };
    }
};
exports.ProjectSecondaryEvaluator = ProjectSecondaryEvaluator;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '프로젝트 ID',
    }),
    __metadata("design:type", String)
], ProjectSecondaryEvaluator.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '2차 평가자 ID (직원 ID)',
    }),
    __metadata("design:type", String)
], ProjectSecondaryEvaluator.prototype, "evaluatorId", void 0);
exports.ProjectSecondaryEvaluator = ProjectSecondaryEvaluator = ProjectSecondaryEvaluator_1 = __decorate([
    (0, typeorm_1.Entity)('project_secondary_evaluator'),
    (0, typeorm_1.Index)(['projectId']),
    (0, typeorm_1.Index)(['evaluatorId']),
    (0, typeorm_1.Index)(['projectId', 'evaluatorId']),
    (0, typeorm_1.Unique)(['projectId', 'evaluatorId'])
], ProjectSecondaryEvaluator);
//# sourceMappingURL=project-secondary-evaluator.entity.js.map