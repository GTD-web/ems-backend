import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
import type { AuthenticatedUser } from '@interface/decorators';
import { RequestPeerEvaluationDto, RequestPeerEvaluationToMultipleEvaluatorsDto, RequestMultiplePeerEvaluationsDto, RequestPartLeaderPeerEvaluationsDto, PeerEvaluationFilterDto, PeerEvaluationResponseDto, BulkPeerEvaluationRequestResponseDto, PeerEvaluationListResponseDto, GetEvaluatorAssignedEvaluateesQueryDto, AssignedEvaluateeDto, UpsertPeerEvaluationAnswersDto, UpsertPeerEvaluationAnswersResponseDto } from './dto/peer-evaluation.dto';
export declare class PeerEvaluationManagementController {
    private readonly peerEvaluationBusinessService;
    private readonly employeeSyncService;
    private readonly evaluationQuestionManagementService;
    constructor(peerEvaluationBusinessService: PeerEvaluationBusinessService, employeeSyncService: EmployeeSyncService, evaluationQuestionManagementService: EvaluationQuestionManagementService);
    requestPeerEvaluation(dto: RequestPeerEvaluationDto): Promise<PeerEvaluationResponseDto>;
    requestPeerEvaluationToMultipleEvaluators(dto: RequestPeerEvaluationToMultipleEvaluatorsDto): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestMultiplePeerEvaluations(dto: RequestMultiplePeerEvaluationsDto): Promise<BulkPeerEvaluationRequestResponseDto>;
    requestPartLeaderPeerEvaluations(dto: RequestPartLeaderPeerEvaluationsDto): Promise<BulkPeerEvaluationRequestResponseDto>;
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
