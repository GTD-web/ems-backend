import { ProjectAssignmentBusinessService } from '@business/project-assignment/project-assignment-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { AvailableProjectsResponseDto, BulkCreateProjectAssignmentDto, CancelProjectAssignmentByProjectDto, ChangeProjectAssignmentOrderByProjectDto, CreateProjectAssignmentDto, EmployeeProjectsResponseDto, GetAvailableProjectsQueryDto, GetUnassignedEmployeesQueryDto, ProjectAssignmentFilterDto, ProjectAssignmentResponseDto, ProjectEmployeesResponseDto, UnassignedEmployeesResponseDto } from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
export declare class ProjectAssignmentManagementController {
    private readonly evaluationCriteriaManagementService;
    private readonly projectAssignmentBusinessService;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, projectAssignmentBusinessService: ProjectAssignmentBusinessService);
    createProjectAssignment(createDto: CreateProjectAssignmentDto, user: AuthenticatedUser): Promise<any>;
    getProjectAssignmentList(filter: ProjectAssignmentFilterDto): Promise<any>;
    getEmployeeProjectAssignments(employeeId: string, periodId: string): Promise<EmployeeProjectsResponseDto>;
    getProjectAssignedEmployees(projectId: string, periodId: string): Promise<ProjectEmployeesResponseDto>;
    getUnassignedEmployees(query: GetUnassignedEmployeesQueryDto): Promise<UnassignedEmployeesResponseDto>;
    getAvailableProjects(query: GetAvailableProjectsQueryDto): Promise<AvailableProjectsResponseDto>;
    getProjectAssignmentDetail(id: string): Promise<any>;
    bulkCreateProjectAssignments(bulkCreateDto: BulkCreateProjectAssignmentDto, user: AuthenticatedUser): Promise<any[]>;
    cancelProjectAssignmentByProject(projectId: string, bodyDto: CancelProjectAssignmentByProjectDto, user: AuthenticatedUser): Promise<void>;
    changeProjectAssignmentOrderByProject(projectId: string, bodyDto: ChangeProjectAssignmentOrderByProjectDto, user: AuthenticatedUser): Promise<ProjectAssignmentResponseDto>;
}
