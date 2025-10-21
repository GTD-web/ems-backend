import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableNotFoundException } from '@domain/core/deliverable/deliverable.exceptions';

/**
 * 산출물 상세 조회 쿼리
 */
export class GetDeliverableDetailQuery {
  constructor(public readonly deliverableId: string) {}
}

/**
 * 산출물 상세 조회 핸들러
 */
@Injectable()
@QueryHandler(GetDeliverableDetailQuery)
export class GetDeliverableDetailHandler
  implements IQueryHandler<GetDeliverableDetailQuery, Deliverable>
{
  private readonly logger = new Logger(GetDeliverableDetailHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(query: GetDeliverableDetailQuery): Promise<Deliverable> {
    this.logger.debug(`산출물 상세 조회 - ID: ${query.deliverableId}`);

    const deliverable = await this.deliverableService.조회한다(
      query.deliverableId,
    );

    if (!deliverable) {
      throw new DeliverableNotFoundException(query.deliverableId);
    }

    this.logger.debug(`산출물 상세 조회 완료 - ID: ${query.deliverableId}`);
    return deliverable;
  }
}

