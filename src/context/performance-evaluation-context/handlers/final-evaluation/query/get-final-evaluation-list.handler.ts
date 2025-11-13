import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import type {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';
import type { FinalEvaluationListItemDto } from '@interface/admin/performance-evaluation/dto/final-evaluation.dto';

/**
 * 최종평가 목록 조회 쿼리
 */
export class GetFinalEvaluationListQuery {
  constructor(
    public readonly employeeId?: string,
    public readonly periodId?: string,
    public readonly evaluationGrade?: string,
    public readonly jobGrade?: JobGrade,
    public readonly jobDetailedGrade?: JobDetailedGrade,
    public readonly confirmedOnly?: boolean,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * 최종평가 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetFinalEvaluationListQuery)
export class GetFinalEvaluationListHandler
  implements IQueryHandler<GetFinalEvaluationListQuery>
{
  private readonly logger = new Logger(GetFinalEvaluationListHandler.name);

  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
  ) {}

  async execute(query: GetFinalEvaluationListQuery): Promise<{
    evaluations: FinalEvaluationListItemDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      confirmedOnly,
      page,
      limit,
    } = query;

    this.logger.log('최종평가 목록 조회 핸들러 실행', {
      employeeId,
      periodId,
      confirmedOnly,
      page,
      limit,
    });

    // 카운트용 쿼리 빌더
    const countQueryBuilder = this.finalEvaluationRepository
      .createQueryBuilder('evaluation')
      .where('evaluation.deletedAt IS NULL');

    // 최종평가 목록 조회용 쿼리 빌더
    const queryBuilder = this.finalEvaluationRepository
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
        'employee.id AS employee_id',
        'employee.name AS employee_name',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.email AS employee_email',
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
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
      .where('evaluation.deletedAt IS NULL');

    // 필터 조건 적용
    if (employeeId) {
      queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
        employeeId,
      });
      countQueryBuilder.andWhere('evaluation.employeeId = :employeeId', {
        employeeId,
      });
    }

    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
      countQueryBuilder.andWhere('evaluation.periodId = :periodId', {
        periodId,
      });
    }

    if (evaluationGrade) {
      queryBuilder.andWhere('evaluation.evaluationGrade = :evaluationGrade', {
        evaluationGrade,
      });
      countQueryBuilder.andWhere(
        'evaluation.evaluationGrade = :evaluationGrade',
        {
          evaluationGrade,
        },
      );
    }

    if (jobGrade) {
      queryBuilder.andWhere('evaluation.jobGrade = :jobGrade', { jobGrade });
      countQueryBuilder.andWhere('evaluation.jobGrade = :jobGrade', {
        jobGrade,
      });
    }

    if (jobDetailedGrade) {
      queryBuilder.andWhere('evaluation.jobDetailedGrade = :jobDetailedGrade', {
        jobDetailedGrade,
      });
      countQueryBuilder.andWhere(
        'evaluation.jobDetailedGrade = :jobDetailedGrade',
        {
          jobDetailedGrade,
        },
      );
    }

    if (confirmedOnly) {
      queryBuilder.andWhere('evaluation.isConfirmed = :isConfirmed', {
        isConfirmed: true,
      });
      countQueryBuilder.andWhere('evaluation.isConfirmed = :isConfirmed', {
        isConfirmed: true,
      });
    }

    // 전체 개수 조회
    const total = await countQueryBuilder.getCount();

    // 정렬 및 페이지네이션
    queryBuilder.orderBy('evaluation.createdAt', 'DESC');

    if (page && limit) {
      const offset = (page - 1) * limit;
      queryBuilder.offset(offset).limit(limit);
    }

    const results = await queryBuilder.getRawMany();

    const evaluations: FinalEvaluationListItemDto[] = results.map((result) => ({
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
    }));

    const result = {
      evaluations,
      total,
      page,
      limit,
    };

    this.logger.log('최종평가 목록 조회 완료', {
      total: result.total,
      count: result.evaluations.length,
    });

    return result;
  }
}
