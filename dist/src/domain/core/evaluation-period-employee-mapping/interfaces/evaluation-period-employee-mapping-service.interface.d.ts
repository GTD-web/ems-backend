import { CreateEvaluationPeriodEmployeeMappingData, EvaluationPeriodEmployeeMappingFilter, ExcludeEvaluationTargetData, IncludeEvaluationTargetData } from './evaluation-period-employee-mapping.interface';
import { EvaluationPeriodEmployeeMappingDto } from '../evaluation-period-employee-mapping.types';
export interface IEvaluationPeriodEmployeeMappingService {
    평가대상자를_등록한다(data: CreateEvaluationPeriodEmployeeMappingData): Promise<EvaluationPeriodEmployeeMappingDto>;
    평가대상자를_대량_등록한다(evaluationPeriodId: string, employeeIds: string[], createdBy: string): Promise<EvaluationPeriodEmployeeMappingDto[]>;
    평가대상에서_제외한다(evaluationPeriodId: string, employeeId: string, data: ExcludeEvaluationTargetData): Promise<EvaluationPeriodEmployeeMappingDto>;
    평가대상에_포함한다(evaluationPeriodId: string, employeeId: string, data: IncludeEvaluationTargetData): Promise<EvaluationPeriodEmployeeMappingDto>;
    평가기간의_평가대상자를_조회한다(evaluationPeriodId: string, includeExcluded?: boolean): Promise<EvaluationPeriodEmployeeMappingDto[]>;
    평가기간의_제외된_대상자를_조회한다(evaluationPeriodId: string): Promise<EvaluationPeriodEmployeeMappingDto[]>;
    직원의_평가기간_맵핑을_조회한다(employeeId: string): Promise<EvaluationPeriodEmployeeMappingDto[]>;
    평가대상_여부를_확인한다(evaluationPeriodId: string, employeeId: string): Promise<boolean>;
    평가대상자_등록을_해제한다(evaluationPeriodId: string, employeeId: string): Promise<boolean>;
    평가기간의_모든_대상자를_해제한다(evaluationPeriodId: string): Promise<number>;
    필터로_평가대상자를_조회한다(filter: EvaluationPeriodEmployeeMappingFilter): Promise<EvaluationPeriodEmployeeMappingDto[]>;
}
