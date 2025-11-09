import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { Project } from '@domain/common/project/project.entity';
import { EvaluationProjectAssignmentFilter } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export declare class GetProjectAssignmentListQuery {
    readonly filter: EvaluationProjectAssignmentFilter;
    constructor(filter: EvaluationProjectAssignmentFilter);
}
export interface ProjectAssignmentListResult {
    assignments: Array<{
        id: string;
        periodId: string;
        employeeId: string;
        employeeName: string;
        departmentName: string;
        projectId: string;
        projectName: string;
        assignedDate: Date;
        assignedBy: string;
        assignedByName: string;
        displayOrder: number;
    }>;
    totalCount: number;
    page: number;
    limit: number;
}
export declare class GetProjectAssignmentListHandler implements IQueryHandler<GetProjectAssignmentListQuery> {
    private readonly projectAssignmentRepository;
    private readonly employeeRepository;
    private readonly departmentRepository;
    private readonly projectRepository;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>, employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>, projectRepository: Repository<Project>);
    execute(query: GetProjectAssignmentListQuery): Promise<ProjectAssignmentListResult>;
    private createQueryBuilder;
}
