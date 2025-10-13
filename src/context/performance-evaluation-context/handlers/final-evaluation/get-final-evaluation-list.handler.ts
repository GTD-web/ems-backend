import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import type {
  FinalEvaluationDto,
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';

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
    evaluations: FinalEvaluationDto[];
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

    // 최종평가 목록 조회
    const queryBuilder = this.finalEvaluationRepository
      .createQueryBuilder('evaluation')
      .where('evaluation.deletedAt IS NULL');

    // 필터 조건 적용
    if (employeeId) {
      queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
        employeeId,
      });
    }

    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
    }

    if (evaluationGrade) {
      queryBuilder.andWhere('evaluation.evaluationGrade = :evaluationGrade', {
        evaluationGrade,
      });
    }

    if (jobGrade) {
      queryBuilder.andWhere('evaluation.jobGrade = :jobGrade', { jobGrade });
    }

    if (jobDetailedGrade) {
      queryBuilder.andWhere('evaluation.jobDetailedGrade = :jobDetailedGrade', {
        jobDetailedGrade,
      });
    }

    if (confirmedOnly) {
      queryBuilder.andWhere('evaluation.isConfirmed = :isConfirmed', {
        isConfirmed: true,
      });
    }

    // 전체 개수 조회
    const total = await queryBuilder.getCount();

    // 정렬 및 페이지네이션
    queryBuilder.orderBy('evaluation.createdAt', 'DESC');

    if (page && limit) {
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }

    const evaluations = await queryBuilder.getMany();

    const result = {
      evaluations: evaluations.map((evaluation) => evaluation.DTO로_변환한다()),
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
