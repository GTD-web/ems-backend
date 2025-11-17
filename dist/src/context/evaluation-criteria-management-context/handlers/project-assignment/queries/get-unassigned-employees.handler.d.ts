import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EmployeeInfoDto } from '@/interface/common/dto/evaluation-criteria/project-assignment.dto';
export declare class GetUnassignedEmployeesQuery {
    readonly periodId: string;
    readonly projectId?: string | undefined;
    constructor(periodId: string, projectId?: string | undefined);
}
export declare class GetUnassignedEmployeesHandler implements IQueryHandler<GetUnassignedEmployeesQuery> {
    private readonly projectAssignmentRepository;
    private readonly employeeRepository;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>, employeeRepository: Repository<Employee>);
    execute(query: GetUnassignedEmployeesQuery): Promise<{
        periodId: string;
        projectId?: string;
        employees: EmployeeInfoDto[];
    }>;
}
