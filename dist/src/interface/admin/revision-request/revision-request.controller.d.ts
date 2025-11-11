import { CompleteRevisionRequestByEvaluatorQueryDto } from './dto/complete-revision-request-by-evaluator-query.dto';
import { RevisionRequestBusinessService } from '@business/revision-request/revision-request-business.service';
import { RevisionRequestContextService } from '@context/revision-request-context';
import { RevisionRequestResponseDto, UnreadCountResponseDto } from './dto/revision-request-response.dto';
import { GetRevisionRequestsQueryDto } from './dto/get-revision-requests-query.dto';
import { CompleteRevisionRequestDto } from './dto/complete-revision-request.dto';
import { CompleteRevisionRequestByEvaluatorDto } from './dto/complete-revision-request-by-evaluator.dto';
export declare class RevisionRequestController {
    private readonly revisionRequestBusinessService;
    private readonly revisionRequestContextService;
    constructor(revisionRequestBusinessService: RevisionRequestBusinessService, revisionRequestContextService: RevisionRequestContextService);
    getRevisionRequests(query: GetRevisionRequestsQueryDto): Promise<RevisionRequestResponseDto[]>;
    getMyRevisionRequests(query: GetRevisionRequestsQueryDto, recipientId: string): Promise<RevisionRequestResponseDto[]>;
    getMyUnreadCount(recipientId: string): Promise<UnreadCountResponseDto>;
    markAsRead(requestId: string, recipientId: string): Promise<void>;
    completeRevisionRequest(requestId: string, dto: CompleteRevisionRequestDto, recipientId: string): Promise<void>;
    completeRevisionRequestByEvaluator(evaluationPeriodId: string, employeeId: string, evaluatorId: string, queryDto: CompleteRevisionRequestByEvaluatorQueryDto, dto: CompleteRevisionRequestByEvaluatorDto): Promise<void>;
}
