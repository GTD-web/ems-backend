import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EmployeeInfoDto } from '@interface/admin/evaluation-criteria/dto/project-assignment.dto';
export declare class GetProjectAssignedEmployeesQuery {
    readonly projectId: string;
    readonly periodId: string;
    constructor(projectId: string, periodId: string);
}
export declare class GetProjectAssignedEmployeesHandler implements IQueryHandler<GetProjectAssignedEmployeesQuery> {
    private readonly projectAssignmentRepository;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>);
    execute(query: GetProjectAssignedEmployeesQuery): Promise<{
        employees: EmployeeInfoDto[];
    }>;
}
