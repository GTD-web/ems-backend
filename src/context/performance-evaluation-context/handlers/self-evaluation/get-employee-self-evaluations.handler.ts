import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluationMapping } from '../../../../domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.entity';
import { WbsSelfEvaluation } from '../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import type { WbsSelfEvaluationDto } from '../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

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
    @InjectRepository(WbsSelfEvaluationMapping)
    private readonly wbsSelfEvaluationMappingRepository: Repository<WbsSelfEvaluationMapping>,
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

    // 1. 먼저 직원의 매핑 목록을 조회
    const mappingQueryBuilder = this.wbsSelfEvaluationMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('mapping.selfEvaluationId IS NOT NULL');

    if (periodId) {
      mappingQueryBuilder.andWhere('mapping.periodId = :periodId', {
        periodId,
      });
    }

    // 페이지네이션 적용
    if (page && limit) {
      const offset = (page - 1) * limit;
      mappingQueryBuilder.skip(offset).take(limit);
    }

    const mappings = await mappingQueryBuilder.getMany();

    // 2. 매핑에서 자가평가 ID로 실제 자가평가 조회
    const evaluationIds = mappings
      .map((mapping) => mapping.selfEvaluationId)
      .filter((id) => id !== null && id !== undefined);

    let evaluations: WbsSelfEvaluation[] = [];
    if (evaluationIds.length > 0) {
      evaluations = await this.wbsSelfEvaluationRepository.find({
        where: {
          id: evaluationIds as any,
          deletedAt: IsNull(),
        },
        order: {
          evaluationDate: 'DESC',
        },
      });
    }

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
