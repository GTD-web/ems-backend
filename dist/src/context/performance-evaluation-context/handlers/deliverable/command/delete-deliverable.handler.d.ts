import { ICommandHandler } from '@nestjs/cqrs';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
export declare class DeleteDeliverableCommand {
    readonly id: string;
    readonly deletedBy: string;
    constructor(id: string, deletedBy: string);
}
export declare class DeleteDeliverableHandler implements ICommandHandler<DeleteDeliverableCommand, void> {
    private readonly deliverableService;
    private readonly logger;
    constructor(deliverableService: DeliverableService);
    execute(command: DeleteDeliverableCommand): Promise<void>;
}
