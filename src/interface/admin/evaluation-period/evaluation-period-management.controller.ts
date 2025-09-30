import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvaluationPeriodManagementContextService } from '../../../context/evaluation-period-management-context/evaluation-period-management.service';
import type {
  CreateEvaluationPeriodMinimalDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateEvaluationPeriodStartDateDto,
  UpdateEvaluationSetupDeadlineDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateGradeRangesDto,
  UpdateManualSettingPermissionsDto,
  UpdatePeerEvaluationDeadlineDto,
  UpdatePerformanceDeadlineDto,
  UpdateSelfEvaluationDeadlineDto,
  UpdateSelfEvaluationSettingPermissionDto,
} from '../../../context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import type { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import { ParseId } from '../../decorators/parse-uuid.decorator';
import {
  CompleteEvaluationPeriod,
  CreateEvaluationPeriod,
  DeleteEvaluationPeriod,
  GetActiveEvaluationPeriods,
  GetEvaluationPeriodDetail,
  GetEvaluationPeriods,
  StartEvaluationPeriod,
  UpdateCriteriaSettingPermission,
  UpdateEvaluationPeriodBasicInfo,
  UpdateEvaluationPeriodGradeRanges,
  UpdateEvaluationPeriodSchedule,
  UpdateEvaluationPeriodStartDate,
  UpdateEvaluationSetupDeadline,
  UpdateFinalEvaluationSettingPermission,
  UpdateManualSettingPermissions,
  UpdatePeerEvaluationDeadline,
  UpdatePerformanceDeadline,
  UpdateSelfEvaluationDeadline,
  UpdateSelfEvaluationSettingPermission,
} from './decorators/evaluation-period-api.decorators';
import {
  CreateEvaluationPeriodApiDto,
  ManualPermissionSettingDto,
  PaginationQueryDto,
  UpdateEvaluationPeriodBasicApiDto,
  UpdateEvaluationPeriodScheduleApiDto,
  UpdateEvaluationPeriodStartDateApiDto,
  UpdateEvaluationSetupDeadlineApiDto,
  UpdateGradeRangesApiDto,
  UpdateManualSettingPermissionsApiDto,
  UpdatePeerEvaluationDeadlineApiDto,
  UpdatePerformanceDeadlineApiDto,
  UpdateSelfEvaluationDeadlineApiDto,
} from './dto/evaluation-management.dto';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('A-1. 관리자 - 평가기간')
@Controller('admin/evaluation-periods')
// @UseGuards(AdminGuard) // TODO: 관리자 권한 가드 추가
export class EvaluationPeriodManagementController {
  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
  ) {}

  // ==================== GET: 조회 ====================

  /**
   * 활성화된 평가 기간 목록을 조회합니다.
   */
  @GetActiveEvaluationPeriods()
  async getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]> {
    return await this.evaluationPeriodManagementService.활성평가기간_조회한다();
  }

  /**
   * 평가 기간 목록을 페이징으로 조회합니다.
   */
  @GetEvaluationPeriods()
  async getEvaluationPeriods(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    return await this.evaluationPeriodManagementService.평가기간목록_조회한다(
      page,
      limit,
    );
  }

  /**
   * 평가 기간 상세 정보를 조회합니다.
   */
  @GetEvaluationPeriodDetail()
  async getEvaluationPeriodDetail(
    @ParseId() periodId: string,
  ): Promise<EvaluationPeriodDto | null> {
    return await this.evaluationPeriodManagementService.평가기간상세_조회한다(
      periodId,
    );
  }

  // ==================== POST: 생성 및 상태 변경 ====================

  /**
   * 새로운 평가 기간을 생성합니다.
   */
  @CreateEvaluationPeriod()
  async createEvaluationPeriod(
    @Body() createData: CreateEvaluationPeriodApiDto,
    // @CurrentUser() user: User, // TODO: 사용자 정보 데코레이터 추가
  ): Promise<EvaluationPeriodDto> {
    const createdBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: CreateEvaluationPeriodMinimalDto = {
      name: createData.name,
      startDate: createData.startDate as unknown as Date,
      peerEvaluationDeadline:
        createData.peerEvaluationDeadline as unknown as Date,
      description: createData.description,
      maxSelfEvaluationRate: createData.maxSelfEvaluationRate || 120,
      gradeRanges:
        createData.gradeRanges?.map((range) => ({
          grade: range.grade,
          minRange: range.minRange,
          maxRange: range.maxRange,
        })) || [],
    };
    return await this.evaluationPeriodManagementService.평가기간_생성한다(
      contextDto,
      createdBy,
    );
  }

  /**
   * 평가 기간을 시작합니다.
   */
  @StartEvaluationPeriod()
  async startEvaluationPeriod(
    @ParseId() periodId: string,
    // @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    const startedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const result =
      await this.evaluationPeriodManagementService.평가기간_시작한다(
        periodId,
        startedBy,
      );

    // NestJS boolean 직렬화 문제 해결을 위해 객체로 래핑
    return { success: Boolean(result) };
  }

  /**
   * 평가 기간을 완료합니다.
   */
  @CompleteEvaluationPeriod()
  async completeEvaluationPeriod(
    @ParseId() periodId: string,
    // @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    const completedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const result =
      await this.evaluationPeriodManagementService.평가기간_완료한다(
        periodId,
        completedBy,
      );

    // NestJS boolean 직렬화 문제 해결을 위해 객체로 래핑
    return { success: Boolean(result) };
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 평가 기간 기본 정보를 수정합니다.
   */
  @UpdateEvaluationPeriodBasicInfo()
  async updateEvaluationPeriodBasicInfo(
    @ParseId() periodId: string,
    @Body() updateData: UpdateEvaluationPeriodBasicApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateEvaluationPeriodBasicDto = {
      name: updateData.name,
      description: updateData.description,
      maxSelfEvaluationRate: updateData.maxSelfEvaluationRate,
    };
    return await this.evaluationPeriodManagementService.평가기간기본정보_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기간 일정을 수정합니다.
   */
  @UpdateEvaluationPeriodSchedule()
  async updateEvaluationPeriodSchedule(
    @ParseId() periodId: string,
    @Body() scheduleData: UpdateEvaluationPeriodScheduleApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateEvaluationPeriodScheduleDto = {
      startDate: scheduleData.startDate as unknown as Date,
      evaluationSetupDeadline:
        scheduleData.evaluationSetupDeadline as unknown as Date,
      performanceDeadline: scheduleData.performanceDeadline as unknown as Date,
      selfEvaluationDeadline:
        scheduleData.selfEvaluationDeadline as unknown as Date,
      peerEvaluationDeadline:
        scheduleData.peerEvaluationDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.평가기간일정_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기간 시작일을 수정합니다.
   */
  @UpdateEvaluationPeriodStartDate()
  async updateEvaluationPeriodStartDate(
    @ParseId() periodId: string,
    @Body() startDateData: UpdateEvaluationPeriodStartDateApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateEvaluationPeriodStartDateDto = {
      startDate: startDateData.startDate as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.평가기간시작일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가설정 단계 마감일을 수정합니다.
   */
  @UpdateEvaluationSetupDeadline()
  async updateEvaluationSetupDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdateEvaluationSetupDeadlineApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateEvaluationSetupDeadlineDto = {
      evaluationSetupDeadline:
        deadlineData.evaluationSetupDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.평가설정단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 업무 수행 단계 마감일을 수정합니다.
   */
  @UpdatePerformanceDeadline()
  async updatePerformanceDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdatePerformanceDeadlineApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdatePerformanceDeadlineDto = {
      performanceDeadline: deadlineData.performanceDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.업무수행단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 자기 평가 단계 마감일을 수정합니다.
   */
  @UpdateSelfEvaluationDeadline()
  async updateSelfEvaluationDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdateSelfEvaluationDeadlineApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateSelfEvaluationDeadlineDto = {
      selfEvaluationDeadline:
        deadlineData.selfEvaluationDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.자기평가단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 하향/동료평가 단계 마감일을 수정합니다.
   */
  @UpdatePeerEvaluationDeadline()
  async updatePeerEvaluationDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdatePeerEvaluationDeadlineApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdatePeerEvaluationDeadlineDto = {
      peerEvaluationDeadline:
        deadlineData.peerEvaluationDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.하향동료평가단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기간 등급 구간을 수정합니다.
   */
  @UpdateEvaluationPeriodGradeRanges()
  async updateEvaluationPeriodGradeRanges(
    @ParseId() periodId: string,
    @Body() gradeData: UpdateGradeRangesApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateGradeRangesDto = {
      gradeRanges: gradeData.gradeRanges.map((range) => ({
        grade: range.grade,
        minRange: range.minRange,
        maxRange: range.maxRange,
      })),
    };
    return await this.evaluationPeriodManagementService.평가기간등급구간_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기준 설정 수동 허용을 변경합니다.
   */
  @UpdateCriteriaSettingPermission()
  async updateCriteriaSettingPermission(
    @ParseId() periodId: string,
    @Body() permissionData: ManualPermissionSettingDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateCriteriaSettingPermissionDto = {
      enabled: permissionData.allowManualSetting,
    };
    return await this.evaluationPeriodManagementService.평가기준설정수동허용_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 자기 평가 설정 수동 허용을 변경합니다.
   */
  @UpdateSelfEvaluationSettingPermission()
  async updateSelfEvaluationSettingPermission(
    @ParseId() periodId: string,
    @Body() permissionData: ManualPermissionSettingDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateSelfEvaluationSettingPermissionDto = {
      enabled: permissionData.allowManualSetting,
    };
    return await this.evaluationPeriodManagementService.자기평가설정수동허용_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 최종 평가 설정 수동 허용을 변경합니다.
   */
  @UpdateFinalEvaluationSettingPermission()
  async updateFinalEvaluationSettingPermission(
    @ParseId() periodId: string,
    @Body() permissionData: ManualPermissionSettingDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateFinalEvaluationSettingPermissionDto = {
      enabled: permissionData.allowManualSetting,
    };
    return await this.evaluationPeriodManagementService.최종평가설정수동허용_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 전체 수동 허용 설정을 변경합니다.
   */
  @UpdateManualSettingPermissions()
  async updateManualSettingPermissions(
    @ParseId() periodId: string,
    @Body() permissionData: UpdateManualSettingPermissionsApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateManualSettingPermissionsDto = {
      criteriaSettingEnabled: permissionData.allowCriteriaManualSetting,
      selfEvaluationSettingEnabled:
        permissionData.allowSelfEvaluationManualSetting,
      finalEvaluationSettingEnabled:
        permissionData.allowFinalEvaluationManualSetting,
    };
    return await this.evaluationPeriodManagementService.전체수동허용설정_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  // ==================== DELETE: 삭제 ====================

  /**
   * 평가 기간을 삭제합니다.
   */
  @DeleteEvaluationPeriod()
  async deleteEvaluationPeriod(
    @ParseId() periodId: string,
    // @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    const deletedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const result =
      await this.evaluationPeriodManagementService.평가기간_삭제한다(
        periodId,
        deletedBy,
      );
    return { success: result };
  }
}
