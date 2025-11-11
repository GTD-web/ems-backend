import { IBaseEntity } from '@libs/database/base/base.entity';
import { EvaluationResponseType } from '../evaluation-response.types';
export interface IEvaluationResponse extends IBaseEntity {
    questionId: string;
    evaluationId: string;
    evaluationType: EvaluationResponseType;
    answer?: string;
    score?: number;
    응답내용업데이트한다(answer: string, updatedBy: string): void;
    응답점수업데이트한다(score: number, updatedBy: string): void;
    응답전체업데이트한다(answer?: string, score?: number, updatedBy?: string): void;
    질문일치하는가(questionId: string): boolean;
    평가일치하는가(evaluationId: string): boolean;
    평가유형일치하는가(evaluationType: EvaluationResponseType): boolean;
    자기평가인가(): boolean;
    동료평가인가(): boolean;
    하향평가인가(): boolean;
    추가평가인가(): boolean;
    응답내용있는가(): boolean;
    응답점수있는가(): boolean;
    완전한응답인가(): boolean;
    점수범위유효한가(minScore: number, maxScore: number): boolean;
}
