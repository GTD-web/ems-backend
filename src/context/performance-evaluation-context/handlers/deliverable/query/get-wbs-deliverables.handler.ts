import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

/**
 * WBS 항목별 산출물 조회 쿼리
 */
export class GetWbsDeliverablesQuery {
  constructor(
    public readonly wbsItemId: string,
    public readonly activeOnly: boolean = true,
  ) {}
}

/**
 * WBS 항목별 산출물 조회 핸들러
 */
@Injectable()
@QueryHandler(GetWbsDeliverablesQuery)
export class GetWbsDeliverablesHandler
  implements IQueryHandler<GetWbsDeliverablesQuery, Deliverable[]>
{
  private readonly logger = new Logger(GetWbsDeliverablesHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(query: GetWbsDeliverablesQuery): Promise<Deliverable[]> {
    this.logger.debug(`WBS 항목별 산출물 조회 - WBS: ${query.wbsItemId}`);

    const deliverables = await this.deliverableService.필터_조회한다({
      wbsItemId: query.wbsItemId,
      activeOnly: query.activeOnly,
      orderBy: 'createdAt',
      orderDirection: 'DESC',
    });

    this.logger.debug(
      `WBS 항목별 산출물 조회 완료 - 개수: ${deliverables.length}`,
    );
    return deliverables;
  }
}

