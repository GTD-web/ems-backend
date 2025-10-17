import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import type { FinalEvaluationDetailDto } from '@interface/admin/performance-evaluation/dto/final-evaluation.dto';

/**
 * 직원-평가기간별 최종평가 조회 쿼리
 */
export class GetFinalEvaluationByEmployeePeriodQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 직원-평가기간별 최종평가 조회 핸들러
 */
@Injectable()
@QueryHandler(GetFinalEvaluationByEmployeePeriodQuery)
export class GetFinalEvaluationByEmployeePeriodHandler
  implements IQueryHandler<GetFinalEvaluationByEmployeePeriodQuery>
{
  private readonly logger = new Logger(
    GetFinalEvaluationByEmployeePeriodHandler.name,
  );

  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
  ) {}

  async execute(
    query: GetFinalEvaluationByEmployeePeriodQuery,
  ): Promise<FinalEvaluationDetailDto | null> {
    const { employeeId, periodId } = query;

    this.logger.log('직원-평가기간별 최종평가 조회 핸들러 실행', {
      employeeId,
      periodId,
    });

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
      .leftJoin(
        Employee,
        'employee',
        'employee.id::UUID = evaluation."employeeId"::UUID AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id::UUID = evaluation."periodId"::UUID AND period.deletedAt IS NULL',
      )
      .where('evaluation.employeeId = :employeeId', { employeeId })
      .andWhere('evaluation.periodId = :periodId', { periodId })
      .andWhere('evaluation.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      this.logger.log('최종평가를 찾을 수 없음', { employeeId, periodId });
      return null;
    }

    this.logger.log('직원-평가기간별 최종평가 조회 완료', {
      evaluationId: result.evaluation_id,
    });

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
}
