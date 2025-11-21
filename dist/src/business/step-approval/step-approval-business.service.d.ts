import { CommandBus } from '@nestjs/cqrs';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApproval } from '@/domain/sub/secondary-evaluation-step-approval';
export declare class StepApprovalBusinessService {
    private readonly performanceEvaluationService;
    private readonly stepApprovalContextService;
    private readonly commandBus;
    private readonly evaluationCriteriaManagementService;
    private readonly revisionRequestContextService;
    private readonly employeeSyncService;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, stepApprovalContextService: StepApprovalContextService, commandBus: CommandBus, evaluationCriteriaManagementService: EvaluationCriteriaManagementService, revisionRequestContextService: RevisionRequestContextService, employeeSyncService: EmployeeSyncService);
    자기평가_승인_시_제출상태_변경(evaluationPeriodId: string, employeeId: string, approvedBy: string): Promise<void>;
    일차_하향평가_승인_시_제출상태_변경(evaluationPeriodId: string, employeeId: string, approvedBy: string): Promise<void>;
    이차_하향평가_승인_시_제출상태_변경(evaluationPeriodId: string, employeeId: string, evaluatorId: string, approvedBy: string): Promise<void>;
    평가기준설정_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId: string, employeeId: string, revisionComment: string, updatedBy: string): Promise<void>;
    평가기준설정_승인_시_제출상태_변경(evaluationPeriodId: string, employeeId: string, approvedBy: string): Promise<void>;
    평가기준설정_확인상태를_변경한다(params: {
        evaluationPeriodId: string;
        employeeId: string;
        status: StepApprovalStatus;
        revisionComment?: string;
        updatedBy: string;
    }): Promise<void>;
    자기평가_확인상태를_변경한다(params: {
        evaluationPeriodId: string;
        employeeId: string;
        status: StepApprovalStatus;
        revisionComment?: string;
        updatedBy: string;
    }): Promise<void>;
    일차하향평가_확인상태를_변경한다(params: {
        evaluationPeriodId: string;
        employeeId: string;
        status: StepApprovalStatus;
        revisionComment?: string;
        updatedBy: string;
    }): Promise<void>;
    이차하향평가_확인상태를_변경한다(params: {
        evaluationPeriodId: string;
        employeeId: string;
        evaluatorId: string;
        status: StepApprovalStatus;
        revisionComment?: string;
        updatedBy: string;
    }): Promise<SecondaryEvaluationStepApproval>;
    자기평가_승인_시_하위평가들을_승인한다(evaluationPeriodId: string, employeeId: string, updatedBy: string): Promise<void>;
    일차하향평가_승인_시_하위평가들을_승인한다(evaluationPeriodId: string, employeeId: string, updatedBy: string): Promise<void>;
    일차하향평가_승인_시_상위평가를_승인한다(evaluationPeriodId: string, employeeId: string, updatedBy: string): Promise<void>;
    이차하향평가_승인_시_상위평가들을_승인한다(evaluationPeriodId: string, employeeId: string, updatedBy: string): Promise<void>;
}
