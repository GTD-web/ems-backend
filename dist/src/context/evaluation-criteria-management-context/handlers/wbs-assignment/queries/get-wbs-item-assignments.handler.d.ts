import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class GetWbsItemAssignmentsQuery {
    readonly wbsItemId: string;
    readonly periodId: string;
    constructor(wbsItemId: string, periodId: string);
}
export declare class GetWbsItemAssignmentsHandler implements IQueryHandler<GetWbsItemAssignmentsQuery> {
    private readonly wbsAssignmentRepository;
    constructor(wbsAssignmentRepository: Repository<EvaluationWbsAssignment>);
    execute(query: GetWbsItemAssignmentsQuery): Promise<EvaluationWbsAssignmentDto[]>;
}
