import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';

/**
 * 평가자에게 할당된 피평가자 목록 조회 쿼리
 */
export class GetEvaluatorAssignedEvaluateesQuery {
  constructor(
    public readonly evaluatorId: string,
    public readonly periodId?: string,
    public readonly includeCompleted: boolean = false,
  ) {}
}

/**
 * 평가자에게 할당된 피평가자 상세 정보
 */
export interface EvaluatorAssignedEvaluatee {
  // 평가 기본 정보
  evaluationId: string;
  evaluateeId: string;
  periodId: string;
  status: string;
  isCompleted: boolean;
  completedAt?: Date;
  requestDeadline?: Date;
  mappedDate: Date;
  isActive: boolean;

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

  // 요청자 정보
  mappedBy: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;
}

/**
 * 평가자에게 할당된 피평가자 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluatorAssignedEvaluateesQuery)
export class GetEvaluatorAssignedEvaluateesHandler
  implements IQueryHandler<GetEvaluatorAssignedEvaluateesQuery>
{
  private readonly logger = new Logger(
    GetEvaluatorAssignedEvaluateesHandler.name,
  );

  constructor(
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
  ) {}

  async execute(
    query: GetEvaluatorAssignedEvaluateesQuery,
  ): Promise<EvaluatorAssignedEvaluatee[]> {
    const { evaluatorId, periodId, includeCompleted } = query;

    this.logger.log('평가자에게 할당된 피평가자 목록 조회 시작', {
      evaluatorId,
      periodId,
      includeCompleted,
    });

    const queryBuilder = this.peerEvaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoin(
        Employee,
        'evaluatee',
        'evaluatee.id = evaluation.evaluateeId AND evaluatee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'evaluateeDepartment',
        '"evaluateeDepartment"."externalId" = "evaluatee"."departmentId" AND "evaluateeDepartment"."deletedAt" IS NULL',
      )
      .leftJoin(
        Employee,
        'mappedBy',
        'mappedBy.id = evaluation.mappedBy AND mappedBy.deletedAt IS NULL',
      )
      .select([
        // 평가 정보
        'evaluation.id AS evaluation_id',
        'evaluation.evaluateeId AS evaluation_evaluateeid',
        'evaluation.periodId AS evaluation_periodid',
        'evaluation.status AS evaluation_status',
        'evaluation.isCompleted AS evaluation_iscompleted',
        'evaluation.completedAt AS evaluation_completedat',
        'evaluation.requestDeadline AS evaluation_requestdeadline',
        'evaluation.mappedDate AS evaluation_mappeddate',
        'evaluation.isActive AS evaluation_isactive',
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
        // 요청자 정보
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

    // 필터 조건 적용
    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
    }

    // 완료된 평가 제외 옵션
    if (!includeCompleted) {
      queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
        isCompleted: false,
      });
    }

    // 정렬: 미완료 먼저, 그 다음 매핑일 최신순
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
}
