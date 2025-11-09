import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from './evaluation-period-employee-mapping.entity';
import type { CreateEvaluationPeriodEmployeeMappingData, EvaluationPeriodEmployeeMappingFilter, ExcludeEvaluationTargetData, IncludeEvaluationTargetData } from './interfaces/evaluation-period-employee-mapping.interface';
import type { EvaluationPeriodEmployeeMappingDto } from './evaluation-period-employee-mapping.types';
import { IEvaluationPeriodEmployeeMappingService } from './interfaces/evaluation-period-employee-mapping-service.interface';
export declare class EvaluationPeriodEmployeeMappingService implements IEvaluationPeriodEmployeeMappingService {
    private readonly repository;
    private readonly logger;
    constructor(repository: Repository<EvaluationPeriodEmployeeMapping>);
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
    private 맵핑을_조회한다;
    평가기간별_모든_평가_수정_가능_상태를_변경한다(evaluationPeriodId: string, isSelfEvaluationEditable: boolean, isPrimaryEvaluationEditable: boolean, isSecondaryEvaluationEditable: boolean, updatedBy: string): Promise<number>;
    private 중복_검사를_수행한다;
    private 유효성을_검사한다;
}
