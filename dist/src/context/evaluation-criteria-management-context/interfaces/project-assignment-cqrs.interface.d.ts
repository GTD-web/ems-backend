import { EvaluationProjectAssignmentDto, CreateEvaluationProjectAssignmentData, UpdateEvaluationProjectAssignmentData, EvaluationProjectAssignmentFilter } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export interface IProjectAssignmentCommandService {
    프로젝트를_할당한다(data: CreateEvaluationProjectAssignmentData, assignedBy: string): Promise<EvaluationProjectAssignmentDto>;
    프로젝트_할당을_수정한다(id: string, data: UpdateEvaluationProjectAssignmentData, updatedBy: string): Promise<EvaluationProjectAssignmentDto>;
    프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;
    프로젝트를_대량으로_할당한다(assignments: CreateEvaluationProjectAssignmentData[], assignedBy: string): Promise<EvaluationProjectAssignmentDto[]>;
    평가기간의_프로젝트_할당을_초기화한다(periodId: string, resetBy: string): Promise<void>;
}
export interface IProjectAssignmentQueryService {
    프로젝트_할당_목록을_조회한다(filter: EvaluationProjectAssignmentFilter): Promise<EvaluationProjectAssignmentDto[]>;
    프로젝트_할당_상세를_조회한다(assignmentId: string): Promise<EvaluationProjectAssignmentDto | null>;
    직원의_프로젝트_할당을_조회한다(employeeId: string, periodId: string): Promise<EvaluationProjectAssignmentDto[]>;
    할당되지_않은_직원_목록을_조회한다(periodId: string, projectId?: string): Promise<string[]>;
    프로젝트에_할당된_직원을_조회한다(projectId: string, periodId: string): Promise<EvaluationProjectAssignmentDto[]>;
}
export interface IProjectAssignmentCQRSService extends IProjectAssignmentCommandService, IProjectAssignmentQueryService {
    프로젝트_할당_유효성을_검증한다(data: CreateEvaluationProjectAssignmentData): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    프로젝트_할당_권한을_확인한다(userId: string, action: 'create' | 'update' | 'delete', targetData?: {
        periodId?: string;
        employeeId?: string;
        projectId?: string;
    }): Promise<boolean>;
}
