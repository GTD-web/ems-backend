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
var GetEmployeeSelfEvaluationsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmployeeSelfEvaluationsHandler = exports.GetEmployeeSelfEvaluationsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
class GetEmployeeSelfEvaluationsQuery {
    employeeId;
    periodId;
    projectId;
    page;
    limit;
    constructor(employeeId, periodId, projectId, page = 1, limit = 10) {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.projectId = projectId;
        this.page = page;
        this.limit = limit;
    }
}
exports.GetEmployeeSelfEvaluationsQuery = GetEmployeeSelfEvaluationsQuery;
let GetEmployeeSelfEvaluationsHandler = GetEmployeeSelfEvaluationsHandler_1 = class GetEmployeeSelfEvaluationsHandler {
    wbsSelfEvaluationRepository;
    logger = new common_1.Logger(GetEmployeeSelfEvaluationsHandler_1.name);
    constructor(wbsSelfEvaluationRepository) {
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
    }
    async execute(query) {
        const { employeeId, periodId, projectId, page, limit } = query;
        this.logger.log('직원 자기평가 목록 조회 핸들러 실행', {
            employeeId,
            periodId,
            projectId,
            page,
            limit,
        });
        const queryBuilder = this.wbsSelfEvaluationRepository
            .createQueryBuilder('evaluation')
            .where('evaluation.employeeId = :employeeId', { employeeId })
            .andWhere('evaluation.deletedAt IS NULL');
        if (periodId) {
            queryBuilder.andWhere('evaluation.periodId = :periodId', {
                periodId,
            });
        }
        queryBuilder.orderBy('evaluation.evaluationDate', 'DESC');
        const total = await queryBuilder.getCount();
        if (page && limit) {
            const offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);
        }
        const evaluations = await queryBuilder.getMany();
        const result = {
            evaluations: evaluations.map((evaluation) => evaluation.DTO로_변환한다()),
            total,
            page,
            limit,
        };
        this.logger.log('직원 자기평가 목록 조회 완료', {
            total: result.total,
            count: result.evaluations.length,
        });
        return result;
    }
};
exports.GetEmployeeSelfEvaluationsHandler = GetEmployeeSelfEvaluationsHandler;
exports.GetEmployeeSelfEvaluationsHandler = GetEmployeeSelfEvaluationsHandler = GetEmployeeSelfEvaluationsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEmployeeSelfEvaluationsQuery),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetEmployeeSelfEvaluationsHandler);
//# sourceMappingURL=get-employee-self-evaluations.handler.js.map