import type { EvaluatorType, EvaluationLineDto } from '../evaluation-line.types';
import { IBaseEntity } from '@libs/database/base/base.entity';
export interface IEvaluationLine extends IBaseEntity {
    evaluatorType: EvaluatorType;
    order: number;
    isRequired: boolean;
    isAutoAssigned: boolean;
    DTO로_변환한다(): EvaluationLineDto;
    평가자_유형을_변경한다(evaluatorType: EvaluatorType): void;
    평가_순서를_변경한다(order: number): void;
    필수_평가자_여부를_변경한다(isRequired: boolean): void;
    자동_할당_여부를_변경한다(isAutoAssigned: boolean): void;
    유효성을_검증한다(): boolean;
}
