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
var GetWbsEvaluationCriteriaDetailHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWbsEvaluationCriteriaDetailHandler = exports.GetWbsEvaluationCriteriaDetailQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_evaluation_criteria_entity_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
class GetWbsEvaluationCriteriaDetailQuery {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.GetWbsEvaluationCriteriaDetailQuery = GetWbsEvaluationCriteriaDetailQuery;
let GetWbsEvaluationCriteriaDetailHandler = GetWbsEvaluationCriteriaDetailHandler_1 = class GetWbsEvaluationCriteriaDetailHandler {
    wbsEvaluationCriteriaRepository;
    logger = new common_1.Logger(GetWbsEvaluationCriteriaDetailHandler_1.name);
    constructor(wbsEvaluationCriteriaRepository) {
        this.wbsEvaluationCriteriaRepository = wbsEvaluationCriteriaRepository;
    }
    async execute(query) {
        const { id } = query;
        this.logger.debug(`WBS 평가기준 상세 조회 시작 - ID: ${id}`);
        try {
            const result = await this.wbsEvaluationCriteriaRepository
                .createQueryBuilder('criteria')
                .leftJoin(wbs_item_entity_1.WbsItem, 'wbsItem', 'wbsItem.id = criteria.wbsItemId AND wbsItem.deletedAt IS NULL')
                .select([
                'criteria.id AS criteria_id',
                'criteria.wbsItemId AS criteria_wbsitemid',
                'criteria.criteria AS criteria_criteria',
                'criteria.importance AS criteria_importance',
                'criteria.createdAt AS criteria_createdat',
                'criteria.updatedAt AS criteria_updatedat',
                'wbsItem.id AS wbsitem_id',
                'wbsItem.wbsCode AS wbsitem_wbscode',
                'wbsItem.title AS wbsitem_title',
                'wbsItem.status AS wbsitem_status',
                'wbsItem.level AS wbsitem_level',
                'wbsItem.startDate AS wbsitem_startdate',
                'wbsItem.endDate AS wbsitem_enddate',
                'wbsItem.progressPercentage AS wbsitem_progresspercentage',
            ])
                .where('criteria.id = :id', { id })
                .andWhere('criteria.deletedAt IS NULL')
                .getRawOne();
            if (!result) {
                this.logger.warn(`WBS 평가기준을 찾을 수 없습니다 - ID: ${id}`);
                return null;
            }
            this.logger.debug(`WBS 평가기준 상세 조회 완료 - ID: ${id}`);
            return {
                id: result.criteria_id,
                criteria: result.criteria_criteria,
                importance: result.criteria_importance,
                createdAt: result.criteria_createdat,
                updatedAt: result.criteria_updatedat,
                wbsItem: result.wbsitem_id
                    ? {
                        id: result.wbsitem_id,
                        wbsCode: result.wbsitem_wbscode,
                        title: result.wbsitem_title,
                        status: result.wbsitem_status,
                        level: result.wbsitem_level,
                        startDate: result.wbsitem_startdate,
                        endDate: result.wbsitem_enddate,
                        progressPercentage: result.wbsitem_progresspercentage,
                    }
                    : null,
            };
        }
        catch (error) {
            this.logger.error(`WBS 평가기준 상세 조회 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
};
exports.GetWbsEvaluationCriteriaDetailHandler = GetWbsEvaluationCriteriaDetailHandler;
exports.GetWbsEvaluationCriteriaDetailHandler = GetWbsEvaluationCriteriaDetailHandler = GetWbsEvaluationCriteriaDetailHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsEvaluationCriteriaDetailQuery),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetWbsEvaluationCriteriaDetailHandler);
//# sourceMappingURL=get-wbs-evaluation-criteria-detail.handler.js.map