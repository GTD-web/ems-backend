import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { FinalEvaluationStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 최종평가를_조회한다(evaluationPeriodId: string, employeeId: string, finalEvaluationRepository: Repository<FinalEvaluation>): Promise<FinalEvaluation | null>;
export declare function 최종평가_상태를_계산한다(finalEvaluation: FinalEvaluation | null): FinalEvaluationStatus;
