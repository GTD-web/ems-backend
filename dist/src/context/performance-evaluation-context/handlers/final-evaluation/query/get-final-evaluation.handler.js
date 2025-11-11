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
var GetFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFinalEvaluationHandler = exports.GetFinalEvaluationQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_evaluation_entity_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
class GetFinalEvaluationQuery {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.GetFinalEvaluationQuery = GetFinalEvaluationQuery;
let GetFinalEvaluationHandler = GetFinalEvaluationHandler_1 = class GetFinalEvaluationHandler {
    finalEvaluationRepository;
    logger = new common_1.Logger(GetFinalEvaluationHandler_1.name);
    constructor(finalEvaluationRepository) {
        this.finalEvaluationRepository = finalEvaluationRepository;
    }
    async execute(query) {
        const { id } = query;
        this.logger.log('최종평가 조회 핸들러 실행', { id });
        const result = await this.finalEvaluationRepository
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
            'evaluation.createdBy AS evaluation_createdby',
            'evaluation.updatedBy AS evaluation_updatedby',
            'evaluation.version AS evaluation_version',
            'employee.id AS employee_id',
            'employee.name AS employee_name',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.email AS employee_email',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.endDate AS period_enddate',
            'period.status AS period_status',
        ])
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id::UUID = evaluation."employeeId"::UUID AND employee.deletedAt IS NULL')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id::UUID = evaluation."periodId"::UUID AND period.deletedAt IS NULL')
            .where('evaluation.id = :id', { id })
            .andWhere('evaluation.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            throw new common_1.NotFoundException(`최종평가를 찾을 수 없습니다: ${id}`);
        }
        this.logger.log('최종평가 조회 완료', { id });
        return {
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
                endDate: result.period_enddate,
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
            createdBy: result.evaluation_createdby,
            updatedBy: result.evaluation_updatedby,
            version: result.evaluation_version,
        };
    }
};
exports.GetFinalEvaluationHandler = GetFinalEvaluationHandler;
exports.GetFinalEvaluationHandler = GetFinalEvaluationHandler = GetFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetFinalEvaluationQuery),
    __param(0, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetFinalEvaluationHandler);
//# sourceMappingURL=get-final-evaluation.handler.js.map