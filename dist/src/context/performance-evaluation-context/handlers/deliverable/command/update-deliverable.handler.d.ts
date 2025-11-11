import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
export declare class UpdateDeliverableCommand {
    readonly id: string;
    readonly updatedBy: string;
    readonly name?: string | undefined;
    readonly type?: DeliverableType | undefined;
    readonly description?: string | undefined;
    readonly filePath?: string | undefined;
    readonly employeeId?: string | undefined;
    readonly wbsItemId?: string | undefined;
    readonly isActive?: boolean | undefined;
    constructor(id: string, updatedBy: string, name?: string | undefined, type?: DeliverableType | undefined, description?: string | undefined, filePath?: string | undefined, employeeId?: string | undefined, wbsItemId?: string | undefined, isActive?: boolean | undefined);
}
export declare class UpdateDeliverableHandler implements ICommandHandler<UpdateDeliverableCommand, Deliverable> {
    private readonly deliverableService;
    private readonly employeeRepository;
    private readonly wbsItemRepository;
    private readonly logger;
    constructor(deliverableService: DeliverableService, employeeRepository: Repository<Employee>, wbsItemRepository: Repository<WbsItem>);
    execute(command: UpdateDeliverableCommand): Promise<Deliverable>;
}
