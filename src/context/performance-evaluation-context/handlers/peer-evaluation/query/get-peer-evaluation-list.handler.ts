import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import type {
  PeerEvaluationDto,
  PeerEvaluationStatus,
} from '@domain/core/peer-evaluation/peer-evaluation.types';

/**
 * 동료평가 목록 조회 쿼리
 */
export class GetPeerEvaluationListQuery {
  constructor(
    public readonly evaluatorId?: string,
    public readonly evaluateeId?: string,
    public readonly periodId?: string,
    public readonly projectId?: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * 동료평가 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetPeerEvaluationListQuery)
export class GetPeerEvaluationListHandler
  implements IQueryHandler<GetPeerEvaluationListQuery>
{
  private readonly logger = new Logger(GetPeerEvaluationListHandler.name);

  constructor(
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
  ) {}

  async execute(query: GetPeerEvaluationListQuery): Promise<{
    evaluations: PeerEvaluationDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      status,
      page,
      limit,
    } = query;

    this.logger.log('동료평가 목록 조회 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      status,
      page,
      limit,
    });

    // 동료평가 목록 조회
    const queryBuilder = this.peerEvaluationRepository
      .createQueryBuilder('evaluation')
      .where('evaluation.deletedAt IS NULL');

    // 필터 조건 적용
    if (evaluatorId) {
      queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
        evaluatorId,
      });
    }

    if (evaluateeId) {
      queryBuilder.andWhere('evaluation.evaluateeId = :evaluateeId', {
        evaluateeId,
      });
    }

    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
    }

    if (projectId) {
      queryBuilder.andWhere('evaluation.projectId = :projectId', { projectId });
    }

    if (status) {
      queryBuilder.andWhere('evaluation.status = :status', {
        status: status as PeerEvaluationStatus,
      });
    }

    // 정렬 및 페이지네이션
    queryBuilder.orderBy('evaluation.createdAt', 'DESC');

    if (page && limit) {
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }

    const evaluations = await queryBuilder.getMany();

    const result = {
      evaluations: evaluations.map((evaluation) => evaluation.DTO로_변환한다()),
      total: evaluations.length,
      page,
      limit,
    };

    this.logger.log('동료평가 목록 조회 완료', {
      total: result.total,
      count: result.evaluations.length,
    });

    return result;
  }
}
