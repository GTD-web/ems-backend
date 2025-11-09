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
exports.GetFinalEvaluationsByEmployeeHandler = exports.GetFinalEvaluationsByEmployeeQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_evaluation_entity_1 = require("../../../../domain/core/final-evaluation/final-evaluation.entity");
const employee_entity_1 = require("../../../../domain/common/employee/employee.entity");
const evaluation_period_entity_1 = require("../../../../domain/core/evaluation-period/evaluation-period.entity");
class GetFinalEvaluationsByEmployeeQuery {
    employeeId;
    startDate;
    endDate;
    constructor(employeeId, startDate, endDate) {
        this.employeeId = employeeId;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
exports.GetFinalEvaluationsByEmployeeQuery = GetFinalEvaluationsByEmployeeQuery;
let GetFinalEvaluationsByEmployeeHandler = class GetFinalEvaluationsByEmployeeHandler {
    finalEvaluationRepository;
    employeeRepository;
    evaluationPeriodRepository;
    constructor(finalEvaluationRepository, employeeRepository, evaluationPeriodRepository) {
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.employeeRepository = employeeRepository;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
    }
    async execute(query) {
        const { employeeId, startDate, endDate } = query;
        const queryBuilder = this.finalEvaluationRepository
            .createQueryBuilder('finalEvaluation')
            .select([
            'finalEvaluation.id AS final_evaluation_id',
            'finalEvaluation.employeeId AS employee_id',
            'finalEvaluation.periodId AS period_id',
            'finalEvaluation.evaluationGrade AS evaluation_grade',
            'finalEvaluation.jobGrade AS job_grade',
            'finalEvaluation.jobDetailedGrade AS job_detailed_grade',
            'finalEvaluation.finalComments AS final_comments',
            'finalEvaluation.isConfirmed AS is_confirmed',
            'finalEvaluation.confirmedAt AS confirmed_at',
            'finalEvaluation.confirmedBy AS confirmed_by',
            'finalEvaluation.createdAt AS created_at',
            'finalEvaluation.updatedAt AS updated_at',
            'employee.id AS employee_id',
            'employee.name AS employee_name',
            'employee.employeeNumber AS employee_number',
            'employee.email AS employee_email',
            'employee.departmentName AS department_name',
            'employee.rankName AS rank_name',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_start_date',
            'period.endDate AS period_end_date',
        ])
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id::UUID = "finalEvaluation"."employeeId"::UUID AND employee.deletedAt IS NULL')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id::UUID = "finalEvaluation"."periodId"::UUID AND period.deletedAt IS NULL')
            .where('finalEvaluation.employeeId = :employeeId', { employeeId })
            .andWhere('finalEvaluation.deletedAt IS NULL');
        if (startDate) {
            queryBuilder.andWhere('period.startDate >= :startDate', { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere('period.startDate <= :endDate', { endDate });
        }
        queryBuilder.orderBy('period.startDate', 'DESC');
        const rawResults = await queryBuilder.getRawMany();
        return rawResults.map((row) => ({
            id: row.final_evaluation_id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            employeeNumber: row.employee_number,
            employeeEmail: row.employee_email,
            departmentName: row.department_name,
            rankName: row.rank_name,
            periodId: row.period_id,
            periodName: row.period_name,
            periodStartDate: row.period_start_date,
            periodEndDate: row.period_end_date,
            evaluationGrade: row.evaluation_grade,
            jobGrade: row.job_grade,
            jobDetailedGrade: row.job_detailed_grade,
            finalComments: row.final_comments,
            isConfirmed: row.is_confirmed,
            confirmedAt: row.confirmed_at,
            confirmedBy: row.confirmed_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }
};
exports.GetFinalEvaluationsByEmployeeHandler = GetFinalEvaluationsByEmployeeHandler;
exports.GetFinalEvaluationsByEmployeeHandler = GetFinalEvaluationsByEmployeeHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetFinalEvaluationsByEmployeeQuery),
    __param(0, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetFinalEvaluationsByEmployeeHandler);
//# sourceMappingURL=get-final-evaluations-by-employee.query.js.map