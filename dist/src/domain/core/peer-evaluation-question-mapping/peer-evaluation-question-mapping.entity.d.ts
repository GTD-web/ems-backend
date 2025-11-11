import { BaseEntity } from '@libs/database/base/base.entity';
import { IPeerEvaluationQuestionMapping } from './interfaces/peer-evaluation-question-mapping.interface';
import type { PeerEvaluationQuestionMappingDto, CreatePeerEvaluationQuestionMappingDto } from './peer-evaluation-question-mapping.types';
export declare class PeerEvaluationQuestionMapping extends BaseEntity<PeerEvaluationQuestionMappingDto> implements IPeerEvaluationQuestionMapping {
    peerEvaluationId: string;
    questionId: string;
    questionGroupId?: string;
    displayOrder: number;
    answer?: string;
    score?: number;
    answeredAt?: Date;
    answeredBy?: string;
    constructor(data?: CreatePeerEvaluationQuestionMappingDto & {
        createdBy: string;
    });
    표시순서변경한다(displayOrder: number, updatedBy: string): void;
    동료평가가_일치하는가(peerEvaluationId: string): boolean;
    질문이_일치하는가(questionId: string): boolean;
    그룹단위로_추가되었는가(): boolean;
    질문그룹이_일치하는가(questionGroupId: string): boolean;
    답변이_있는가(): boolean;
    답변을_저장한다(answer: string, answeredBy: string, score?: number): void;
    답변을_삭제한다(deletedBy: string): void;
    DTO로_변환한다(): PeerEvaluationQuestionMappingDto;
}
