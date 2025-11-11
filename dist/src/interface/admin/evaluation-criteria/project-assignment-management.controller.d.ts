import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { BulkCreateProjectAssignmentDto, ChangeProjectAssignmentOrderQueryDto, CancelProjectAssignmentByProjectDto, ChangeProjectAssignmentOrderByProjectDto, CreateProjectAssignmentDto, EmployeeProjectsResponseDto, GetAvailableProjectsQueryDto, GetUnassignedEmployeesQueryDto, ProjectAssignmentFilterDto, ProjectAssignmentResponseDto, ProjectEmployeesResponseDto, UnassignedEmployeesResponseDto, AvailableProjectsResponseDto } from './dto/project-assignment.dto';
import type { AuthenticatedUser } from '../../decorators';
export declare class ProjectAssignmentManagementController {
    private readonly evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService);
    createProjectAssignment(createDto: CreateProjectAssignmentDto, user: AuthenticatedUser): Promise<any>;
    cancelProjectAssignment(id: string, user: AuthenticatedUser): Promise<void>;
    getProjectAssignmentList(filter: ProjectAssignmentFilterDto): Promise<any>;
    getEmployeeProjectAssignments(employeeId: string, periodId: string): Promise<EmployeeProjectsResponseDto>;
    getProjectAssignedEmployees(projectId: string, periodId: string): Promise<ProjectEmployeesResponseDto>;
    getUnassignedEmployees(query: GetUnassignedEmployeesQueryDto): Promise<UnassignedEmployeesResponseDto>;
    getAvailableProjects(query: GetAvailableProjectsQueryDto): Promise<AvailableProjectsResponseDto>;
    resetPeriodAssignments(periodId: string, user: AuthenticatedUser): Promise<any>;
    getProjectAssignmentDetail(id: string): Promise<any>;
    bulkCreateProjectAssignments(bulkCreateDto: BulkCreateProjectAssignmentDto, user: AuthenticatedUser): Promise<any[]>;
    changeProjectAssignmentOrder(id: string, queryDto: ChangeProjectAssignmentOrderQueryDto, user: AuthenticatedUser): Promise<ProjectAssignmentResponseDto>;
    cancelProjectAssignmentByProject(projectId: string, bodyDto: CancelProjectAssignmentByProjectDto, user: AuthenticatedUser): Promise<void>;
    changeProjectAssignmentOrderByProject(projectId: string, bodyDto: ChangeProjectAssignmentOrderByProjectDto, user: AuthenticatedUser): Promise<ProjectAssignmentResponseDto>;
}
