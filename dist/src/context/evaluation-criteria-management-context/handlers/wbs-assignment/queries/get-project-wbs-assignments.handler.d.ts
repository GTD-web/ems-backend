import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class GetProjectWbsAssignmentsQuery {
    readonly projectId: string;
    readonly periodId: string;
    constructor(projectId: string, periodId: string);
}
export declare class GetProjectWbsAssignmentsHandler implements IQueryHandler<GetProjectWbsAssignmentsQuery> {
    private readonly wbsAssignmentRepository;
    constructor(wbsAssignmentRepository: Repository<EvaluationWbsAssignment>);
    execute(query: GetProjectWbsAssignmentsQuery): Promise<EvaluationWbsAssignmentDto[]>;
}
