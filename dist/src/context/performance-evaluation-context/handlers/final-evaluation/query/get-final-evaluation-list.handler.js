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
var GetFinalEvaluationListHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFinalEvaluationListHandler = exports.GetFinalEvaluationListQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_evaluation_entity_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
class GetFinalEvaluationListQuery {
    employeeId;
    periodId;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    confirmedOnly;
    page;
    limit;
    constructor(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, confirmedOnly, page = 1, limit = 10) {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.evaluationGrade = evaluationGrade;
        this.jobGrade = jobGrade;
        this.jobDetailedGrade = jobDetailedGrade;
        this.confirmedOnly = confirmedOnly;
        this.page = page;
        this.limit = limit;
    }
}
exports.GetFinalEvaluationListQuery = GetFinalEvaluationListQuery;
let GetFinalEvaluationListHandler = GetFinalEvaluationListHandler_1 = class GetFinalEvaluationListHandler {
    finalEvaluationRepository;
    logger = new common_1.Logger(GetFinalEvaluationListHandler_1.name);
    constructor(finalEvaluationRepository) {
        this.finalEvaluationRepository = finalEvaluationRepository;
    }
    async execute(query) {
        const { employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, confirmedOnly, page, limit, } = query;
        this.logger.log('최종평가 목록 조회 핸들러 실행', {
            employeeId,
            periodId,
            confirmedOnly,
            page,
            limit,
        });
        const countQueryBuilder = this.finalEvaluationRepository
            .createQueryBuilder('evaluation')
            .where('evaluation.deletedAt IS NULL');
        const queryBuilder = this.finalEvaluationRepository
            .createQueryBuilder('evaluation')
            .select([
            'evaluation.id AS evaluation_id',
            'evaluation.evaluationGrade AS evaluation_evaluationgrade',
            'evaluation.jobGrade AS evaluation_jobgrade',
            'evaluation.jobDetailedGrade AS evaluation_jobdetailedgrade',
            'evaluation.finalComments AS evaluation_finalcomments',
            'evaluation.isConfirmed AS evaluation_isconfirmed',
            'evaluation.confirmedAt AS evaluation_confirmedat',
            'evaluation.confirmedBy AS evaluation_confirmedby',
            'evaluation.createdAt AS evaluation_createdat',
            'evaluation.updatedAt AS evaluation_updatedat',
            'employee.id AS employee_id',
            'employee.name AS employee_name',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.email AS employee_email',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.status AS period_status',
        ])
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id::UUID = evaluation."employeeId"::UUID AND employee.deletedAt IS NULL')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id::UUID = evaluation."periodId"::UUID AND period.deletedAt IS NULL')
            .where('evaluation.deletedAt IS NULL');
        if (employeeId) {
            queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
                employeeId,
            });
            countQueryBuilder.andWhere('evaluation.employeeId = :employeeId', {
                employeeId,
            });
        }
        if (periodId) {
            queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
            countQueryBuilder.andWhere('evaluation.periodId = :periodId', {
                periodId,
            });
        }
        if (evaluationGrade) {
            queryBuilder.andWhere('evaluation.evaluationGrade = :evaluationGrade', {
                evaluationGrade,
            });
            countQueryBuilder.andWhere('evaluation.evaluationGrade = :evaluationGrade', {
                evaluationGrade,
            });
        }
        if (jobGrade) {
            queryBuilder.andWhere('evaluation.jobGrade = :jobGrade', { jobGrade });
            countQueryBuilder.andWhere('evaluation.jobGrade = :jobGrade', {
                jobGrade,
            });
        }
        if (jobDetailedGrade) {
            queryBuilder.andWhere('evaluation.jobDetailedGrade = :jobDetailedGrade', {
                jobDetailedGrade,
            });
            countQueryBuilder.andWhere('evaluation.jobDetailedGrade = :jobDetailedGrade', {
                jobDetailedGrade,
            });
        }
        if (confirmedOnly) {
            queryBuilder.andWhere('evaluation.isConfirmed = :isConfirmed', {
                isConfirmed: true,
            });
            countQueryBuilder.andWhere('evaluation.isConfirmed = :isConfirmed', {
                isConfirmed: true,
            });
        }
        const total = await countQueryBuilder.getCount();
        queryBuilder.orderBy('evaluation.createdAt', 'DESC');
        if (page && limit) {
            const offset = (page - 1) * limit;
            queryBuilder.offset(offset).limit(limit);
        }
        const results = await queryBuilder.getRawMany();
        const evaluations = results.map((result) => ({
            id: result.evaluation_id,
            employee: {
                id: result.employee_id,
                name: result.employee_name,
                employeeNumber: result.employee_employeenumber,
                email: result.employee_email,
            },
            period: {
                id: result.period_id,
                name: result.period_name,
                startDate: result.period_startdate,
                status: result.period_status,
            },
            evaluationGrade: result.evaluation_evaluationgrade,
            jobGrade: result.evaluation_jobgrade,
            jobDetailedGrade: result.evaluation_jobdetailedgrade,
            finalComments: result.evaluation_finalcomments,
            isConfirmed: result.evaluation_isconfirmed,
            confirmedAt: result.evaluation_confirmedat,
            confirmedBy: result.evaluation_confirmedby,
            createdAt: result.evaluation_createdat,
            updatedAt: result.evaluation_updatedat,
        }));
        const result = {
            evaluations,
            total,
            page,
            limit,
        };
        this.logger.log('최종평가 목록 조회 완료', {
            total: result.total,
            count: result.evaluations.length,
        });
        return result;
    }
};
exports.GetFinalEvaluationListHandler = GetFinalEvaluationListHandler;
exports.GetFinalEvaluationListHandler = GetFinalEvaluationListHandler = GetFinalEvaluationListHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetFinalEvaluationListQuery),
    __param(0, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetFinalEvaluationListHandler);
//# sourceMappingURL=get-final-evaluation-list.handler.js.map