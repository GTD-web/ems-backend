import { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import {
  CreateEvaluationPeriodMinimalDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateGradeRangesDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateSelfEvaluationSettingPermissionDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateManualSettingPermissionsDto,
} from './evaluation-period-creation.interface';
import { EvaluationPeriodListResult } from '../handlers/evaluation-period/queries/get-evaluation-period-list.handler';

/**
 * 평가 기간 관리 커맨드 서비스 인터페이스
 *
 * 데이터 변경 작업을 담당합니다.
 */
export interface IEvaluationPeriodCommandService {
  // ==================== 평가 기간 생명주기 커맨드 ====================

  /**
   * 평가 기간을 생성한다
   */
  평가기간_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간을 시작한다
   */
  평가기간_시작한다(periodId: string, startedBy: string): Promise<boolean>;

  /**
   * 평가 기간을 완료한다
   */
  평가기간_완료한다(periodId: string, completedBy: string): Promise<boolean>;

  /**
   * 평가 기간을 삭제한다
   */
  평가기간_삭제한다(periodId: string, deletedBy: string): Promise<boolean>;

  // ==================== 평가 기간 정보 수정 커맨드 ====================

  /**
   * 평가 기간 기본 정보를 수정한다
   */
  평가기간기본정보_수정한다(
    periodId: string,
    updateData: UpdateEvaluationPeriodBasicDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간 일정을 수정한다
   */
  평가기간일정_수정한다(
    periodId: string,
    scheduleData: UpdateEvaluationPeriodScheduleDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 평가 기간 등급 구간을 수정한다
   */
  평가기간등급구간_수정한다(
    periodId: string,
    gradeData: UpdateGradeRangesDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto>;

  // ==================== 수동 허용 설정 커맨드 ====================

  /**
   * 평가 기준 설정 수동 허용을 변경한다
   */
  평가기준설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateCriteriaSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 자기 평가 설정 수동 허용을 변경한다
   */
  자기평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateSelfEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 최종 평가 설정 수동 허용을 변경한다
   */
  최종평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateFinalEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;

  /**
   * 전체 수동 허용 설정을 변경한다
   */
  전체수동허용설정_변경한다(
    periodId: string,
    permissionData: UpdateManualSettingPermissionsDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto>;
}

/**
 * 평가 기간 관리 쿼리 서비스 인터페이스
 *
 * 데이터 조회 작업을 담당합니다.
 */
export interface IEvaluationPeriodQueryService {
  /**
   * 활성 평가 기간을 조회한다
   */
  활성평가기간_조회한다(): Promise<EvaluationPeriodDto[]>;

  /**
   * 평가 기간 상세 정보를 조회한다
   */
  평가기간상세_조회한다(periodId: string): Promise<EvaluationPeriodDto | null>;

  /**
   * 평가 기간 목록을 조회한다
   */
  평가기간목록_조회한다(
    page: number,
    limit: number,
  ): Promise<EvaluationPeriodListResult>;
}
