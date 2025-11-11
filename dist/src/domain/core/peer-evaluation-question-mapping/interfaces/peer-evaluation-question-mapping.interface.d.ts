import type { IBaseEntity } from '@libs/database/base/base.entity';
export interface IPeerEvaluationQuestionMapping extends IBaseEntity {
    peerEvaluationId: string;
    questionId: string;
    questionGroupId?: string;
    displayOrder: number;
    표시순서변경한다(displayOrder: number, updatedBy: string): void;
    동료평가가_일치하는가(peerEvaluationId: string): boolean;
    질문이_일치하는가(questionId: string): boolean;
    그룹단위로_추가되었는가(): boolean;
    질문그룹이_일치하는가(questionGroupId: string): boolean;
}
