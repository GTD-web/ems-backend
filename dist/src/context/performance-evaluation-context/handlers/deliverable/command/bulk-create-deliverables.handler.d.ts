import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DeliverableService } from '@domain/core/deliverable/deliverable.service';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
export interface BulkDeliverableData {
    name: string;
    type: DeliverableType;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
}
export declare class BulkCreateDeliverablesCommand {
    readonly deliverables: BulkDeliverableData[];
    readonly createdBy: string;
    constructor(deliverables: BulkDeliverableData[], createdBy: string);
}
export interface BulkCreateResult {
    successCount: number;
    failedCount: number;
    createdIds: string[];
    failedItems: Array<{
        data: Partial<BulkDeliverableData>;
        error: string;
    }>;
}
export declare class BulkCreateDeliverablesHandler implements ICommandHandler<BulkCreateDeliverablesCommand, BulkCreateResult> {
    private readonly deliverableService;
    private readonly employeeRepository;
    private readonly wbsItemRepository;
    private readonly logger;
    constructor(deliverableService: DeliverableService, employeeRepository: Repository<Employee>, wbsItemRepository: Repository<WbsItem>);
    execute(command: BulkCreateDeliverablesCommand): Promise<BulkCreateResult>;
}
