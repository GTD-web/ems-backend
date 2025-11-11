import { BaseEntity } from '@libs/database/base/base.entity';
import { IFinalEvaluation } from './interfaces/final-evaluation.interface';
import { FinalEvaluationDto, JobGrade, JobDetailedGrade } from './final-evaluation.types';
export declare class FinalEvaluation extends BaseEntity<FinalEvaluationDto> implements IFinalEvaluation {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
    isConfirmed: boolean;
    confirmedAt?: Date | null;
    confirmedBy?: string | null;
    DTO로_변환한다(): FinalEvaluationDto;
    평가등급을_변경한다(evaluationGrade: string, updatedBy?: string): void;
    직무등급을_변경한다(jobGrade: JobGrade, updatedBy?: string): void;
    직무_상세등급을_변경한다(jobDetailedGrade: JobDetailedGrade, updatedBy?: string): void;
    최종_평가_의견을_변경한다(finalComments: string, updatedBy?: string): void;
    평가를_확정한다(confirmedBy: string): void;
    평가_확정을_취소한다(updatedBy: string): void;
    확정되었는가(): boolean;
    수정_가능한가(): boolean;
    유효성을_검증한다(): boolean;
}
