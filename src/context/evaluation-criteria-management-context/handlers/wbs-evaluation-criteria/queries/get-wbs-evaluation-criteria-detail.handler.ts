import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

/**
 * WBS 평가기준 상세 조회 쿼리
 */
export class GetWbsEvaluationCriteriaDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * WBS 평가기준 상세 조회 결과
 */
export interface WbsEvaluationCriteriaDetailResult {
  // 평가기준 기본 정보
  id: string;
  criteria: string;
  importance: number;
  createdAt: Date;
  updatedAt: Date;

  // WBS 항목 정보
  wbsItem: {
    id: string;
    wbsCode: string;
    title: string;
    status: string;
    level: number;
    startDate: Date;
    endDate: Date;
    progressPercentage: string;
  } | null;
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

  async execute(
    query: GetWbsEvaluationCriteriaDetailQuery,
  ): Promise<WbsEvaluationCriteriaDetailResult | null> {
    const { id } = query;

    this.logger.debug(`WBS 평가기준 상세 조회 시작 - ID: ${id}`);

    try {
      const result = await this.wbsEvaluationCriteriaRepository
        .createQueryBuilder('criteria')
        .leftJoin(
          WbsItem,
          'wbsItem',
          'wbsItem.id = criteria.wbsItemId AND wbsItem.deletedAt IS NULL',
        )
        .select([
          // 평가기준 정보
          'criteria.id AS criteria_id',
          'criteria.wbsItemId AS criteria_wbsitemid',
          'criteria.criteria AS criteria_criteria',
          'criteria.importance AS criteria_importance',
          'criteria.createdAt AS criteria_createdat',
          'criteria.updatedAt AS criteria_updatedat',
          // WBS 항목 정보
          'wbsItem.id AS wbsitem_id',
          'wbsItem.wbsCode AS wbsitem_wbscode',
          'wbsItem.title AS wbsitem_title',
          'wbsItem.status AS wbsitem_status',
          'wbsItem.level AS wbsitem_level',
          'wbsItem.startDate AS wbsitem_startdate',
          'wbsItem.endDate AS wbsitem_enddate',
          'wbsItem.progressPercentage AS wbsitem_progresspercentage',
        ])
        .where('criteria.id = :id', { id })
        .andWhere('criteria.deletedAt IS NULL')
        .getRawOne();

      if (!result) {
        this.logger.warn(`WBS 평가기준을 찾을 수 없습니다 - ID: ${id}`);
        return null;
      }

      this.logger.debug(`WBS 평가기준 상세 조회 완료 - ID: ${id}`);

      return {
        id: result.criteria_id,
        criteria: result.criteria_criteria,
        importance: result.criteria_importance,
        createdAt: result.criteria_createdat,
        updatedAt: result.criteria_updatedat,

        wbsItem: result.wbsitem_id
          ? {
              id: result.wbsitem_id,
              wbsCode: result.wbsitem_wbscode,
              title: result.wbsitem_title,
              status: result.wbsitem_status,
              level: result.wbsitem_level,
              startDate: result.wbsitem_startdate,
              endDate: result.wbsitem_enddate,
              progressPercentage: result.wbsitem_progresspercentage,
            }
          : null,
      };
    } catch (error) {
      this.logger.error(`WBS 평가기준 상세 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
