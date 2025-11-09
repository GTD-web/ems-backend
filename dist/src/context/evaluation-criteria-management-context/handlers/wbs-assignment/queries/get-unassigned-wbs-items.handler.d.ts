import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
export declare class GetUnassignedWbsItemsQuery {
    readonly projectId: string;
    readonly periodId: string;
    readonly employeeId?: string | undefined;
    constructor(projectId: string, periodId: string, employeeId?: string | undefined);
}
export declare class GetUnassignedWbsItemsHandler implements IQueryHandler<GetUnassignedWbsItemsQuery> {
    private readonly wbsAssignmentRepository;
    private readonly wbsItemRepository;
    constructor(wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsItemRepository: Repository<WbsItem>);
    execute(query: GetUnassignedWbsItemsQuery): Promise<WbsItemDto[]>;
}
