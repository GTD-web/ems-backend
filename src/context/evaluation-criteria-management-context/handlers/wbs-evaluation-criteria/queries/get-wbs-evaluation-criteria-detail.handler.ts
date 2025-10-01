import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';

/**
 * WBS 평가기준 상세 조회 쿼리
 */
export class GetWbsEvaluationCriteriaDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * WBS 평가기준 상세 조회 쿼리 핸들러
 */
@QueryHandler(GetWbsEvaluationCriteriaDetailQuery)
export class GetWbsEvaluationCriteriaDetailHandler
  implements IQueryHandler<GetWbsEvaluationCriteriaDetailQuery>
{
  private readonly logger = new Logger(
    GetWbsEvaluationCriteriaDetailHandler.name,
  );

  constructor(
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>,
  ) {}

  async execute(query: GetWbsEvaluationCriteriaDetailQuery) {
    const { id } = query;

    this.logger.debug(`WBS 평가기준 상세 조회 시작 - ID: ${id}`);

    try {
      const criteria = await this.wbsEvaluationCriteriaRepository.findOne({
        where: { id },
      });

      if (!criteria) {
        this.logger.warn(`WBS 평가기준을 찾을 수 없습니다 - ID: ${id}`);
        return null;
      }

      this.logger.debug(`WBS 평가기준 상세 조회 완료 - ID: ${id}`);

      return criteria.DTO로_변환한다();
    } catch (error) {
      this.logger.error(`WBS 평가기준 상세 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
