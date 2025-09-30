import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EvaluationPeriodManagementContextService } from '../../context/evaluation-period-management-context/evaluation-period-management.service';
import type {
  CreateEvaluationPeriodMinimalDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateGradeRangesDto,
  UpdateManualSettingPermissionsDto,
  UpdateSelfEvaluationSettingPermissionDto,
} from '../../context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import type { EvaluationPeriodDto } from '../../domain/core/evaluation-period/evaluation-period.types';
import {
  CreateEvaluationPeriodApiDto,
  ManualPermissionSettingDto,
  PaginationQueryDto,
  UpdateEvaluationPeriodBasicApiDto,
  UpdateEvaluationPeriodScheduleApiDto,
  UpdateGradeRangesApiDto,
  UpdateManualSettingPermissionsApiDto,
} from './dto/evaluation-management.dto';
import {
  EvaluationPeriodResponseDto,
  EvaluationPeriodListResponseDto,
} from './dto/evaluation-period-response.dto';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('Admin - Evaluation Management')
@Controller('admin/evaluation-period-management')
// @UseGuards(AdminGuard) // TODO: 관리자 권한 가드 추가
export class EvaluationPeriodManagementController {
  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
  ) {}

  /**
   * 새로운 평가 기간을 생성합니다.
   */
  @Post('evaluation-periods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '평가 기간 생성',
    description: '새로운 평가 기간을 생성합니다. 관리자 권한이 필요합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '평가 기간이 성공적으로 생성되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 409, description: '중복된 평가 기간명입니다.' })
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

  // ==================== 평가 기간 조회 ====================

  /**
   * 활성화된 평가 기간 목록을 조회합니다.
   */
  @Get('evaluation-periods/active')
  @ApiOperation({
    summary: '활성 평가 기간 조회',
    description: '현재 진행 중인 평가 기간 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '활성 평가 기간 목록',
    type: [EvaluationPeriodResponseDto],
  })
  async getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]> {
    return await this.evaluationPeriodManagementService.활성평가기간_조회한다();
  }

  /**
   * 평가 기간 목록을 페이징으로 조회합니다.
   */
  @Get('evaluation-periods')
  @ApiOperation({
    summary: '평가 기간 목록 조회',
    description: '평가 기간 목록을 페이징으로 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 크기 (기본값: 10)',
  })
  @ApiResponse({
    status: 200,
    description: '평가 기간 목록',
    type: EvaluationPeriodListResponseDto,
  })
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
  @Get('evaluation-periods/:id')
  @ApiOperation({
    summary: '평가 기간 상세 조회',
    description: '특정 평가 기간의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 상세 정보',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  async getEvaluationPeriodDetail(
    @Param('id') periodId: string,
  ): Promise<EvaluationPeriodDto | null> {
    return await this.evaluationPeriodManagementService.평가기간상세_조회한다(
      periodId,
    );
  }

  // ==================== 평가 기간 수정 ====================

  /**
   * 평가 기간 기본 정보를 수정합니다.
   */
  @Put('evaluation-periods/:id/basic-info')
  @ApiOperation({
    summary: '평가 기간 기본 정보 수정',
    description:
      '평가 기간의 이름, 설명, 자기평가 달성률 등 기본 정보를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 기본 정보가 성공적으로 수정되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  async updateEvaluationPeriodBasicInfo(
    @Param('id') periodId: string,
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
  @Put('evaluation-periods/:id/schedule')
  @ApiOperation({
    summary: '평가 기간 일정 수정',
    description: '평가 기간의 각 단계별 마감일을 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 일정이 성공적으로 수정되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  async updateEvaluationPeriodSchedule(
    @Param('id') periodId: string,
    @Body() scheduleData: UpdateEvaluationPeriodScheduleApiDto,
    // @CurrentUser() user: User,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    const contextDto: UpdateEvaluationPeriodScheduleDto = {
      endDate: scheduleData.endDate as unknown as Date,
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
   * 평가 기간 등급 구간을 수정합니다.
   */
  @Put('evaluation-periods/:id/grade-ranges')
  @ApiOperation({
    summary: '평가 기간 등급 구간 수정',
    description: '평가 기간의 등급 구간 설정을 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 등급 구간이 성공적으로 수정되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  async updateEvaluationPeriodGradeRanges(
    @Param('id') periodId: string,
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

  // ==================== 평가 기간 생명주기 관리 ====================

  /**
   * 평가 기간을 시작합니다.
   */
  @Post('evaluation-periods/:id/start')
  @ApiOperation({
    summary: '평가 기간 시작',
    description: '대기 중인 평가 기간을 시작합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간이 성공적으로 시작되었습니다.',
    schema: { type: 'boolean' },
  })
  @ApiResponse({
    status: 400,
    description: '평가 기간을 시작할 수 없는 상태입니다.',
  })
  async startEvaluationPeriod(
    @Param('id') periodId: string,
    // @CurrentUser() user: User,
  ): Promise<boolean> {
    const startedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationPeriodManagementService.평가기간_시작한다(
      periodId,
      startedBy,
    );
  }

  /**
   * 평가 기간을 완료합니다.
   */
  @Post('evaluation-periods/:id/complete')
  @ApiOperation({
    summary: '평가 기간 완료',
    description: '종결 단계에 있는 평가 기간을 완료합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간이 성공적으로 완료되었습니다.',
    schema: { type: 'boolean' },
  })
  @ApiResponse({
    status: 400,
    description: '평가 기간을 완료할 수 없는 상태입니다.',
  })
  async completeEvaluationPeriod(
    @Param('id') periodId: string,
    // @CurrentUser() user: User,
  ): Promise<boolean> {
    const completedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationPeriodManagementService.평가기간_완료한다(
      periodId,
      completedBy,
    );
  }

  /**
   * 평가 기간을 삭제합니다.
   */
  @Delete('evaluation-periods/:id')
  @ApiOperation({
    summary: '평가 기간 삭제',
    description: '평가 기간을 삭제합니다. 주의: 이 작업은 되돌릴 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간이 성공적으로 삭제되었습니다.',
    schema: { type: 'boolean' },
  })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  async deleteEvaluationPeriod(
    @Param('id') periodId: string,
    // @CurrentUser() user: User,
  ): Promise<boolean> {
    const deletedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationPeriodManagementService.평가기간_삭제한다(
      periodId,
      deletedBy,
    );
  }

  // ==================== 수동 허용 설정 관리 ====================

  /**
   * 평가 기준 설정 수동 허용을 변경합니다.
   */
  @Put('evaluation-periods/:id/settings/criteria-permission')
  @ApiOperation({
    summary: '평가 기준 설정 수동 허용 변경',
    description: '평가 기준 설정의 수동 허용 여부를 변경합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기준 설정 수동 허용이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  async updateCriteriaSettingPermission(
    @Param('id') periodId: string,
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
  @Put('evaluation-periods/:id/settings/self-evaluation-permission')
  @ApiOperation({
    summary: '자기 평가 설정 수동 허용 변경',
    description: '자기 평가 설정의 수동 허용 여부를 변경합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '자기 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  async updateSelfEvaluationSettingPermission(
    @Param('id') periodId: string,
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
  @Put('evaluation-periods/:id/settings/final-evaluation-permission')
  @ApiOperation({
    summary: '최종 평가 설정 수동 허용 변경',
    description: '최종 평가 설정의 수동 허용 여부를 변경합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '최종 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  async updateFinalEvaluationSettingPermission(
    @Param('id') periodId: string,
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
  @Put('evaluation-periods/:id/settings/manual-permissions')
  @ApiOperation({
    summary: '전체 수동 허용 설정 변경',
    description: '모든 수동 허용 설정을 한 번에 변경합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '전체 수동 허용 설정이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  async updateManualSettingPermissions(
    @Param('id') periodId: string,
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
}
