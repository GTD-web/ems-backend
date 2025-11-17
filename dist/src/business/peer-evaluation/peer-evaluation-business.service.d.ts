import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { PeerEvaluationDetailResult, EvaluatorAssignedEvaluatee } from '@context/performance-evaluation-context/handlers/peer-evaluation';
export declare class PeerEvaluationBusinessService {
    private readonly performanceEvaluationService;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService);
    동료평가를_요청한다(params: {
        evaluatorId: string;
        evaluateeId: string;
        periodId: string;
        requestDeadline?: Date;
        questionIds?: string[];
        requestedBy: string;
    }): Promise<string>;
    여러_평가자에게_동료평가를_요청한다(params: {
        evaluatorIds: string[];
        evaluateeId: string;
        periodId: string;
        requestDeadline?: Date;
        questionIds?: string[];
        requestedBy: string;
    }): Promise<{
        results: Array<{
            evaluatorId: string;
            evaluateeId: string;
            success: boolean;
            evaluationId?: string;
            error?: {
                code: string;
                message: string;
            };
        }>;
        summary: {
            total: number;
            success: number;
            failed: number;
        };
    }>;
    여러_피평가자에_대한_동료평가를_요청한다(params: {
        evaluatorId: string;
        evaluateeIds: string[];
        periodId: string;
        requestDeadline?: Date;
        questionIds?: string[];
        requestedBy: string;
    }): Promise<{
        results: Array<{
            evaluatorId: string;
            evaluateeId: string;
            success: boolean;
            evaluationId?: string;
            error?: {
                code: string;
                message: string;
            };
        }>;
        summary: {
            total: number;
            success: number;
            failed: number;
        };
    }>;
    파트장들_간_동료평가를_요청한다(params: {
        periodId: string;
        partLeaderIds: string[];
        requestDeadline?: Date;
        questionIds?: string[];
        requestedBy: string;
    }): Promise<{
        results: Array<{
            evaluatorId: string;
            evaluateeId: string;
            success: boolean;
            evaluationId?: string;
            error?: {
                code: string;
                message: string;
            };
        }>;
        summary: {
            total: number;
            success: number;
            failed: number;
            partLeaderCount: number;
        };
    }>;
    동료평가를_생성한다(params: {
        evaluatorId: string;
        evaluateeId: string;
        periodId: string;
        projectId: string;
        peerEvaluationContent?: string;
        peerEvaluationScore?: number;
        createdBy: string;
    }): Promise<string>;
    동료평가를_수정한다(params: {
        evaluationId: string;
        peerEvaluationContent?: string;
        peerEvaluationScore?: number;
        updatedBy: string;
    }): Promise<void>;
    동료평가_요청을_취소한다(params: {
        evaluationId: string;
        cancelledBy: string;
    }): Promise<void>;
    피평가자의_동료평가_요청을_일괄_취소한다(params: {
        evaluateeId: string;
        periodId: string;
        cancelledBy: string;
    }): Promise<{
        cancelledCount: number;
    }>;
    동료평가를_제출한다(params: {
        evaluationId: string;
        submittedBy: string;
    }): Promise<void>;
    동료평가_목록을_조회한다(params: {
        evaluatorId?: string;
        evaluateeId?: string;
        periodId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<any>;
    동료평가_상세정보를_조회한다(params: {
        evaluationId: string;
    }): Promise<PeerEvaluationDetailResult>;
    평가자에게_할당된_피평가자_목록을_조회한다(params: {
        evaluatorId: string;
        periodId?: string;
        includeCompleted?: boolean;
    }): Promise<EvaluatorAssignedEvaluatee[]>;
    동료평가_답변을_저장한다(params: {
        peerEvaluationId: string;
        answers: Array<{
            questionId: string;
            answer: string;
            score?: number;
        }>;
        answeredBy: string;
    }): Promise<{
        savedCount: number;
    }>;
}
