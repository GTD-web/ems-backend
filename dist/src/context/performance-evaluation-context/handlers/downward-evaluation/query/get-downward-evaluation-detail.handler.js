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
var GetDownwardEvaluationDetailHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDownwardEvaluationDetailHandler = exports.GetDownwardEvaluationDetailQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_exceptions_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.exceptions");
class GetDownwardEvaluationDetailQuery {
    evaluationId;
    constructor(evaluationId) {
        this.evaluationId = evaluationId;
    }
}
exports.GetDownwardEvaluationDetailQuery = GetDownwardEvaluationDetailQuery;
let GetDownwardEvaluationDetailHandler = GetDownwardEvaluationDetailHandler_1 = class GetDownwardEvaluationDetailHandler {
    downwardEvaluationRepository;
    logger = new common_1.Logger(GetDownwardEvaluationDetailHandler_1.name);
    constructor(downwardEvaluationRepository) {
        this.downwardEvaluationRepository = downwardEvaluationRepository;
    }
    async execute(query) {
        const { evaluationId } = query;
        this.logger.log('하향평가 상세정보 조회 핸들러 실행', { evaluationId });
        const result = await this.downwardEvaluationRepository
            .createQueryBuilder('evaluation')
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = evaluation.employeeId AND employee.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'evaluator', 'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL')
            .leftJoin(wbs_item_entity_1.WbsItem, 'wbsItem', 'wbsItem.id = evaluation.wbsId AND wbsItem.deletedAt IS NULL')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = evaluation.periodId AND period.deletedAt IS NULL')
            .leftJoin(wbs_self_evaluation_entity_1.WbsSelfEvaluation, 'selfEvaluation', 'selfEvaluation.id = evaluation.selfEvaluationId AND selfEvaluation.deletedAt IS NULL')
            .select([
            'evaluation.id AS evaluation_id',
            'evaluation.employeeId AS evaluation_employeeid',
            'evaluation.evaluatorId AS evaluation_evaluatorid',
            'evaluation.wbsId AS evaluation_wbsid',
            'evaluation.periodId AS evaluation_periodid',
            'evaluation.selfEvaluationId AS evaluation_selfevaluationid',
            'evaluation.evaluationDate AS evaluation_evaluationdate',
            'evaluation.downwardEvaluationContent AS evaluation_downwardevaluationcontent',
            'evaluation.downwardEvaluationScore AS evaluation_downwardevaluationscore',
            'evaluation.evaluationType AS evaluation_evaluationtype',
            'evaluation.isCompleted AS evaluation_iscompleted',
            'evaluation.completedAt AS evaluation_completedat',
            'evaluation.createdAt AS evaluation_createdat',
            'evaluation.updatedAt AS evaluation_updatedat',
            'evaluation.deletedAt AS evaluation_deletedat',
            'evaluation.createdBy AS evaluation_createdby',
            'evaluation.updatedBy AS evaluation_updatedby',
            'evaluation.version AS evaluation_version',
            'employee.id AS employee_id',
            'employee.name AS employee_name',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.email AS employee_email',
            'employee.departmentId AS employee_departmentid',
            'employee.status AS employee_status',
            'evaluator.id AS evaluator_id',
            'evaluator.name AS evaluator_name',
            'evaluator.employeeNumber AS evaluator_employeenumber',
            'evaluator.email AS evaluator_email',
            'evaluator.departmentId AS evaluator_departmentid',
            'evaluator.status AS evaluator_status',
            'wbsItem.id AS wbsitem_id',
            'wbsItem.title AS wbsitem_title',
            'wbsItem.wbsCode AS wbsitem_wbscode',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.endDate AS period_enddate',
            'period.status AS period_status',
            'selfEvaluation.id AS selfevaluation_id',
            'selfEvaluation.wbsItemId AS selfevaluation_wbsitemid',
            'selfEvaluation.performanceResult AS selfevaluation_performanceresult',
            'selfEvaluation.selfEvaluationContent AS selfevaluation_selfevaluationcontent',
            'selfEvaluation.selfEvaluationScore AS selfevaluation_selfevaluationscore',
            'selfEvaluation.isCompleted AS selfevaluation_iscompleted',
            'selfEvaluation.completedAt AS selfevaluation_completedat',
            'selfEvaluation.evaluationDate AS selfevaluation_evaluationdate',
        ])
            .where('evaluation.id = :evaluationId', { evaluationId })
            .andWhere('evaluation.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(evaluationId);
        }
        this.logger.log('하향평가 상세정보 조회 완료', { evaluationId });
        return {
            id: result.evaluation_id,
            evaluationDate: result.evaluation_evaluationdate,
            downwardEvaluationContent: result.evaluation_downwardevaluationcontent,
            downwardEvaluationScore: result.evaluation_downwardevaluationscore,
            evaluationType: result.evaluation_evaluationtype,
            isCompleted: result.evaluation_iscompleted,
            completedAt: result.evaluation_completedat,
            createdAt: result.evaluation_createdat,
            updatedAt: result.evaluation_updatedat,
            deletedAt: result.evaluation_deletedat,
            createdBy: result.evaluation_createdby,
            updatedBy: result.evaluation_updatedby,
            version: result.evaluation_version,
            employee: result.employee_id
                ? {
                    id: result.employee_id,
                    name: result.employee_name,
                    employeeNumber: result.employee_employeenumber,
                    email: result.employee_email,
                    departmentId: result.employee_departmentid,
                    status: result.employee_status,
                }
                : null,
            evaluator: result.evaluator_id
                ? {
                    id: result.evaluator_id,
                    name: result.evaluator_name,
                    employeeNumber: result.evaluator_employeenumber,
                    email: result.evaluator_email,
                    departmentId: result.evaluator_departmentid,
                    status: result.evaluator_status,
                }
                : null,
            wbsItem: result.wbsitem_id
                ? {
                    id: result.wbsitem_id,
                    title: result.wbsitem_title,
                    wbsCode: result.wbsitem_wbscode,
                }
                : null,
            period: result.period_id
                ? {
                    id: result.period_id,
                    name: result.period_name,
                    startDate: result.period_startdate,
                    endDate: result.period_enddate,
                    status: result.period_status,
                }
                : null,
            selfEvaluation: result.selfevaluation_id
                ? {
                    id: result.selfevaluation_id,
                    wbsItemId: result.selfevaluation_wbsitemid,
                    performanceResult: result.selfevaluation_performanceresult,
                    selfEvaluationContent: result.selfevaluation_selfevaluationcontent,
                    selfEvaluationScore: result.selfevaluation_selfevaluationscore,
                    isCompleted: result.selfevaluation_iscompleted,
                    completedAt: result.selfevaluation_completedat,
                    evaluationDate: result.selfevaluation_evaluationdate,
                }
                : null,
        };
    }
};
exports.GetDownwardEvaluationDetailHandler = GetDownwardEvaluationDetailHandler;
exports.GetDownwardEvaluationDetailHandler = GetDownwardEvaluationDetailHandler = GetDownwardEvaluationDetailHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetDownwardEvaluationDetailQuery),
    __param(0, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetDownwardEvaluationDetailHandler);
//# sourceMappingURL=get-downward-evaluation-detail.handler.js.map