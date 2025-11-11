import { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto, UpdateEvaluationPeriodBasicDto, UpdateEvaluationPeriodScheduleDto, UpdateGradeRangesDto, UpdateCriteriaSettingPermissionDto, UpdateSelfEvaluationSettingPermissionDto, UpdateFinalEvaluationSettingPermissionDto, UpdateManualSettingPermissionsDto } from './evaluation-period-creation.interface';
import { EvaluationPeriodListResult } from '../handlers/evaluation-period/queries/get-evaluation-period-list.handler';
export interface IEvaluationPeriodCommandService {
    평가기간_생성한다(createData: CreateEvaluationPeriodMinimalDto, createdBy: string): Promise<EvaluationPeriodDto>;
    평가기간_시작한다(periodId: string, startedBy: string): Promise<boolean>;
    평가기간_완료한다(periodId: string, completedBy: string): Promise<boolean>;
    평가기간_삭제한다(periodId: string, deletedBy: string): Promise<boolean>;
    평가기간기본정보_수정한다(periodId: string, updateData: UpdateEvaluationPeriodBasicDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기간일정_수정한다(periodId: string, scheduleData: UpdateEvaluationPeriodScheduleDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기간등급구간_수정한다(periodId: string, gradeData: UpdateGradeRangesDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기준설정수동허용_변경한다(periodId: string, permissionData: UpdateCriteriaSettingPermissionDto, changedBy: string): Promise<EvaluationPeriodDto>;
    자기평가설정수동허용_변경한다(periodId: string, permissionData: UpdateSelfEvaluationSettingPermissionDto, changedBy: string): Promise<EvaluationPeriodDto>;
    최종평가설정수동허용_변경한다(periodId: string, permissionData: UpdateFinalEvaluationSettingPermissionDto, changedBy: string): Promise<EvaluationPeriodDto>;
    전체수동허용설정_변경한다(periodId: string, permissionData: UpdateManualSettingPermissionsDto, changedBy: string): Promise<EvaluationPeriodDto>;
}
export interface IEvaluationPeriodQueryService {
    활성평가기간_조회한다(): Promise<EvaluationPeriodDto[]>;
    평가기간상세_조회한다(periodId: string): Promise<EvaluationPeriodDto | null>;
    평가기간목록_조회한다(page: number, limit: number): Promise<EvaluationPeriodListResult>;
}
