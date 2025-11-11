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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUtilsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const uuid_1 = require("uuid");
const decorators_1 = require("../../decorators");
const project_service_1 = require("../../../domain/common/project/project.service");
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const performance_evaluation_service_1 = require("../../../context/performance-evaluation-context/performance-evaluation.service");
const admin_utils_api_decorators_1 = require("./decorators/admin-utils-api.decorators");
let AdminUtilsController = class AdminUtilsController {
    projectService;
    evaluationCriteriaManagementService;
    performanceEvaluationService;
    constructor(projectService, evaluationCriteriaManagementService, performanceEvaluationService) {
        this.projectService = projectService;
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.performanceEvaluationService = performanceEvaluationService;
    }
    async getAllProjects() {
        return await this.projectService.전체_조회한다();
    }
    async resetAllWbsEvaluationCriteria(user) {
        const deletedBy = user.id;
        const success = await this.evaluationCriteriaManagementService.모든_WBS_평가기준을_삭제한다(deletedBy);
        return { success };
    }
    async resetAllDeliverables(user) {
        const deletedBy = user?.id || (0, uuid_1.v4)();
        const result = await this.performanceEvaluationService.모든_산출물을_삭제한다(deletedBy);
        return {
            successCount: result.successCount,
            failedCount: result.failedCount,
            failedIds: result.failedIds,
        };
    }
    async resetAllProjectAssignments(user) {
        const deletedBy = user.id;
        return await this.evaluationCriteriaManagementService.모든_프로젝트_할당을_삭제한다(deletedBy);
    }
    async resetAllEvaluationLines(user) {
        const deletedBy = user.id;
        return await this.evaluationCriteriaManagementService.모든_평가라인을_리셋한다(deletedBy);
    }
};
exports.AdminUtilsController = AdminUtilsController;
__decorate([
    (0, admin_utils_api_decorators_1.GetAllProjects)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUtilsController.prototype, "getAllProjects", null);
__decorate([
    (0, admin_utils_api_decorators_1.ResetAllWbsEvaluationCriteria)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminUtilsController.prototype, "resetAllWbsEvaluationCriteria", null);
__decorate([
    (0, admin_utils_api_decorators_1.ResetAllDeliverables)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminUtilsController.prototype, "resetAllDeliverables", null);
__decorate([
    (0, admin_utils_api_decorators_1.ResetAllProjectAssignments)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminUtilsController.prototype, "resetAllProjectAssignments", null);
__decorate([
    (0, admin_utils_api_decorators_1.ResetAllEvaluationLines)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminUtilsController.prototype, "resetAllEvaluationLines", null);
exports.AdminUtilsController = AdminUtilsController = __decorate([
    (0, swagger_1.ApiTags)('Z. 관리자 - 유틸리티'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/utils'),
    __metadata("design:paramtypes", [project_service_1.ProjectService,
        evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        performance_evaluation_service_1.PerformanceEvaluationService])
], AdminUtilsController);
//# sourceMappingURL=admin-utils.controller.js.map