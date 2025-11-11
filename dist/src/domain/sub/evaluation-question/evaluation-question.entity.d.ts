import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationQuestion } from './interfaces/evaluation-question.interface';
import type { EvaluationQuestionDto, CreateEvaluationQuestionDto } from './evaluation-question.types';
export declare class EvaluationQuestion extends BaseEntity<EvaluationQuestionDto> implements IEvaluationQuestion {
    text: string;
    minScore?: number;
    maxScore?: number;
    constructor(data?: CreateEvaluationQuestionDto & {
        createdBy: string;
    });
    질문내용업데이트한다(text: string, updatedBy: string): void;
    점수범위설정한다(minScore: number | null | undefined, maxScore: number | null | undefined, updatedBy: string): void;
    점수범위유효한가(): boolean;
    질문내용유효한가(): boolean;
    DTO로_변환한다(): EvaluationQuestionDto;
}
