import { BaseEntity } from '@libs/database/base/base.entity';
import type { IEvaluationResponse } from './interfaces/evaluation-response.interface';
import { EvaluationResponseType, type EvaluationResponseDto, type CreateEvaluationResponseDto } from './evaluation-response.types';
export declare class EvaluationResponse extends BaseEntity<EvaluationResponseDto> implements IEvaluationResponse {
    questionId: string;
    evaluationId: string;
    evaluationType: EvaluationResponseType;
    answer?: string;
    score?: number;
    constructor(data?: CreateEvaluationResponseDto & {
        createdBy: string;
    });
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
    DTO로_변환한다(): EvaluationResponseDto;
}
