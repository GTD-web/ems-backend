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
var GetPeerEvaluationDetailHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPeerEvaluationDetailHandler = exports.GetPeerEvaluationDetailQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const peer_evaluation_entity_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const peer_evaluation_question_mapping_entity_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity");
const evaluation_question_entity_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.entity");
class GetPeerEvaluationDetailQuery {
    evaluationId;
    constructor(evaluationId) {
        this.evaluationId = evaluationId;
    }
}
exports.GetPeerEvaluationDetailQuery = GetPeerEvaluationDetailQuery;
let GetPeerEvaluationDetailHandler = GetPeerEvaluationDetailHandler_1 = class GetPeerEvaluationDetailHandler {
    peerEvaluationRepository;
    questionMappingRepository;
    logger = new common_1.Logger(GetPeerEvaluationDetailHandler_1.name);
    constructor(peerEvaluationRepository, questionMappingRepository) {
        this.peerEvaluationRepository = peerEvaluationRepository;
        this.questionMappingRepository = questionMappingRepository;
    }
    async execute(query) {
        const { evaluationId } = query;
        this.logger.log('동료평가 상세정보 조회 핸들러 실행', { evaluationId });
        const result = await this.peerEvaluationRepository
            .createQueryBuilder('evaluation')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = evaluation.periodId AND period.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'evaluator', 'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'evaluatorDepartment', 'evaluatorDepartment.externalId = evaluator.departmentId AND evaluatorDepartment.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'evaluatee', 'evaluatee.id = evaluation.evaluateeId AND evaluatee.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'evaluateeDepartment', 'evaluateeDepartment.externalId = evaluatee.departmentId AND evaluateeDepartment.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'mappedByEmployee', '"mappedByEmployee"."id" = "evaluation"."mappedBy"::UUID AND "mappedByEmployee"."deletedAt" IS NULL')
            .select([
            'evaluation.id AS evaluation_id',
            'evaluation.evaluationDate AS evaluation_evaluationdate',
            'evaluation.status AS evaluation_status',
            'evaluation.isCompleted AS evaluation_iscompleted',
            'evaluation.completedAt AS evaluation_completedat',
            'evaluation.requestDeadline AS evaluation_requestdeadline',
            'evaluation.mappedDate AS evaluation_mappeddate',
            'evaluation.isActive AS evaluation_isactive',
            'evaluation.createdAt AS evaluation_createdat',
            'evaluation.updatedAt AS evaluation_updatedat',
            'evaluation.deletedAt AS evaluation_deletedat',
            'evaluation.version AS evaluation_version',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.status AS period_status',
            'evaluator.id AS evaluator_id',
            'evaluator.name AS evaluator_name',
            'evaluator.employeeNumber AS evaluator_employeenumber',
            'evaluator.email AS evaluator_email',
            'evaluator.departmentId AS evaluator_departmentid',
            'evaluator.status AS evaluator_status',
            'evaluator.rankName AS evaluator_rankname',
            'evaluator.roles AS evaluator_roles',
            'evaluatorDepartment.id AS evaluatordepartment_id',
            'evaluatorDepartment.name AS evaluatordepartment_name',
            'evaluatorDepartment.code AS evaluatordepartment_code',
            'evaluatee.id AS evaluatee_id',
            'evaluatee.name AS evaluatee_name',
            'evaluatee.employeeNumber AS evaluatee_employeenumber',
            'evaluatee.email AS evaluatee_email',
            'evaluatee.departmentId AS evaluatee_departmentid',
            'evaluatee.status AS evaluatee_status',
            'evaluateeDepartment.id AS evaluateedepartment_id',
            'evaluateeDepartment.name AS evaluateedepartment_name',
            'evaluateeDepartment.code AS evaluateedepartment_code',
            'mappedByEmployee.id AS mappedby_id',
            'mappedByEmployee.name AS mappedby_name',
            'mappedByEmployee.employeeNumber AS mappedby_employeenumber',
            'mappedByEmployee.email AS mappedby_email',
            'mappedByEmployee.status AS mappedby_status',
        ])
            .where('evaluation.id = :evaluationId', { evaluationId })
            .andWhere('evaluation.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            throw new common_1.NotFoundException('존재하지 않는 동료평가입니다.');
        }
        const questions = await this.questionMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin(evaluation_question_entity_1.EvaluationQuestion, 'question', 'question.id = mapping.questionId AND question.deletedAt IS NULL')
            .select([
            'mapping.displayOrder AS displayorder',
            'mapping.answer AS mapping_answer',
            'mapping.score AS mapping_score',
            'mapping.answeredAt AS mapping_answeredat',
            'mapping.answeredBy AS mapping_answeredby',
            'question.id AS question_id',
            'question.text AS question_text',
            'question.minScore AS question_minscore',
            'question.maxScore AS question_maxscore',
        ])
            .where('mapping.peerEvaluationId = :evaluationId', { evaluationId })
            .andWhere('mapping.deletedAt IS NULL')
            .orderBy('mapping.displayOrder', 'ASC')
            .getRawMany();
        this.logger.log('동료평가 상세정보 조회 완료', {
            evaluationId,
            questionCount: questions.length,
        });
        return {
            id: result.evaluation_id,
            evaluationDate: result.evaluation_evaluationdate,
            status: result.evaluation_status,
            isCompleted: result.evaluation_iscompleted,
            completedAt: result.evaluation_completedat,
            requestDeadline: result.evaluation_requestdeadline,
            mappedDate: result.evaluation_mappeddate,
            isActive: result.evaluation_isactive,
            createdAt: result.evaluation_createdat,
            updatedAt: result.evaluation_updatedat,
            deletedAt: result.evaluation_deletedat,
            version: result.evaluation_version,
            period: result.period_id
                ? {
                    id: result.period_id,
                    name: result.period_name,
                    startDate: result.period_startdate,
                    status: result.period_status,
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
                    rankName: result.evaluator_rankname || '',
                    roles: result.evaluator_roles || [],
                }
                : null,
            evaluatorDepartment: result.evaluatordepartment_id
                ? {
                    id: result.evaluatordepartment_id,
                    name: result.evaluatordepartment_name,
                    code: result.evaluatordepartment_code,
                }
                : null,
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
                    status: result.mappedby_status,
                }
                : null,
            questions: questions.map((q) => ({
                id: q.question_id,
                text: q.question_text,
                minScore: q.question_minscore,
                maxScore: q.question_maxscore,
                displayOrder: q.displayorder,
                answer: q.mapping_answer,
                score: q.mapping_score,
                answeredAt: q.mapping_answeredat,
                answeredBy: q.mapping_answeredby,
            })),
        };
    }
};
exports.GetPeerEvaluationDetailHandler = GetPeerEvaluationDetailHandler;
exports.GetPeerEvaluationDetailHandler = GetPeerEvaluationDetailHandler = GetPeerEvaluationDetailHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetPeerEvaluationDetailQuery),
    __param(0, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetPeerEvaluationDetailHandler);
//# sourceMappingURL=get-peer-evaluation-detail.handler.js.map