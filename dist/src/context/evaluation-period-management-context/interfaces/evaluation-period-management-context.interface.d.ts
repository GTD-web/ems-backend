import { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto, UpdateCriteriaSettingPermissionDto, UpdateEvaluationPeriodBasicDto, UpdateEvaluationPeriodScheduleDto, UpdateEvaluationPeriodStartDateDto, UpdateEvaluationSetupDeadlineDto, UpdateFinalEvaluationSettingPermissionDto, UpdateGradeRangesDto, UpdateManualSettingPermissionsDto, UpdatePeerEvaluationDeadlineDto, UpdatePerformanceDeadlineDto, UpdateSelfEvaluationDeadlineDto, UpdateSelfEvaluationSettingPermissionDto } from './evaluation-period-creation.interface';
export interface IEvaluationPeriodManagementContext {
    평가기간_생성한다(createData: CreateEvaluationPeriodMinimalDto, createdBy: string): Promise<EvaluationPeriodDto>;
    평가기간_시작한다(periodId: string, startedBy: string): Promise<boolean>;
    평가기간_완료한다(periodId: string, completedBy: string): Promise<boolean>;
    평가기간기본정보_수정한다(periodId: string, updateData: UpdateEvaluationPeriodBasicDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기간일정_수정한다(periodId: string, scheduleData: UpdateEvaluationPeriodScheduleDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가설정단계마감일_수정한다(periodId: string, deadlineData: UpdateEvaluationSetupDeadlineDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    업무수행단계마감일_수정한다(periodId: string, deadlineData: UpdatePerformanceDeadlineDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    자기평가단계마감일_수정한다(periodId: string, deadlineData: UpdateSelfEvaluationDeadlineDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    하향동료평가단계마감일_수정한다(periodId: string, deadlineData: UpdatePeerEvaluationDeadlineDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기간시작일_수정한다(periodId: string, startDateData: UpdateEvaluationPeriodStartDateDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기간등급구간_수정한다(periodId: string, gradeData: UpdateGradeRangesDto, updatedBy: string): Promise<EvaluationPeriodDto>;
    평가기간_삭제한다(periodId: string, deletedBy: string): Promise<boolean>;
    활성평가기간_조회한다(): Promise<EvaluationPeriodDto[]>;
    평가기간상세_조회한다(periodId: string): Promise<EvaluationPeriodDto | null>;
    평가기간목록_조회한다(page: number, limit: number): Promise<{
        items: EvaluationPeriodDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    평가기준설정수동허용_변경한다(periodId: string, permissionData: UpdateCriteriaSettingPermissionDto, changedBy: string): Promise<EvaluationPeriodDto>;
    자기평가설정수동허용_변경한다(periodId: string, permissionData: UpdateSelfEvaluationSettingPermissionDto, changedBy: string): Promise<EvaluationPeriodDto>;
    최종평가설정수동허용_변경한다(periodId: string, permissionData: UpdateFinalEvaluationSettingPermissionDto, changedBy: string): Promise<EvaluationPeriodDto>;
    전체수동허용설정_변경한다(periodId: string, permissionData: UpdateManualSettingPermissionsDto, changedBy: string): Promise<EvaluationPeriodDto>;
}
