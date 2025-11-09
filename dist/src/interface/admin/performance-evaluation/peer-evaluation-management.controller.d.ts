import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import type { AuthenticatedUser } from '@interface/decorators';
import { RequestPeerEvaluationDto, RequestPeerEvaluationToMultipleEvaluatorsDto, RequestMultiplePeerEvaluationsDto, PeerEvaluationFilterDto, PeerEvaluationResponseDto, BulkPeerEvaluationRequestResponseDto, PeerEvaluationListResponseDto, GetEvaluatorAssignedEvaluateesQueryDto, AssignedEvaluateeDto, UpsertPeerEvaluationAnswersDto, UpsertPeerEvaluationAnswersResponseDto } from './dto/peer-evaluation.dto';
export declare class PeerEvaluationManagementController {
    private readonly peerEvaluationBusinessService;
    constructor(peerEvaluationBusinessService: PeerEvaluationBusinessService);
    requestPeerEvaluation(dto: RequestPeerEvaluationDto): Promise<PeerEvaluationResponseDto>;
    requestPeerEvaluationToMultipleEvaluators(dto: RequestPeerEvaluationToMultipleEvaluatorsDto): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestMultiplePeerEvaluations(dto: RequestMultiplePeerEvaluationsDto): Promise<BulkPeerEvaluationRequestResponseDto>;
    submitPeerEvaluation(id: string, user: AuthenticatedUser): Promise<void>;
    getPeerEvaluations(filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getEvaluatorPeerEvaluations(evaluatorId: string, filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getEvaluateePeerEvaluations(evaluateeId: string, filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getAllPeerEvaluations(filter: PeerEvaluationFilterDto): Promise<PeerEvaluationListResponseDto>;
    getPeerEvaluationDetail(id: string): Promise<PeerEvaluationDetailResult>;
    getEvaluatorAssignedEvaluatees(evaluatorId: string, query: GetEvaluatorAssignedEvaluateesQueryDto): Promise<AssignedEvaluateeDto[]>;
    cancelPeerEvaluation(id: string): Promise<void>;
    cancelPeerEvaluationsByPeriod(evaluateeId: string, periodId: string): Promise<{
        message: string;
        cancelledCount: number;
    }>;
    upsertPeerEvaluationAnswers(id: string, dto: UpsertPeerEvaluationAnswersDto, user: AuthenticatedUser): Promise<UpsertPeerEvaluationAnswersResponseDto>;
}
