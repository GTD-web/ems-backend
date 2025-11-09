import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { ProjectInfoDto } from '@interface/admin/evaluation-criteria/dto/project-assignment.dto';
export declare class GetEmployeeProjectAssignmentsQuery {
    readonly employeeId: string;
    readonly periodId: string;
    constructor(employeeId: string, periodId: string);
}
export declare class GetEmployeeProjectAssignmentsHandler implements IQueryHandler<GetEmployeeProjectAssignmentsQuery> {
    private readonly projectAssignmentRepository;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>);
    execute(query: GetEmployeeProjectAssignmentsQuery): Promise<{
        projects: ProjectInfoDto[];
    }>;
}
