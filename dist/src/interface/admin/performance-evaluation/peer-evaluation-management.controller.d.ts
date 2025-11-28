import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { AssignedEvaluateeDto, BulkPeerEvaluationRequestResponseDto, GetEvaluatorAssignedEvaluateesQueryDto, PeerEvaluationFilterDto, PeerEvaluationListResponseDto, PeerEvaluationResponseDto, RequestMultiplePeerEvaluationsDto, RequestPartLeaderPeerEvaluationsDto, RequestEvaluatorsPeerEvaluationsDto, RequestPeerEvaluationDto, RequestPeerEvaluationToMultipleEvaluatorsDto, UpsertPeerEvaluationAnswersDto, UpsertPeerEvaluationAnswersResponseDto } from '@interface/common/dto/performance-evaluation/peer-evaluation.dto';
export declare class PeerEvaluationManagementController {
    private readonly peerEvaluationBusinessService;
    private readonly employeeSyncService;
    private readonly evaluationQuestionManagementService;
    constructor(peerEvaluationBusinessService: PeerEvaluationBusinessService, employeeSyncService: EmployeeSyncService, evaluationQuestionManagementService: EvaluationQuestionManagementService);
    requestPeerEvaluation(dto: RequestPeerEvaluationDto, user: AuthenticatedUser): Promise<PeerEvaluationResponseDto>;
    requestPeerEvaluationToMultipleEvaluators(dto: RequestPeerEvaluationToMultipleEvaluatorsDto, user: AuthenticatedUser): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestMultiplePeerEvaluations(dto: RequestMultiplePeerEvaluationsDto, user: AuthenticatedUser): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestPartLeaderPeerEvaluations(dto: RequestPartLeaderPeerEvaluationsDto, user: AuthenticatedUser): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestEvaluatorsPeerEvaluations(dto: RequestEvaluatorsPeerEvaluationsDto, user: AuthenticatedUser): Promise<BulkPeerEvaluationRequestResponseDto>;
    submitPeerEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
    getPeerEvaluations(filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getPeerEvaluationDetail(id: string): Promise<PeerEvaluationDetailResult>;
    getEvaluatorAssignedEvaluatees(evaluatorId: string, query: GetEvaluatorAssignedEvaluateesQueryDto): Promise<AssignedEvaluateeDto[]>;
    cancelPeerEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
    cancelPeerEvaluationsByPeriod(evaluateeId: string, periodId: string, user: AuthenticatedUser): Promise<{
        message: string;
        cancelledCount: number;
    }>;
    upsertPeerEvaluationAnswers(dto: UpsertPeerEvaluationAnswersDto, user: AuthenticatedUser): Promise<UpsertPeerEvaluationAnswersResponseDto>;
}
