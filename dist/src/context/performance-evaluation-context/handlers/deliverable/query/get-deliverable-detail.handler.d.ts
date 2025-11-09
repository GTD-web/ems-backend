import { IQueryHandler } from '@nestjs/cqrs';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
export declare class GetDeliverableDetailQuery {
    readonly deliverableId: string;
    constructor(deliverableId: string);
}
export declare class GetDeliverableDetailHandler implements IQueryHandler<GetDeliverableDetailQuery, Deliverable> {
    private readonly deliverableService;
    private readonly logger;
    constructor(deliverableService: DeliverableService);
    execute(query: GetDeliverableDetailQuery): Promise<Deliverable>;
}
