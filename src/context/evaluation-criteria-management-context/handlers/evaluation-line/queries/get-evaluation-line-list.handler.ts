import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationLine } from '../../../../../domain/core/evaluation-line/evaluation-line.entity';
import type {
  EvaluationLineDto,
  EvaluationLineFilter,
} from '../../../../../domain/core/evaluation-line/evaluation-line.types';

/**
 * 평가라인 목록 조회 쿼리
 */
export class GetEvaluationLineListQuery {
  constructor(public readonly filter: EvaluationLineFilter) {}
}

/**
 * 평가라인 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetEvaluationLineListQuery)
export class GetEvaluationLineListHandler
  implements IQueryHandler<GetEvaluationLineListQuery, EvaluationLineDto[]>
{
  private readonly logger = new Logger(GetEvaluationLineListHandler.name);

  constructor(
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
  ) {}

  async execute(
    query: GetEvaluationLineListQuery,
  ): Promise<EvaluationLineDto[]> {
    const { filter } = query;

    this.logger.debug(
      `평가라인 목록 조회 시작 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.evaluationLineRepository.createQueryBuilder('evaluationLine');

      // 필터 적용
      if (filter.evaluatorType) {
        queryBuilder.andWhere('evaluationLine.evaluatorType = :evaluatorType', {
          evaluatorType: filter.evaluatorType,
        });
      }

      if (filter.requiredOnly) {
        queryBuilder.andWhere('evaluationLine.isRequired = :isRequired', {
          isRequired: true,
        });
      }

      if (filter.autoAssignedOnly) {
        queryBuilder.andWhere(
          'evaluationLine.isAutoAssigned = :isAutoAssigned',
          {
            isAutoAssigned: true,
          },
        );
      }

      if (filter.orderFrom !== undefined) {
        queryBuilder.andWhere('evaluationLine.order >= :orderFrom', {
          orderFrom: filter.orderFrom,
        });
      }

      if (filter.orderTo !== undefined) {
        queryBuilder.andWhere('evaluationLine.order <= :orderTo', {
          orderTo: filter.orderTo,
        });
      }

      queryBuilder.orderBy('evaluationLine.order', 'ASC');

      const evaluationLines = await queryBuilder.getMany();
      const result = evaluationLines.map((line) => line.DTO로_변환한다());

      this.logger.debug(
        `평가라인 목록 조회 완료 - 조회된 개수: ${evaluationLines.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가라인 목록 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }
}
