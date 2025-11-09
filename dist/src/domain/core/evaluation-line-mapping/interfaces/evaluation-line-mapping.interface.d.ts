import { IBaseEntity } from '@libs/database/base/base.entity';
import { EvaluationLineMappingDto } from '../evaluation-line-mapping.types';
export interface IEvaluationLineMapping extends IBaseEntity {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId?: string;
    evaluationLineId: string;
    DTO로_변환한다(): EvaluationLineMappingDto;
    평가자를_변경한다(evaluatorId: string): void;
    평가라인을_변경한다(evaluationLineId: string): void;
    WBS항목을_변경한다(wbsItemId?: string): void;
    유효성을_검증한다(): boolean;
    WBS_기반_평가인가(): boolean;
    동일한_평가관계인가(evaluationPeriodId: string, employeeId: string, evaluatorId: string, wbsItemId?: string): boolean;
}
