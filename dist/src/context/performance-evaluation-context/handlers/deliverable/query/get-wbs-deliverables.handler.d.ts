import { IQueryHandler } from '@nestjs/cqrs';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
export declare class GetWbsDeliverablesQuery {
    readonly wbsItemId: string;
    readonly activeOnly: boolean;
    constructor(wbsItemId: string, activeOnly?: boolean);
}
export declare class GetWbsDeliverablesHandler implements IQueryHandler<GetWbsDeliverablesQuery, Deliverable[]> {
    private readonly deliverableService;
    private readonly logger;
    constructor(deliverableService: DeliverableService);
    execute(query: GetWbsDeliverablesQuery): Promise<Deliverable[]>;
}
