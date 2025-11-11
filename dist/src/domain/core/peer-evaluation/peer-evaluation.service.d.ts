import { Repository } from 'typeorm';
import { PeerEvaluation } from './peer-evaluation.entity';
import type { CreatePeerEvaluationData, UpdatePeerEvaluationData, PeerEvaluationFilter } from './peer-evaluation.types';
export declare class PeerEvaluationService {
    private readonly peerEvaluationRepository;
    private readonly logger;
    constructor(peerEvaluationRepository: Repository<PeerEvaluation>);
    생성한다(createData: CreatePeerEvaluationData): Promise<PeerEvaluation>;
    수정한다(id: string, updateData: UpdatePeerEvaluationData, updatedBy: string): Promise<PeerEvaluation>;
    취소한다(id: string, cancelledBy: string): Promise<PeerEvaluation>;
    일괄_취소한다(ids: string[], cancelledBy: string): Promise<PeerEvaluation[]>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    조회한다(id: string): Promise<PeerEvaluation | null>;
    필터_조회한다(filter: PeerEvaluationFilter): Promise<PeerEvaluation[]>;
    완료한다(id: string, completedBy: string): Promise<PeerEvaluation>;
    진행중으로_변경한다(id: string, updatedBy: string): Promise<PeerEvaluation>;
    피평가자별_조회한다(evaluateeId: string): Promise<PeerEvaluation[]>;
    평가자별_조회한다(evaluatorId: string): Promise<PeerEvaluation[]>;
    평가기간별_조회한다(periodId: string): Promise<PeerEvaluation[]>;
    활성화한다(id: string, activatedBy: string): Promise<PeerEvaluation>;
    비활성화한다(id: string, deactivatedBy: string): Promise<PeerEvaluation>;
    private 자기_자신_평가_방지_검사;
    private 중복_검사를_수행한다;
    private 유효성을_검사한다;
}
