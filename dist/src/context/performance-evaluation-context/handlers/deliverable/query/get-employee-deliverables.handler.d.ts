import { IQueryHandler } from '@nestjs/cqrs';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
export declare class GetEmployeeDeliverablesQuery {
    readonly employeeId: string;
    readonly activeOnly: boolean;
    constructor(employeeId: string, activeOnly?: boolean);
}
export declare class GetEmployeeDeliverablesHandler implements IQueryHandler<GetEmployeeDeliverablesQuery, Deliverable[]> {
    private readonly deliverableService;
    private readonly logger;
    constructor(deliverableService: DeliverableService);
    execute(query: GetEmployeeDeliverablesQuery): Promise<Deliverable[]>;
}
