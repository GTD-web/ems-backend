import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class GetEmployeeWbsAssignmentsQuery {
    readonly employeeId: string;
    readonly periodId: string;
    constructor(employeeId: string, periodId: string);
}
export declare class GetEmployeeWbsAssignmentsHandler implements IQueryHandler<GetEmployeeWbsAssignmentsQuery> {
    private readonly wbsAssignmentRepository;
    constructor(wbsAssignmentRepository: Repository<EvaluationWbsAssignment>);
    execute(query: GetEmployeeWbsAssignmentsQuery): Promise<EvaluationWbsAssignmentDto[]>;
}
