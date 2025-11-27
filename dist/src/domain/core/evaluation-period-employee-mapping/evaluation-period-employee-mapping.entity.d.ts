import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationPeriodEmployeeMapping } from './interfaces/evaluation-period-employee-mapping.interface';
import type { EvaluationPeriodEmployeeMappingDto, CreateEvaluationPeriodEmployeeMappingData } from './evaluation-period-employee-mapping.types';
export declare class EvaluationPeriodEmployeeMapping extends BaseEntity<EvaluationPeriodEmployeeMappingDto> implements IEvaluationPeriodEmployeeMapping {
    evaluationPeriodId: string;
    employeeId: string;
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    isCriteriaSubmitted: boolean;
    criteriaSubmittedAt?: Date | null;
    criteriaSubmittedBy?: string | null;
    isNewEnrolled: boolean;
    constructor(data?: CreateEvaluationPeriodEmployeeMappingData);
    해당_평가기간의_맵핑인가(evaluationPeriodId: string): boolean;
    해당_직원의_맵핑인가(employeeId: string): boolean;
    제외되었는가(): boolean;
    평가대상인가(): boolean;
    평가대상에서_제외한다(excludeReason: string, excludedBy: string): void;
    평가대상에_포함한다(updatedBy: string): void;
    제외사유를_수정한다(excludeReason: string, updatedBy: string): void;
    평가기준을_제출한다(submittedBy: string): void;
    평가기준_제출을_초기화한다(updatedBy: string): void;
    평가기준이_제출되었는가(): boolean;
    삭제한다(): void;
    DTO로_변환한다(): EvaluationPeriodEmployeeMappingDto;
}
