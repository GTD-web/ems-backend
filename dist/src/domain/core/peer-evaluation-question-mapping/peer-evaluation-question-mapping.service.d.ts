import { Repository } from 'typeorm';
import { PeerEvaluationQuestionMapping } from './peer-evaluation-question-mapping.entity';
import type { CreatePeerEvaluationQuestionMappingDto, UpdatePeerEvaluationQuestionMappingDto, PeerEvaluationQuestionMappingFilter } from './peer-evaluation-question-mapping.types';
import type { IPeerEvaluationQuestionMappingService } from './interfaces/peer-evaluation-question-mapping.service.interface';
export declare class PeerEvaluationQuestionMappingService implements IPeerEvaluationQuestionMappingService {
    private readonly mappingRepository;
    private readonly logger;
    constructor(mappingRepository: Repository<PeerEvaluationQuestionMapping>);
    ID로조회한다(id: string): Promise<PeerEvaluationQuestionMapping | null>;
    동료평가의_질문목록을_조회한다(peerEvaluationId: string): Promise<PeerEvaluationQuestionMapping[]>;
    질문이_사용된_동료평가목록을_조회한다(questionId: string): Promise<PeerEvaluationQuestionMapping[]>;
    필터조회한다(filter: PeerEvaluationQuestionMappingFilter): Promise<PeerEvaluationQuestionMapping[]>;
    생성한다(createDto: CreatePeerEvaluationQuestionMappingDto, createdBy: string): Promise<PeerEvaluationQuestionMapping>;
    업데이트한다(id: string, updateDto: UpdatePeerEvaluationQuestionMappingDto, updatedBy: string): Promise<PeerEvaluationQuestionMapping>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    동료평가의_질문매핑을_전체삭제한다(peerEvaluationId: string, deletedBy: string): Promise<void>;
    매핑중복확인한다(peerEvaluationId: string, questionId: string): Promise<boolean>;
    동료평가의_질문개수를_조회한다(peerEvaluationId: string): Promise<number>;
    질문그룹의_질문들을_일괄추가한다(peerEvaluationId: string, questionGroupId: string, questionIds: string[], startDisplayOrder: number, createdBy: string): Promise<PeerEvaluationQuestionMapping[]>;
    동료평가의_그룹질문목록을_조회한다(peerEvaluationId: string, questionGroupId: string): Promise<PeerEvaluationQuestionMapping[]>;
    동료평가와_질문으로_조회한다(peerEvaluationId: string, questionId: string): Promise<PeerEvaluationQuestionMapping | null>;
    저장한다(mapping: PeerEvaluationQuestionMapping): Promise<PeerEvaluationQuestionMapping>;
}
