import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { PerformanceInputStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 성과입력_상태를_조회한다(evaluationPeriodId: string, employeeId: string, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>): Promise<{
    totalWbsCount: number;
    inputCompletedCount: number;
}>;
export declare function 성과입력_상태를_계산한다(totalWbsCount: number, inputCompletedCount: number): PerformanceInputStatus;
