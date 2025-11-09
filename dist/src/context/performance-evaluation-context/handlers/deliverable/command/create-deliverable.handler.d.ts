import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
export declare class CreateDeliverableCommand {
    readonly name: string;
    readonly type: DeliverableType;
    readonly employeeId: string;
    readonly wbsItemId: string;
    readonly description?: string | undefined;
    readonly filePath?: string | undefined;
    readonly createdBy?: string | undefined;
    constructor(name: string, type: DeliverableType, employeeId: string, wbsItemId: string, description?: string | undefined, filePath?: string | undefined, createdBy?: string | undefined);
}
export declare class CreateDeliverableHandler implements ICommandHandler<CreateDeliverableCommand, Deliverable> {
    private readonly deliverableService;
    private readonly employeeRepository;
    private readonly wbsItemRepository;
    private readonly logger;
    constructor(deliverableService: DeliverableService, employeeRepository: Repository<Employee>, wbsItemRepository: Repository<WbsItem>);
    execute(command: CreateDeliverableCommand): Promise<Deliverable>;
}
