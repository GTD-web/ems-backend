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
var GetWbsEvaluationCriteriaListHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWbsEvaluationCriteriaListHandler = exports.GetWbsEvaluationCriteriaListQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_evaluation_criteria_entity_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_types_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.types");
class GetWbsEvaluationCriteriaListQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetWbsEvaluationCriteriaListQuery = GetWbsEvaluationCriteriaListQuery;
let GetWbsEvaluationCriteriaListHandler = GetWbsEvaluationCriteriaListHandler_1 = class GetWbsEvaluationCriteriaListHandler {
    wbsEvaluationCriteriaRepository;
    evaluationPeriodRepository;
    logger = new common_1.Logger(GetWbsEvaluationCriteriaListHandler_1.name);
    constructor(wbsEvaluationCriteriaRepository, evaluationPeriodRepository) {
        this.wbsEvaluationCriteriaRepository = wbsEvaluationCriteriaRepository;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
    }
    async execute(query) {
        const { filter } = query;
        this.logger.debug(`WBS 평가기준 목록 조회 시작 - 필터: ${JSON.stringify(filter)}`);
        try {
            let queryBuilder = this.wbsEvaluationCriteriaRepository.createQueryBuilder('criteria');
            if (filter.wbsItemId) {
                queryBuilder.andWhere('criteria.wbsItemId = :wbsItemId', {
                    wbsItemId: filter.wbsItemId,
                });
            }
            if (filter.criteriaSearch) {
                queryBuilder.andWhere('criteria.criteria LIKE :criteriaSearch', {
                    criteriaSearch: `%${filter.criteriaSearch}%`,
                });
            }
            if (filter.criteriaExact) {
                queryBuilder.andWhere('TRIM(criteria.criteria) = :criteriaExact', {
                    criteriaExact: filter.criteriaExact.trim(),
                });
            }
            queryBuilder.orderBy('criteria.createdAt', 'DESC');
            const criteriaList = await queryBuilder.getMany();
            const criteria = criteriaList.map((criteria) => criteria.DTO로_변환한다());
            const activeEvaluationPeriod = await this.evaluationPeriodRepository.findOne({
                where: {
                    status: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
                order: {
                    createdAt: 'DESC',
                },
            });
            const evaluationPeriodSettings = {
                criteriaSettingEnabled: activeEvaluationPeriod?.criteriaSettingEnabled ?? false,
                selfEvaluationSettingEnabled: activeEvaluationPeriod?.selfEvaluationSettingEnabled ?? false,
                finalEvaluationSettingEnabled: activeEvaluationPeriod?.finalEvaluationSettingEnabled ?? false,
            };
            this.logger.debug(`WBS 평가기준 목록 조회 완료 - 조회된 개수: ${criteriaList.length}, 평가기간 설정: ${JSON.stringify(evaluationPeriodSettings)}`);
            return {
                criteria,
                evaluationPeriodSettings,
            };
        }
        catch (error) {
            this.logger.error(`WBS 평가기준 목록 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
};
exports.GetWbsEvaluationCriteriaListHandler = GetWbsEvaluationCriteriaListHandler;
exports.GetWbsEvaluationCriteriaListHandler = GetWbsEvaluationCriteriaListHandler = GetWbsEvaluationCriteriaListHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsEvaluationCriteriaListQuery),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetWbsEvaluationCriteriaListHandler);
//# sourceMappingURL=get-wbs-evaluation-criteria-list.handler.js.map