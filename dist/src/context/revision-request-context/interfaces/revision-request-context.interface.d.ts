import type { EvaluationRevisionRequestDto, EvaluationRevisionRequestRecipientDto, RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';
export interface RevisionRequestWithDetailsDto {
    request: EvaluationRevisionRequestDto;
    recipientInfo: EvaluationRevisionRequestRecipientDto;
    employee: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentName?: string;
        rankName?: string;
    };
    evaluationPeriod: {
        id: string;
        name: string;
    };
}
export interface GetRevisionRequestsFilter {
    evaluationPeriodId?: string;
    employeeId?: string;
    requestedBy?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    step?: RevisionRequestStepType;
}
export interface IRevisionRequestContext {
    전체_재작성요청목록을_조회한다(filter?: GetRevisionRequestsFilter): Promise<RevisionRequestWithDetailsDto[]>;
    내_재작성요청목록을_조회한다(recipientId: string, filter?: GetRevisionRequestsFilter): Promise<RevisionRequestWithDetailsDto[]>;
    읽지않은_재작성요청수를_조회한다(recipientId: string): Promise<number>;
    재작성요청을_읽음처리한다(requestId: string, recipientId: string): Promise<void>;
    재작성완료_응답을_제출한다(requestId: string, recipientId: string, responseComment: string): Promise<void>;
    평가기간_직원_평가자로_재작성완료_응답을_제출한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, step: RevisionRequestStepType, responseComment: string): Promise<void>;
}
