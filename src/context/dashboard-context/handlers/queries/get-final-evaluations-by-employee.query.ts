import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '../../../../domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '../../../../domain/common/employee/employee.entity';
import { EvaluationPeriod } from '../../../../domain/core/evaluation-period/evaluation-period.entity';

/**
 * 직원별 최종평가 목록 조회 결과
 */
export interface FinalEvaluationByEmployeeResult {
  /** 최종평가 ID */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 피평가자명 */
  employeeName: string;
  /** 피평가자 사번 */
  employeeNumber: string;
  /** 피평가자 이메일 */
  employeeEmail: string;
  /** 피평가자 부서명 */
  departmentName: string | null;
  /** 피평가자 직책명 */
  rankName: string | null;
  /** 평가기간 ID */
  periodId: string;
  /** 평가기간명 */
  periodName: string;
  /** 평가기간 시작일 */
  periodStartDate: Date;
  /** 평가등급 (S, A, B, C, D 등) */
  evaluationGrade: string;
  /** 직무등급 (T1, T2, T3) */
  jobGrade: string;
  /** 직무 상세등급 (u, n, a) */
  jobDetailedGrade: string;
  /** 최종 평가 의견 */
  finalComments: string | null;
  /** 확정 여부 */
  isConfirmed: boolean;
  /** 확정일시 */
  confirmedAt: Date | null;
  /** 확정자 ID */
  confirmedBy: string | null;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 직원별 최종평가 목록 조회 쿼리
 */
export class GetFinalEvaluationsByEmployeeQuery {
  constructor(
    public readonly employeeId: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}

/**
 * 직원별 최종평가 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetFinalEvaluationsByEmployeeQuery)
export class GetFinalEvaluationsByEmployeeHandler
  implements
    IQueryHandler<
      GetFinalEvaluationsByEmployeeQuery,
      FinalEvaluationByEmployeeResult[]
    >
{
  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  async execute(
    query: GetFinalEvaluationsByEmployeeQuery,
  ): Promise<FinalEvaluationByEmployeeResult[]> {
    const { employeeId, startDate, endDate } = query;

    // QueryBuilder 생성
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
      ])
      .leftJoin(
        Employee,
        'employee',
        'employee.id::UUID = "finalEvaluation"."employeeId"::UUID AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id::UUID = "finalEvaluation"."periodId"::UUID AND period.deletedAt IS NULL',
      )
      .where('finalEvaluation.employeeId = :employeeId', { employeeId })
      .andWhere('finalEvaluation.deletedAt IS NULL');

    // 날짜 범위 필터링
    if (startDate) {
      queryBuilder.andWhere('period.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('period.startDate <= :endDate', { endDate });
    }

    // 평가기간 시작일 내림차순 정렬 (최신순)
    queryBuilder.orderBy('period.startDate', 'DESC');

    const rawResults = await queryBuilder.getRawMany();

    // 결과 매핑
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
}
