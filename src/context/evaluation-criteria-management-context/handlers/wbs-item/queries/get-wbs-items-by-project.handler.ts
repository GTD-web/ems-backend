import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsItemService } from '../../../../../domain/common/wbs-item/wbs-item.service';
import type { WbsItemDto } from '../../../../../domain/common/wbs-item/wbs-item.types';

/**
 * 프로젝트별 WBS 목록 조회 쿼리
 */
export class GetWbsItemsByProjectQuery {
  constructor(public readonly projectId: string) {}
}

/**
 * 프로젝트별 WBS 목록 조회 결과
 */
export interface GetWbsItemsByProjectResult {
  wbsItems: WbsItemDto[];
}

/**
 * 프로젝트별 WBS 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetWbsItemsByProjectQuery)
export class GetWbsItemsByProjectHandler
  implements IQueryHandler<GetWbsItemsByProjectQuery, GetWbsItemsByProjectResult>
{
  private readonly logger = new Logger(GetWbsItemsByProjectHandler.name);

  constructor(private readonly wbsItemService: WbsItemService) {}

  async execute(
    query: GetWbsItemsByProjectQuery,
  ): Promise<GetWbsItemsByProjectResult> {
    const { projectId } = query;

    this.logger.log('프로젝트별 WBS 목록 조회 시작', {
      projectId,
    });

    try {
      const wbsItems = await this.wbsItemService.프로젝트별_조회한다(projectId);

      this.logger.log('프로젝트별 WBS 목록 조회 완료', {
        projectId,
        count: wbsItems.length,
      });

      return {
        wbsItems,
      };
    } catch (error) {
      this.logger.error('프로젝트별 WBS 목록 조회 실패', {
        error: error.message,
        projectId,
      });
      throw error;
    }
  }
}
