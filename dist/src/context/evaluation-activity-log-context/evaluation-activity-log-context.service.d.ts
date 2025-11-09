import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
import type { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';
import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
import type { CreateEvaluationActivityLogRequest, GetEvaluationActivityLogListRequest, GetEvaluationActivityLogListResult } from './interfaces/evaluation-activity-log-context.interface';
export declare class EvaluationActivityLogContextService {
    private readonly activityLogService;
    private readonly employeeService;
    private readonly logger;
    constructor(activityLogService: EvaluationActivityLogService, employeeService: EmployeeService);
    활동내역을_기록한다(params: CreateEvaluationActivityLogRequest): Promise<EvaluationActivityLogDto>;
    평가기간_피평가자_활동내역을_조회한다(params: GetEvaluationActivityLogListRequest): Promise<GetEvaluationActivityLogListResult>;
    단계승인_상태변경_활동내역을_기록한다(params: {
        evaluationPeriodId: string;
        employeeId: string;
        step: string;
        status: StepApprovalStatus;
        revisionComment?: string;
        updatedBy: string;
        evaluatorId?: string;
    }): Promise<EvaluationActivityLogDto>;
    재작성완료_활동내역을_기록한다(params: {
        evaluationPeriodId: string;
        employeeId: string;
        step: RevisionRequestStepType;
        requestId: string;
        performedBy: string;
        responseComment: string;
        allCompleted: boolean;
    }): Promise<EvaluationActivityLogDto>;
    private 액션을_텍스트로_변환한다;
    private 객체명을_추출한다;
    private 조사를_결정한다;
}
