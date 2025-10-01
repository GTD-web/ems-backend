import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsEvaluationCriteriaFilter } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';

/**
 * WBS 평가기준 목록 조회 쿼리
 */
export class GetWbsEvaluationCriteriaListQuery {
  constructor(public readonly filter: WbsEvaluationCriteriaFilter) {}
}

/**
 * WBS 평가기준 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetWbsEvaluationCriteriaListQuery)
export class GetWbsEvaluationCriteriaListHandler
  implements IQueryHandler<GetWbsEvaluationCriteriaListQuery>
{
  private readonly logger = new Logger(
    GetWbsEvaluationCriteriaListHandler.name,
  );

  constructor(
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>,
  ) {}

  async execute(query: GetWbsEvaluationCriteriaListQuery) {
    const { filter } = query;

    this.logger.debug(
      `WBS 평가기준 목록 조회 시작 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder =
        this.wbsEvaluationCriteriaRepository.createQueryBuilder('criteria');

      // 필터 적용
      if (filter.wbsItemId) {
        queryBuilder.andWhere('criteria.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.criteriaSearch) {
        queryBuilder.andWhere('criteria.criteria LIKE :criteriaSearch', {
          criteriaSearch: `%${filter.criteriaSearch}%`,
        });
      }

      if (filter.criteriaExact) {
        queryBuilder.andWhere('TRIM(criteria.criteria) = :criteriaExact', {
          criteriaExact: filter.criteriaExact.trim(),
        });
      }

      queryBuilder.orderBy('criteria.createdAt', 'DESC');

      const criteriaList = await queryBuilder.getMany();
      const result = criteriaList.map((criteria) => criteria.DTO로_변환한다());

      this.logger.debug(
        `WBS 평가기준 목록 조회 완료 - 조회된 개수: ${criteriaList.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `WBS 평가기준 목록 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }
}
