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
var GetEvaluationLineListHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationLineListHandler = exports.GetEvaluationLineListQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
class GetEvaluationLineListQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetEvaluationLineListQuery = GetEvaluationLineListQuery;
let GetEvaluationLineListHandler = GetEvaluationLineListHandler_1 = class GetEvaluationLineListHandler {
    evaluationLineRepository;
    logger = new common_1.Logger(GetEvaluationLineListHandler_1.name);
    constructor(evaluationLineRepository) {
        this.evaluationLineRepository = evaluationLineRepository;
    }
    async execute(query) {
        const { filter } = query;
        this.logger.debug(`평가라인 목록 조회 시작 - 필터: ${JSON.stringify(filter)}`);
        try {
            let queryBuilder = this.evaluationLineRepository.createQueryBuilder('evaluationLine');
            if (filter.evaluatorType) {
                queryBuilder.andWhere('evaluationLine.evaluatorType = :evaluatorType', {
                    evaluatorType: filter.evaluatorType,
                });
            }
            if (filter.requiredOnly) {
                queryBuilder.andWhere('evaluationLine.isRequired = :isRequired', {
                    isRequired: true,
                });
            }
            if (filter.autoAssignedOnly) {
                queryBuilder.andWhere('evaluationLine.isAutoAssigned = :isAutoAssigned', {
                    isAutoAssigned: true,
                });
            }
            if (filter.orderFrom !== undefined) {
                queryBuilder.andWhere('evaluationLine.order >= :orderFrom', {
                    orderFrom: filter.orderFrom,
                });
            }
            if (filter.orderTo !== undefined) {
                queryBuilder.andWhere('evaluationLine.order <= :orderTo', {
                    orderTo: filter.orderTo,
                });
            }
            queryBuilder.orderBy('evaluationLine.order', 'ASC');
            const evaluationLines = await queryBuilder.getMany();
            const result = evaluationLines.map((line) => line.DTO로_변환한다());
            this.logger.debug(`평가라인 목록 조회 완료 - 조회된 개수: ${evaluationLines.length}`);
            return result;
        }
        catch (error) {
            this.logger.error(`평가라인 목록 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
};
exports.GetEvaluationLineListHandler = GetEvaluationLineListHandler;
exports.GetEvaluationLineListHandler = GetEvaluationLineListHandler = GetEvaluationLineListHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetEvaluationLineListQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetEvaluationLineListHandler);
//# sourceMappingURL=get-evaluation-line-list.handler.js.map