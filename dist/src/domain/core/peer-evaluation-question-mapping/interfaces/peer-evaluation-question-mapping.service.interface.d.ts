import { EntityManager } from 'typeorm';
import type { IPeerEvaluationQuestionMapping } from './peer-evaluation-question-mapping.interface';
import type { CreatePeerEvaluationQuestionMappingDto, UpdatePeerEvaluationQuestionMappingDto, PeerEvaluationQuestionMappingFilter } from '../peer-evaluation-question-mapping.types';
export interface IPeerEvaluationQuestionMappingService {
    ID로조회한다(id: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping | null>;
    동료평가의_질문목록을_조회한다(peerEvaluationId: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping[]>;
    질문이_사용된_동료평가목록을_조회한다(questionId: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping[]>;
    필터조회한다(filter: PeerEvaluationQuestionMappingFilter, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping[]>;
    생성한다(createDto: CreatePeerEvaluationQuestionMappingDto, createdBy: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping>;
    업데이트한다(id: string, updateDto: UpdatePeerEvaluationQuestionMappingDto, updatedBy: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    동료평가의_질문매핑을_전체삭제한다(peerEvaluationId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    매핑중복확인한다(peerEvaluationId: string, questionId: string, manager?: EntityManager): Promise<boolean>;
    동료평가의_질문개수를_조회한다(peerEvaluationId: string, manager?: EntityManager): Promise<number>;
    질문그룹의_질문들을_일괄추가한다(peerEvaluationId: string, questionGroupId: string, questionIds: string[], startDisplayOrder: number, createdBy: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping[]>;
    동료평가의_그룹질문목록을_조회한다(peerEvaluationId: string, questionGroupId: string, manager?: EntityManager): Promise<IPeerEvaluationQuestionMapping[]>;
}
