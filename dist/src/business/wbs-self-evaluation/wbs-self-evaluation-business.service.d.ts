import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import type { SubmitAllWbsSelfEvaluationsResponse, SubmitAllWbsSelfEvaluationsToEvaluatorResponse, ResetAllWbsSelfEvaluationsToEvaluatorResponse } from '@context/performance-evaluation-context/handlers/self-evaluation';
export declare class WbsSelfEvaluationBusinessService {
    private readonly performanceEvaluationService;
    private readonly revisionRequestContextService;
    private readonly stepApprovalContextService;
    private readonly activityLogContextService;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, revisionRequestContextService: RevisionRequestContextService, stepApprovalContextService: StepApprovalContextService, activityLogContextService: EvaluationActivityLogContextService);
    직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(employeeId: string, periodId: string, submittedBy: string): Promise<SubmitAllWbsSelfEvaluationsResponse>;
    자기평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId: string, employeeId: string, revisionComment: string, requestedBy: string): Promise<void>;
    직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId: string, periodId: string, submittedBy: string): Promise<SubmitAllWbsSelfEvaluationsToEvaluatorResponse>;
    직원의_전체_자기평가를_1차평가자_제출_취소한다(employeeId: string, periodId: string, resetBy: string): Promise<ResetAllWbsSelfEvaluationsToEvaluatorResponse>;
}
