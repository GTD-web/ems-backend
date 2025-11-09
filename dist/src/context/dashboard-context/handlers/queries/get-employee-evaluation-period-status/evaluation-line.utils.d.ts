import { Repository } from 'typeorm';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLineStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 평가라인_지정_여부를_확인한다(evaluationPeriodId: string, employeeId: string, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>): Promise<{
    hasPrimaryEvaluator: boolean;
    hasSecondaryEvaluator: boolean;
}>;
export declare function 평가라인_상태를_계산한다(hasPrimaryEvaluator: boolean, hasSecondaryEvaluator: boolean): EvaluationLineStatus;
