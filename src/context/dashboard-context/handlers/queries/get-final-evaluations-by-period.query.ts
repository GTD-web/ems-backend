import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '../../../../domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '../../../../domain/common/employee/employee.entity';
import { EvaluationPeriodEmployeeMapping } from '../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriod } from '../../../../domain/core/evaluation-period/evaluation-period.entity';

/**
 * 평가기간별 최종평가 목록 조회 결과
 */
export interface FinalEvaluationByPeriodResult {
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
  /** 평가기간 종료일 */
  periodEndDate: Date | null;
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
 * 평가기간별 최종평가 목록 조회 쿼리
 */
export class GetFinalEvaluationsByPeriodQuery {
  constructor(public readonly evaluationPeriodId: string) {}
}

/**
 * 평가기간별 최종평가 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetFinalEvaluationsByPeriodQuery)
export class GetFinalEvaluationsByPeriodHandler
  implements
    IQueryHandler<
      GetFinalEvaluationsByPeriodQuery,
      FinalEvaluationByPeriodResult[]
    >
{
  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  async execute(
    query: GetFinalEvaluationsByPeriodQuery,
  ): Promise<FinalEvaluationByPeriodResult[]> {
    const { evaluationPeriodId } = query;

    // 최종평가 목록을 직원 정보 및 평가기간 정보와 함께 조회
    const rawResults = await this.finalEvaluationRepository
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
      .leftJoin(
        EvaluationPeriodEmployeeMapping,
        'mapping',
        'mapping."employeeId"::UUID = "finalEvaluation"."employeeId"::UUID AND mapping."evaluationPeriodId"::UUID = "finalEvaluation"."periodId"::UUID AND mapping.deletedAt IS NULL',
      )
      .where('finalEvaluation.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('finalEvaluation.deletedAt IS NULL')
      .andWhere('mapping.isExcluded = :isExcluded', { isExcluded: false })
      .orderBy('employee.employeeNumber', 'ASC')
      .getRawMany();

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
}
