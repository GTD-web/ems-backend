import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { AssignedEvaluateeDto, BulkPeerEvaluationRequestResponseDto, GetEvaluatorAssignedEvaluateesQueryDto, PeerEvaluationFilterDto, PeerEvaluationListResponseDto, PeerEvaluationResponseDto, RequestMultiplePeerEvaluationsDto, RequestPeerEvaluationDto, RequestPeerEvaluationToMultipleEvaluatorsDto, UpsertPeerEvaluationAnswersDto, UpsertPeerEvaluationAnswersResponseDto } from './dto/peer-evaluation.dto';
export declare class PeerEvaluationManagementController {
    private readonly peerEvaluationBusinessService;
    constructor(peerEvaluationBusinessService: PeerEvaluationBusinessService);
    requestPeerEvaluation(dto: RequestPeerEvaluationDto, user: AuthenticatedUser): Promise<PeerEvaluationResponseDto>;
    requestPeerEvaluationToMultipleEvaluators(dto: RequestPeerEvaluationToMultipleEvaluatorsDto, user: AuthenticatedUser): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestMultiplePeerEvaluations(dto: RequestMultiplePeerEvaluationsDto, user: AuthenticatedUser): Promise<BulkPeerEvaluationRequestResponseDto>;
    submitPeerEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
    getPeerEvaluations(filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getEvaluatorPeerEvaluations(evaluatorId: string, filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getEvaluateePeerEvaluations(evaluateeId: string, filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getAllPeerEvaluations(filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getPeerEvaluationDetail(id: string): Promise<PeerEvaluationDetailResult>;
    getEvaluatorAssignedEvaluatees(evaluatorId: string, query: GetEvaluatorAssignedEvaluateesQueryDto): Promise<AssignedEvaluateeDto[]>;
    cancelPeerEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
    cancelPeerEvaluationsByPeriod(evaluateeId: string, periodId: string, user: AuthenticatedUser): Promise<{
        message: string;
        cancelledCount: number;
    }>;
    upsertPeerEvaluationAnswers(dto: UpsertPeerEvaluationAnswersDto, user: AuthenticatedUser): Promise<UpsertPeerEvaluationAnswersResponseDto>;
}
