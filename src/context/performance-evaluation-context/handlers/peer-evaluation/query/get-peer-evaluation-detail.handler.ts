import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { PeerEvaluationQuestionMapping } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';

/**
 * 동료평가 상세정보 조회 쿼리
 */
export class GetPeerEvaluationDetailQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * 동료평가 상세정보 조회 결과
 */
export interface PeerEvaluationDetailResult {
  // 평가 기본 정보
  id: string;
  evaluationDate: Date;
  status: string;
  isCompleted: boolean;
  completedAt?: Date;
  requestDeadline?: Date;
  mappedDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;

  // 평가기간 정보
  period: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  } | null;

  // 평가자 정보
  evaluator: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  // 평가자 부서 정보
  evaluatorDepartment: {
    id: string;
    name: string;
    code: string;
  } | null;

  // 피평가자 정보
  evaluatee: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  // 피평가자 부서 정보
  evaluateeDepartment: {
    id: string;
    name: string;
    code: string;
  } | null;

  // 매핑자 정보
  mappedBy: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    status: string;
  } | null;

  // 생성자 정보
  createdBy: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    status: string;
  } | null;

  // 수정자 정보
  updatedBy: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    status: string;
  } | null;

  // 평가질문 목록
  questions: {
    id: string;
    text: string;
    minScore?: number;
    maxScore?: number;
    displayOrder: number;
    answer?: string;
    answeredAt?: Date;
    answeredBy?: string;
  }[];
}

/**
 * 동료평가 상세정보 조회 핸들러
 */
@Injectable()
@QueryHandler(GetPeerEvaluationDetailQuery)
export class GetPeerEvaluationDetailHandler
  implements IQueryHandler<GetPeerEvaluationDetailQuery>
{
  private readonly logger = new Logger(GetPeerEvaluationDetailHandler.name);

  constructor(
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
    @InjectRepository(PeerEvaluationQuestionMapping)
    private readonly questionMappingRepository: Repository<PeerEvaluationQuestionMapping>,
  ) {}

  async execute(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<PeerEvaluationDetailResult | null> {
    const { evaluationId } = query;

    this.logger.log('동료평가 상세정보 조회 핸들러 실행', { evaluationId });

    const result = await this.peerEvaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = evaluation.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'evaluator',
        'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluatorDepartment',
        'evaluatorDepartment.externalId = evaluator.departmentId AND evaluatorDepartment.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'evaluatee',
        'evaluatee.id = evaluation.evaluateeId AND evaluatee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluateeDepartment',
        'evaluateeDepartment.externalId = evaluatee.departmentId AND evaluateeDepartment.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'mappedByEmployee',
        '"mappedByEmployee"."id" = "evaluation"."mappedBy"::UUID AND "mappedByEmployee"."deletedAt" IS NULL',
      )
      .leftJoin(
        Employee,
        'createdByEmployee',
        '"createdByEmployee"."id" = "evaluation"."createdBy"::UUID AND "createdByEmployee"."deletedAt" IS NULL',
      )
      .leftJoin(
        Employee,
        'updatedByEmployee',
        '"updatedByEmployee"."id" = "evaluation"."updatedBy"::UUID AND "updatedByEmployee"."deletedAt" IS NULL',
      )
      .select([
        // 평가 정보
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
        // 평가기간 정보
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
        'period.endDate AS period_enddate',
        'period.status AS period_status',
        // 평가자 정보
        'evaluator.id AS evaluator_id',
        'evaluator.name AS evaluator_name',
        'evaluator.employeeNumber AS evaluator_employeenumber',
        'evaluator.email AS evaluator_email',
        'evaluator.departmentId AS evaluator_departmentid',
        'evaluator.status AS evaluator_status',
        // 평가자 부서 정보
        'evaluatorDepartment.id AS evaluatordepartment_id',
        'evaluatorDepartment.name AS evaluatordepartment_name',
        'evaluatorDepartment.code AS evaluatordepartment_code',
        // 피평가자 정보
        'evaluatee.id AS evaluatee_id',
        'evaluatee.name AS evaluatee_name',
        'evaluatee.employeeNumber AS evaluatee_employeenumber',
        'evaluatee.email AS evaluatee_email',
        'evaluatee.departmentId AS evaluatee_departmentid',
        'evaluatee.status AS evaluatee_status',
        // 피평가자 부서 정보
        'evaluateeDepartment.id AS evaluateedepartment_id',
        'evaluateeDepartment.name AS evaluateedepartment_name',
        'evaluateeDepartment.code AS evaluateedepartment_code',
        // 매핑자 정보
        'mappedByEmployee.id AS mappedby_id',
        'mappedByEmployee.name AS mappedby_name',
        'mappedByEmployee.employeeNumber AS mappedby_employeenumber',
        'mappedByEmployee.email AS mappedby_email',
        'mappedByEmployee.status AS mappedby_status',
        // 생성자 정보
        'createdByEmployee.id AS createdby_id',
        'createdByEmployee.name AS createdby_name',
        'createdByEmployee.employeeNumber AS createdby_employeenumber',
        'createdByEmployee.email AS createdby_email',
        'createdByEmployee.status AS createdby_status',
        // 수정자 정보
        'updatedByEmployee.id AS updatedby_id',
        'updatedByEmployee.name AS updatedby_name',
        'updatedByEmployee.employeeNumber AS updatedby_employeenumber',
        'updatedByEmployee.email AS updatedby_email',
        'updatedByEmployee.status AS updatedby_status',
      ])
      .where('evaluation.id = :evaluationId', { evaluationId })
      .andWhere('evaluation.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      throw new NotFoundException('존재하지 않는 동료평가입니다.');
    }

    // 평가질문 조회 (답변 정보 포함)
    const questions = await this.questionMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        EvaluationQuestion,
        'question',
        'question.id = mapping.questionId AND question.deletedAt IS NULL',
      )
      .select([
        'mapping.displayOrder AS displayorder',
        'mapping.answer AS mapping_answer',
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
            endDate: result.period_enddate,
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

      createdBy: result.createdby_id
        ? {
            id: result.createdby_id,
            name: result.createdby_name,
            employeeNumber: result.createdby_employeenumber,
            email: result.createdby_email,
            status: result.createdby_status,
          }
        : null,

      updatedBy: result.updatedby_id
        ? {
            id: result.updatedby_id,
            name: result.updatedby_name,
            employeeNumber: result.updatedby_employeenumber,
            email: result.updatedby_email,
            status: result.updatedby_status,
          }
        : null,

      questions: questions.map((q) => ({
        id: q.question_id,
        text: q.question_text,
        minScore: q.question_minscore,
        maxScore: q.question_maxscore,
        displayOrder: q.displayorder,
        answer: q.mapping_answer,
        answeredAt: q.mapping_answeredat,
        answeredBy: q.mapping_answeredby,
      })),
    };
  }
}
