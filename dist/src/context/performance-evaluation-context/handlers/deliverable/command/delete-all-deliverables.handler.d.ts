import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
export declare class DeleteAllDeliverablesCommand {
    readonly deletedBy: string;
    constructor(deletedBy: string);
}
export interface DeleteAllDeliverablesResult {
    successCount: number;
    failedCount: number;
    failedIds: Array<{
        id: string;
        error: string;
    }>;
}
export declare class DeleteAllDeliverablesHandler implements ICommandHandler<DeleteAllDeliverablesCommand, DeleteAllDeliverablesResult> {
    private readonly deliverableService;
    private readonly deliverableRepository;
    private readonly logger;
    constructor(deliverableService: DeliverableService, deliverableRepository: Repository<Deliverable>);
    execute(command: DeleteAllDeliverablesCommand): Promise<DeleteAllDeliverablesResult>;
}
