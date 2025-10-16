import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import type { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * 직원 자기평가 목록 조회 쿼리
 */
export class GetEmployeeSelfEvaluationsQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId?: string,
    public readonly projectId?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * 직원 자기평가 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEmployeeSelfEvaluationsQuery)
export class GetEmployeeSelfEvaluationsHandler
  implements IQueryHandler<GetEmployeeSelfEvaluationsQuery>
{
  private readonly logger = new Logger(GetEmployeeSelfEvaluationsHandler.name);

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  ) {}

  async execute(query: GetEmployeeSelfEvaluationsQuery): Promise<{
    evaluations: WbsSelfEvaluationDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { employeeId, periodId, projectId, page, limit } = query;

    this.logger.log('직원 자기평가 목록 조회 핸들러 실행', {
      employeeId,
      periodId,
      projectId,
      page,
      limit,
    });

    // 직원의 자가평가 목록 조회
    const queryBuilder = this.wbsSelfEvaluationRepository
      .createQueryBuilder('evaluation')
      .where('evaluation.employeeId = :employeeId', { employeeId })
      .andWhere('evaluation.deletedAt IS NULL');

    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', {
        periodId,
      });
    }

    // 페이지네이션 적용
    if (page && limit) {
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }

    queryBuilder.orderBy('evaluation.evaluationDate', 'DESC');

    const evaluations = await queryBuilder.getMany();

    const result = {
      evaluations: evaluations.map((evaluation) => evaluation.DTO로_변환한다()),
      total: evaluations.length,
      page,
      limit,
    };

    this.logger.log('직원 자기평가 목록 조회 완료', {
      total: result.total,
      count: result.evaluations.length,
    });

    return result;
  }
}
