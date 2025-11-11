import type { AuthenticatedUser } from '../../decorators';
import { ProjectService } from '../../../domain/common/project/project.service';
import type { ProjectDto } from '../../../domain/common/project/project.types';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { PerformanceEvaluationService } from '../../../context/performance-evaluation-context/performance-evaluation.service';
import type { BulkDeleteResultDto } from '../performance-evaluation/dto/deliverable.dto';
export declare class AdminUtilsController {
    private readonly projectService;
    private readonly evaluationCriteriaManagementService;
    private readonly performanceEvaluationService;
    constructor(projectService: ProjectService, evaluationCriteriaManagementService: EvaluationCriteriaManagementService, performanceEvaluationService: PerformanceEvaluationService);
    getAllProjects(): Promise<ProjectDto[]>;
    resetAllWbsEvaluationCriteria(user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    resetAllDeliverables(user: AuthenticatedUser): Promise<BulkDeleteResultDto>;
    resetAllProjectAssignments(user: AuthenticatedUser): Promise<any>;
    resetAllEvaluationLines(user: AuthenticatedUser): Promise<any>;
}
