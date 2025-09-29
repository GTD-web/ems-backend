import {
  CreateEvaluationPeriodDto,
  EvaluationPeriodDto,
} from '../../../domain/core/evaluation-period/evaluation-period.types';
import {
  CreateEvaluationPeriodMinimalDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateGradeRangesDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateSelfEvaluationSettingPermissionDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateManualSettingPermissionsDto,
} from './evaluation-period-creation.interface';

/**
 * 평가 기간 관리 컨텍스트 인터페이스
 *
 * 평가 기간의 생명주기 관리를 위한 비즈니스 기능을 정의합니다.
 */
export interface IEvaluationPeriodManagementContext {
  /**
   * 평가 기간을 생성한다 (최소 필수 정보만)
   *
   * @param createData 평가 기간 생성 최소 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 평가 기간 정보
   */
  평가기간_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간을 시작한다
   *
   * @param periodId 평가 기간 ID
   * @param startedBy 시작한 사용자 ID
   * @returns 시작 성공 여부
   */
  평가기간_시작한다(periodId: string, startedBy: string): Promise<boolean>;

  /**
   * 평가 기간을 완료한다
   *
   * @param periodId 평가 기간 ID
   * @param completedBy 완료한 사용자 ID
   * @returns 완료 성공 여부
   */
  평가기간_완료한다(periodId: string, completedBy: string): Promise<boolean>;

  /**
   * 평가 기간 기본 정보를 수정한다
   *
   * @param periodId 평가 기간 ID
   * @param updateData 기본 정보 수정 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 평가 기간 정보
   */
  평가기간기본정보_수정한다(
    periodId: string,
    updateData: UpdateEvaluationPeriodBasicDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간 일정을 수정한다
   *
   * @param periodId 평가 기간 ID
   * @param scheduleData 일정 수정 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 평가 기간 정보
   */
  평가기간일정_수정한다(
    periodId: string,
    scheduleData: UpdateEvaluationPeriodScheduleDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간 등급 구간을 수정한다
   *
   * @param periodId 평가 기간 ID
   * @param gradeData 등급 구간 수정 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 평가 기간 정보
   */
  평가기간등급구간_수정한다(
    periodId: string,
    gradeData: UpdateGradeRangesDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간을 삭제한다
   *
   * @param periodId 평가 기간 ID
   * @param deletedBy 삭제자 ID
   * @returns 삭제 성공 여부
   */
  평가기간_삭제한다(periodId: string, deletedBy: string): Promise<boolean>;

  /**
   * 활성 평가 기간을 조회한다
   *
   * @returns 활성 평가 기간 목록
   */
  활성평가기간_조회한다(): Promise<EvaluationPeriodDto[]>;

  /**
   * 평가 기간 상세 정보를 조회한다
   *
   * @param periodId 평가 기간 ID
   * @returns 평가 기간 상세 정보
   */
  평가기간상세_조회한다(periodId: string): Promise<EvaluationPeriodDto | null>;

  /**
   * 평가 기간 목록을 조회한다
   *
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @returns 평가 기간 목록
   */
  평가기간목록_조회한다(
    page: number,
    limit: number,
  ): Promise<{
    items: EvaluationPeriodDto[];
    total: number;
    page: number;
    limit: number;
  }>;

  // ==================== 수동 허용 설정 관리 ====================

  /**
   * 평가 기준 설정 수동 허용을 변경한다
   *
   * @param periodId 평가 기간 ID
   * @param permissionData 평가 기준 설정 수동 허용 데이터
   * @param changedBy 변경자 ID
   * @returns 변경된 평가 기간 정보
   */
  평가기준설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateCriteriaSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 자기 평가 설정 수동 허용을 변경한다
   *
   * @param periodId 평가 기간 ID
   * @param permissionData 자기 평가 설정 수동 허용 데이터
   * @param changedBy 변경자 ID
   * @returns 변경된 평가 기간 정보
   */
  자기평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateSelfEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 최종 평가 설정 수동 허용을 변경한다
   *
   * @param periodId 평가 기간 ID
   * @param permissionData 최종 평가 설정 수동 허용 데이터
   * @param changedBy 변경자 ID
   * @returns 변경된 평가 기간 정보
   */
  최종평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateFinalEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 전체 수동 허용 설정을 변경한다
   *
   * @param periodId 평가 기간 ID
   * @param permissionData 전체 수동 허용 설정 데이터
   * @param changedBy 변경자 ID
   * @returns 변경된 평가 기간 정보
   */
  전체수동허용설정_변경한다(
    periodId: string,
    permissionData: UpdateManualSettingPermissionsDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;
}
