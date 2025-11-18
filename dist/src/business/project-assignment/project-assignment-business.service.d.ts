import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import type { EvaluationProjectAssignmentDto, CreateEvaluationProjectAssignmentData } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export declare class ProjectAssignmentBusinessService {
    private readonly evaluationCriteriaManagementService;
    private readonly activityLogContextService;
    private readonly logger;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, activityLogContextService: EvaluationActivityLogContextService);
    프로젝트를_할당한다(data: CreateEvaluationProjectAssignmentData, assignedBy: string): Promise<EvaluationProjectAssignmentDto>;
    프로젝트를_대량으로_할당한다(assignments: CreateEvaluationProjectAssignmentData[], assignedBy: string): Promise<EvaluationProjectAssignmentDto[]>;
    프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;
    프로젝트_할당을_프로젝트_ID로_취소한다(employeeId: string, projectId: string, periodId: string, cancelledBy: string): Promise<void>;
}
