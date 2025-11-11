import { ICommandHandler } from '@nestjs/cqrs';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
export declare class BulkDeleteDeliverablesCommand {
    readonly deliverableIds: string[];
    readonly deletedBy: string;
    constructor(deliverableIds: string[], deletedBy: string);
}
export interface BulkDeleteResult {
    successCount: number;
    failedCount: number;
    failedIds: Array<{
        id: string;
        error: string;
    }>;
}
export declare class BulkDeleteDeliverablesHandler implements ICommandHandler<BulkDeleteDeliverablesCommand, BulkDeleteResult> {
    private readonly deliverableService;
    private readonly logger;
    constructor(deliverableService: DeliverableService);
    execute(command: BulkDeleteDeliverablesCommand): Promise<BulkDeleteResult>;
}
