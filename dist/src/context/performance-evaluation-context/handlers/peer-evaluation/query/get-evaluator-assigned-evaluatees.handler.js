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
var GetEvaluatorAssignedEvaluateesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluatorAssignedEvaluateesHandler = exports.GetEvaluatorAssignedEvaluateesQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const peer_evaluation_entity_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
class GetEvaluatorAssignedEvaluateesQuery {
    evaluatorId;
    periodId;
    includeCompleted;
    constructor(evaluatorId, periodId, includeCompleted = false) {
        this.evaluatorId = evaluatorId;
        this.periodId = periodId;
        this.includeCompleted = includeCompleted;
    }
}
exports.GetEvaluatorAssignedEvaluateesQuery = GetEvaluatorAssignedEvaluateesQuery;
let GetEvaluatorAssignedEvaluateesHandler = GetEvaluatorAssignedEvaluateesHandler_1 = class GetEvaluatorAssignedEvaluateesHandler {
    peerEvaluationRepository;
    logger = new common_1.Logger(GetEvaluatorAssignedEvaluateesHandler_1.name);
    constructor(peerEvaluationRepository) {
        this.peerEvaluationRepository = peerEvaluationRepository;
    }
    async execute(query) {
        const { evaluatorId, periodId, includeCompleted } = query;
        this.logger.log('평가자에게 할당된 피평가자 목록 조회 시작', {
            evaluatorId,
            periodId,
            includeCompleted,
        });
        const queryBuilder = this.peerEvaluationRepository
            .createQueryBuilder('evaluation')
            .leftJoin(employee_entity_1.Employee, 'evaluatee', 'evaluatee.id = evaluation.evaluateeId AND evaluatee.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'evaluateeDepartment', '"evaluateeDepartment"."externalId" = "evaluatee"."departmentId" AND "evaluateeDepartment"."deletedAt" IS NULL')
            .leftJoin(employee_entity_1.Employee, 'mappedBy', 'mappedBy.id = evaluation.mappedBy AND mappedBy.deletedAt IS NULL')
            .select([
            'evaluation.id AS evaluation_id',
            'evaluation.evaluateeId AS evaluation_evaluateeid',
            'evaluation.periodId AS evaluation_periodid',
            'evaluation.status AS evaluation_status',
            'evaluation.isCompleted AS evaluation_iscompleted',
            'evaluation.completedAt AS evaluation_completedat',
            'evaluation.requestDeadline AS evaluation_requestdeadline',
            'evaluation.mappedDate AS evaluation_mappeddate',
            'evaluation.isActive AS evaluation_isactive',
            'evaluatee.id AS evaluatee_id',
            'evaluatee.name AS evaluatee_name',
            'evaluatee.employeeNumber AS evaluatee_employeenumber',
            'evaluatee.email AS evaluatee_email',
            'evaluatee.departmentId AS evaluatee_departmentid',
            'evaluatee.status AS evaluatee_status',
            'evaluateeDepartment.id AS evaluateedepartment_id',
            'evaluateeDepartment.name AS evaluateedepartment_name',
            'evaluateeDepartment.code AS evaluateedepartment_code',
            'mappedBy.id AS mappedby_id',
            'mappedBy.name AS mappedby_name',
            'mappedBy.employeeNumber AS mappedby_employeenumber',
            'mappedBy.email AS mappedby_email',
            'mappedBy.departmentId AS mappedby_departmentid',
            'mappedBy.status AS mappedby_status',
        ])
            .where('evaluation.evaluatorId = :evaluatorId', { evaluatorId })
            .andWhere('evaluation.deletedAt IS NULL')
            .andWhere('evaluation.isActive = :isActive', { isActive: true });
        if (periodId) {
            queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
        }
        if (!includeCompleted) {
            queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
                isCompleted: false,
            });
        }
        queryBuilder
            .orderBy('evaluation.isCompleted', 'ASC')
            .addOrderBy('evaluation.mappedDate', 'DESC');
        const results = await queryBuilder.getRawMany();
        this.logger.log('평가자에게 할당된 피평가자 목록 조회 완료', {
            count: results.length,
        });
        return results.map((result) => ({
            evaluationId: result.evaluation_id,
            evaluateeId: result.evaluation_evaluateeid,
            periodId: result.evaluation_periodid,
            status: result.evaluation_status,
            isCompleted: result.evaluation_iscompleted,
            completedAt: result.evaluation_completedat,
            requestDeadline: result.evaluation_requestdeadline,
            mappedDate: result.evaluation_mappeddate,
            isActive: result.evaluation_isactive,
            evaluatee: result.evaluatee_id
                ? {
                    id: result.evaluatee_id,
                    name: result.evaluatee_name,
                    employeeNumber: result.evaluatee_employeenumber,
                    email: result.evaluatee_email,
                    departmentId: result.evaluatee_departmentid,
                    status: result.evaluatee_status,
                }
                : null,
            evaluateeDepartment: result.evaluateedepartment_id
                ? {
                    id: result.evaluateedepartment_id,
                    name: result.evaluateedepartment_name,
                    code: result.evaluateedepartment_code,
                }
                : null,
            mappedBy: result.mappedby_id
                ? {
                    id: result.mappedby_id,
                    name: result.mappedby_name,
                    employeeNumber: result.mappedby_employeenumber,
                    email: result.mappedby_email,
                    departmentId: result.mappedby_departmentid,
                    status: result.mappedby_status,
                }
                : null,
        }));
    }
};
exports.GetEvaluatorAssignedEvaluateesHandler = GetEvaluatorAssignedEvaluateesHandler;
exports.GetEvaluatorAssignedEvaluateesHandler = GetEvaluatorAssignedEvaluateesHandler = GetEvaluatorAssignedEvaluateesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluatorAssignedEvaluateesQuery),
    __param(0, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetEvaluatorAssignedEvaluateesHandler);
//# sourceMappingURL=get-evaluator-assigned-evaluatees.handler.js.map