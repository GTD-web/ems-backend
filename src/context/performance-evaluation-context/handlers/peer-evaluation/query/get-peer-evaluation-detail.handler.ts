import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';

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
  employeeId: string;
  evaluatorId: string;
  periodId: string;
  evaluationContent?: string;
  score?: number;
  evaluationDate: Date;
  status: string;
  isCompleted: boolean;
  completedAt?: Date;
  mappedDate: Date;
  mappedBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  version: number;

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
  ) {}

  async execute(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<PeerEvaluationDetailResult | null> {
    const { evaluationId } = query;

    this.logger.log('동료평가 상세정보 조회 핸들러 실행', { evaluationId });

    const result = await this.peerEvaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoin(
        Employee,
        'evaluator',
        'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluatorDepartment',
        '"evaluatorDepartment"."externalId" = "evaluator"."departmentId" AND "evaluatorDepartment"."deletedAt" IS NULL',
      )
      .leftJoin(
        Employee,
        'evaluatee',
        'evaluatee.id = evaluation.employeeId AND evaluatee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluateeDepartment',
        '"evaluateeDepartment"."externalId" = "evaluatee"."departmentId" AND "evaluateeDepartment"."deletedAt" IS NULL',
      )
      .select([
        // 평가 정보
        'evaluation.id AS evaluation_id',
        'evaluation.employeeId AS evaluation_employeeid',
        'evaluation.evaluatorId AS evaluation_evaluatorid',
        'evaluation.periodId AS evaluation_periodid',
        'evaluation.evaluationContent AS evaluation_evaluationcontent',
        'evaluation.score AS evaluation_score',
        'evaluation.evaluationDate AS evaluation_evaluationdate',
        'evaluation.status AS evaluation_status',
        'evaluation.isCompleted AS evaluation_iscompleted',
        'evaluation.completedAt AS evaluation_completedat',
        'evaluation.mappedDate AS evaluation_mappeddate',
        'evaluation.mappedBy AS evaluation_mappedby',
        'evaluation.isActive AS evaluation_isactive',
        'evaluation.createdAt AS evaluation_createdat',
        'evaluation.updatedAt AS evaluation_updatedat',
        'evaluation.createdBy AS evaluation_createdby',
        'evaluation.updatedBy AS evaluation_updatedby',
        'evaluation.deletedAt AS evaluation_deletedat',
        'evaluation.version AS evaluation_version',
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
      ])
      .where('evaluation.id = :evaluationId', { evaluationId })
      .andWhere('evaluation.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      throw new Error('존재하지 않는 동료평가입니다.');
    }

    this.logger.log('동료평가 상세정보 조회 완료', { evaluationId });

    return {
      id: result.evaluation_id,
      employeeId: result.evaluation_employeeid,
      evaluatorId: result.evaluation_evaluatorid,
      periodId: result.evaluation_periodid,
      evaluationContent: result.evaluation_evaluationcontent,
      score: result.evaluation_score,
      evaluationDate: result.evaluation_evaluationdate,
      status: result.evaluation_status,
      isCompleted: result.evaluation_iscompleted,
      completedAt: result.evaluation_completedat,
      mappedDate: result.evaluation_mappeddate,
      mappedBy: result.evaluation_mappedby,
      isActive: result.evaluation_isactive,
      createdAt: result.evaluation_createdat,
      updatedAt: result.evaluation_updatedat,
      createdBy: result.evaluation_createdby,
      updatedBy: result.evaluation_updatedby,
      deletedAt: result.evaluation_deletedat,
      version: result.evaluation_version,

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
    };
  }
}
