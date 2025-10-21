import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

/**
 * 직원별 산출물 조회 쿼리
 */
export class GetEmployeeDeliverablesQuery {
  constructor(
    public readonly employeeId: string,
    public readonly activeOnly: boolean = true,
  ) {}
}

/**
 * 직원별 산출물 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEmployeeDeliverablesQuery)
export class GetEmployeeDeliverablesHandler
  implements IQueryHandler<GetEmployeeDeliverablesQuery, Deliverable[]>
{
  private readonly logger = new Logger(GetEmployeeDeliverablesHandler.name);

  constructor(private readonly deliverableService: DeliverableService) {}

  async execute(query: GetEmployeeDeliverablesQuery): Promise<Deliverable[]> {
    this.logger.debug(`직원별 산출물 조회 - 직원: ${query.employeeId}`);

    const deliverables = await this.deliverableService.필터_조회한다({
      employeeId: query.employeeId,
      activeOnly: query.activeOnly,
      orderBy: 'createdAt',
      orderDirection: 'DESC',
    });

    this.logger.debug(`직원별 산출물 조회 완료 - 개수: ${deliverables.length}`);
    return deliverables;
  }
}

