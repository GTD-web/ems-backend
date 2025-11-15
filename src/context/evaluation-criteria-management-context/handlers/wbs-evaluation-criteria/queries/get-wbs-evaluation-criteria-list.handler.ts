import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodStatus } from '@domain/core/evaluation-period/evaluation-period.types';
import { WbsEvaluationCriteriaFilter } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import {
  WbsEvaluationCriteriaListResponseDto,
  EvaluationPeriodManualSettingsDto,
} from '@/interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';

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
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  async execute(
    query: GetWbsEvaluationCriteriaListQuery,
  ): Promise<WbsEvaluationCriteriaListResponseDto> {
    const { filter } = query;

    this.logger.debug(
      `WBS 평가기준 목록 조회 시작 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      // 1. WBS 평가기준 목록 조회
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
      const criteria = criteriaList.map((criteria) =>
        criteria.DTO로_변환한다(),
      );

      // 2. 평가기간 수동 설정 상태 조회
      // 현재 활성화된 평가기간을 조회 (진행 중인 평가기간)
      const activeEvaluationPeriod =
        await this.evaluationPeriodRepository.findOne({
          where: {
            status: EvaluationPeriodStatus.IN_PROGRESS,
            deletedAt: IsNull(),
          },
          order: {
            createdAt: 'DESC',
          },
        });

      // 평가기간 수동 설정 상태 정보 구성
      const evaluationPeriodSettings: EvaluationPeriodManualSettingsDto = {
        criteriaSettingEnabled:
          activeEvaluationPeriod?.criteriaSettingEnabled ?? false,
        selfEvaluationSettingEnabled:
          activeEvaluationPeriod?.selfEvaluationSettingEnabled ?? false,
        finalEvaluationSettingEnabled:
          activeEvaluationPeriod?.finalEvaluationSettingEnabled ?? false,
      };

      this.logger.debug(
        `WBS 평가기준 목록 조회 완료 - 조회된 개수: ${criteriaList.length}, 평가기간 설정: ${JSON.stringify(evaluationPeriodSettings)}`,
      );

      return {
        criteria,
        evaluationPeriodSettings,
      };
    } catch (error) {
      this.logger.error(
        `WBS 평가기준 목록 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }
}
