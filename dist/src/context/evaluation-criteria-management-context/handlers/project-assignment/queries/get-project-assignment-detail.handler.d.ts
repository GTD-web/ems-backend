import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentDetailDto } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export declare class GetProjectAssignmentDetailQuery {
    readonly assignmentId: string;
    constructor(assignmentId: string);
}
export declare class GetProjectAssignmentDetailHandler implements IQueryHandler<GetProjectAssignmentDetailQuery> {
    private readonly projectAssignmentRepository;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>);
    execute(query: GetProjectAssignmentDetailQuery): Promise<EvaluationProjectAssignmentDetailDto | null>;
}
