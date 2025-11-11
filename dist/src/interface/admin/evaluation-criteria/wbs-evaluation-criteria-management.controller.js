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
exports.WbsEvaluationCriteriaManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const wbs_evaluation_criteria_api_decorators_1 = require("./decorators/wbs-evaluation-criteria-api.decorators");
const wbs_evaluation_criteria_dto_1 = require("./dto/wbs-evaluation-criteria.dto");
const decorators_1 = require("../../decorators");
let WbsEvaluationCriteriaManagementController = class WbsEvaluationCriteriaManagementController {
    evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
    }
    async getWbsEvaluationCriteriaList(filter) {
        return await this.evaluationCriteriaManagementService.WBS_평가기준_목록을_조회한다({
            wbsItemId: filter.wbsItemId,
            criteriaSearch: filter.criteriaSearch,
            criteriaExact: filter.criteriaExact,
        });
    }
    async getWbsEvaluationCriteriaDetail(id) {
        return await this.evaluationCriteriaManagementService.WBS_평가기준_상세를_조회한다(id);
    }
    async getWbsItemEvaluationCriteria(wbsItemId) {
        const criteria = await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(wbsItemId);
        return {
            wbsItemId,
            criteria,
        };
    }
    async upsertWbsEvaluationCriteria(wbsItemId, dto, user) {
        const actionBy = user.id;
        return await this.evaluationCriteriaManagementService.WBS_평가기준을_저장한다(wbsItemId, dto.criteria, dto.importance, actionBy);
    }
    async deleteWbsEvaluationCriteria(id, user) {
        const deletedBy = user.id;
        const success = await this.evaluationCriteriaManagementService.WBS_평가기준을_삭제한다(id, deletedBy);
        return { success };
    }
    async deleteWbsItemEvaluationCriteria(wbsItemId, user) {
        const deletedBy = user.id;
        const success = await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(wbsItemId, deletedBy);
        return { success };
    }
};
exports.WbsEvaluationCriteriaManagementController = WbsEvaluationCriteriaManagementController;
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.GetWbsEvaluationCriteriaList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_dto_1.WbsEvaluationCriteriaFilterDto]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "getWbsEvaluationCriteriaList", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.GetWbsEvaluationCriteriaDetail)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "getWbsEvaluationCriteriaDetail", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.GetWbsItemEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "getWbsItemEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.UpsertWbsEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_evaluation_criteria_dto_1.UpsertWbsEvaluationCriteriaBodyDto, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "upsertWbsEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.DeleteWbsEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "deleteWbsEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.DeleteWbsItemEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "deleteWbsItemEvaluationCriteria", null);
exports.WbsEvaluationCriteriaManagementController = WbsEvaluationCriteriaManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-3. 관리자 - 평가 설정 - WBS 평가기준'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/evaluation-criteria/wbs-evaluation-criteria'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService])
], WbsEvaluationCriteriaManagementController);
//# sourceMappingURL=wbs-evaluation-criteria-management.controller.js.map