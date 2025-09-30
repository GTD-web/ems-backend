import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
  EvaluationPeriodListResponseDto,
  EvaluationPeriodResponseDto,
} from './dto/evaluation-period-response.dto';
import { ParseId } from '../decorators/parse-uuid.decorator';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('관리자 - 평가기간관리')
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
  @Get('active')
  @ApiOperation({
    summary: '활성 평가 기간 조회',
    description: `**중요**: 오직 상태가 'in-progress'인 평가 기간만 반환됩니다. 대기 중('waiting')이나 완료된('completed') 평가 기간은 포함되지 않습니다.

**테스트 케이스:**
- 빈 상태: 활성 평가 기간이 없을 때 빈 배열 반환
- 다중 활성 기간: 여러 평가 기간 중 'in-progress' 상태인 기간만 필터링하여 반환
- 상태 확인: 반환된 평가 기간의 상태가 'in-progress'로 설정됨
- 완료된 기간 제외: 완료된('completed') 평가 기간은 활성 목록에서 제외됨
- 대기 중 기간 제외: 대기 중('waiting') 평가 기간은 활성 목록에 포함되지 않음
- 부분 완료: 여러 활성 기간 중 일부만 완료해도 나머지는 활성 목록에 유지됨`,
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
  @Get('')
  @ApiOperation({
    summary: '평가 기간 목록 조회',
    description: `**중요**: 모든 상태('waiting', 'in-progress', 'completed')의 평가 기간이 포함됩니다. 삭제된 평가 기간은 제외됩니다.

**테스트 케이스:**
- 빈 목록: 평가 기간이 없을 때 빈 배열과 페이징 정보 반환
- 다양한 평가 기간: 7개의 서로 다른 평가 기간을 3페이지로 나누어 조회
- 페이징 검증: 각 페이지의 항목들이 중복되지 않고 전체 개수가 일치함
- 페이지 범위 초과: 존재하지 않는 페이지 요청 시 빈 목록 반환
- 다양한 페이지 크기: 1, 2, 10개 등 다양한 limit 값으로 조회
- 모든 상태 포함: 대기, 진행 중, 완료된 평가 기간이 모두 목록에 포함됨
- 삭제된 기간 제외: 삭제된 평가 기간은 목록에서 제외됨
- 대용량 데이터: 15개 평가 기간으로 페이징 성능 테스트
- 특수 이름: 특수문자, 한글, 영문이 포함된 이름의 평가 기간 조회
- 에러 처리: 잘못된 페이지/limit 값(음수, 0, 문자열 등)에 대한 적절한 응답`,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1, 최소값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 크기 (기본값: 10, 최소값: 1)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: '평가 기간 목록 (페이징 정보 포함)',
    type: EvaluationPeriodListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 페이징 파라미터 (음수, 문자열 등)',
  })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
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
  @Get(':id')
  @ApiOperation({
    summary: '평가 기간 상세 조회',
    description: `**테스트 케이스:**
- 기본 조회: 존재하는 평가 기간의 상세 정보 조회 (등급 구간, 날짜 필드 포함)
- 존재하지 않는 ID: null 반환 (404가 아닌 200 상태로 null 반환)
- 다양한 상태: 대기('waiting'), 활성('in-progress'), 완료('completed') 상태별 조회
- 복잡한 등급 구간: 7개 등급(S+, S, A+, A, B+, B, C) 구간을 가진 평가 기간 조회
- 삭제된 평가 기간: 삭제된 평가 기간 조회 시 null 반환
- 에러 처리: 잘못된 UUID 형식, 특수문자, SQL 인젝션 시도 등에 대한 적절한 에러 응답`,
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID (UUID 형식)' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 상세 정보 (존재하지 않을 경우 null 반환)',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (잘못된 UUID 형식 등)',
  })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
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
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '평가 기간 생성',
    description: `**핵심 테스트 케이스:**
- 기본 생성: 필수 필드로 평가 기간 생성 (name, startDate, peerEvaluationDeadline)
- 복잡한 등급 구간: 다양한 등급(S+, S, A+, A, B+, B, C+, C, D) 구간 설정
- 최소 데이터: 필수 필드만으로 생성 (기본값 자동 적용)
- 필수 필드 누락: name, startDate, peerEvaluationDeadline 누락 시 400 에러
- 중복 이름: 동일한 평가 기간명으로 생성 시 409 에러
- 겹치는 날짜: 기존 평가 기간과 날짜 범위 겹침 시 409 에러
- 잘못된 데이터: 음수 비율, 잘못된 등급 구간 범위 등 검증 에러`,
  })
  @ApiResponse({
    status: 201,
    description: '평가 기간이 성공적으로 생성되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({
    status: 409,
    description: '중복된 평가 기간명 또는 겹치는 날짜 범위입니다.',
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (도메인 검증 실패 등)',
  })
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
  @Post(':id/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '평가 기간 시작',
    description: `**핵심 테스트 케이스:**
- 기본 시작: 대기 중인 평가 기간을 성공적으로 시작하여 'in-progress' 상태로 변경
- 활성 목록 반영: 시작된 평가 기간이 활성 목록에 즉시 나타남
- 복잡한 등급 구간: 다양한 등급 구간을 가진 평가 기간도 정상 시작
- 최소 데이터: 필수 필드만으로 생성된 평가 기간도 시작 가능
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 중복 시작: 이미 시작된 평가 기간 재시작 시 422 에러
- 동시성 처리: 동일한 평가 기간을 동시에 시작할 때 하나만 성공
- 데이터 무결성: 시작 후에도 기본 정보는 변경되지 않고 상태만 변경`,
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 201,
    description: '평가 기간이 성공적으로 시작되었습니다.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (잘못된 UUID 형식 등)',
  })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  @ApiResponse({
    status: 422,
    description:
      '평가 기간을 시작할 수 없는 상태입니다. (이미 시작됨 또는 완료됨)',
  })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
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
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '평가 기간 완료',
    description: '진행 중인 평가 기간을 완료합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간이 성공적으로 완료되었습니다.',
    schema: { type: 'boolean' },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
  })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  @ApiResponse({
    status: 422,
    description: '평가 기간을 완료할 수 없는 상태입니다. (이미 완료됨)',
  })
  async completeEvaluationPeriod(
    @ParseId() periodId: string,
    // @CurrentUser() user: User,
  ): Promise<boolean> {
    const completedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationPeriodManagementService.평가기간_완료한다(
      periodId,
      completedBy,
    );
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 평가 기간 기본 정보를 수정합니다.
   */
  @Patch(':id/basic-info')
  @ApiOperation({
    summary: '평가 기간 기본 정보 부분 수정',
    description:
      '평가 기간의 이름, 설명, 자기평가 달성률 등 기본 정보를 부분 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 기본 정보가 성공적으로 수정되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  @ApiResponse({
    status: 422,
    description: '비즈니스 로직 오류 (중복된 이름 등)',
  })
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
  @Patch(':id/schedule')
  @ApiOperation({
    summary: '평가 기간 일정 부분 수정',
    description: '평가 기간의 각 단계별 마감일을 부분 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 일정이 성공적으로 수정되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  @ApiResponse({
    status: 422,
    description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
  })
  async updateEvaluationPeriodSchedule(
    @ParseId() periodId: string,
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
  @Patch(':id/grade-ranges')
  @ApiOperation({
    summary: '평가 기간 등급 구간 수정',
    description: '평가 기간의 등급 구간 설정을 전체 교체합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기간 등급 구간이 성공적으로 수정되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  @ApiResponse({
    status: 422,
    description: '비즈니스 로직 오류 (잘못된 등급 구간 등)',
  })
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
  @Patch(':id/settings/criteria-permission')
  @ApiOperation({
    summary: '평가 기준 설정 수동 허용 부분 수정',
    description: '평가 기준 설정의 수동 허용 여부를 부분 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '평가 기준 설정 수동 허용이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
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
  @Patch(':id/settings/self-evaluation-permission')
  @ApiOperation({
    summary: '자기 평가 설정 수동 허용 부분 수정',
    description: '자기 평가 설정의 수동 허용 여부를 부분 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '자기 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
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
  @Patch(':id/settings/final-evaluation-permission')
  @ApiOperation({
    summary: '최종 평가 설정 수동 허용 부분 수정',
    description: '최종 평가 설정의 수동 허용 여부를 부분 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '최종 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
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
  @Patch(':id/settings/manual-permissions')
  @ApiOperation({
    summary: '전체 수동 허용 설정 부분 수정',
    description: '모든 수동 허용 설정을 부분적으로 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '평가 기간 ID' })
  @ApiResponse({
    status: 200,
    description: '전체 수동 허용 설정이 성공적으로 변경되었습니다.',
    type: EvaluationPeriodResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
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
  @Delete(':id')
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
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (잘못된 UUID 형식 등)',
  })
  @ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' })
  @ApiResponse({
    status: 422,
    description: '삭제할 수 없는 상태입니다. (진행 중인 평가 등)',
  })
  async deleteEvaluationPeriod(
    @ParseId() periodId: string,
    // @CurrentUser() user: User,
  ): Promise<boolean> {
    const deletedBy = 'admin'; // TODO: 실제 사용자 ID로 변경
    return await this.evaluationPeriodManagementService.평가기간_삭제한다(
      periodId,
      deletedBy,
    );
  }
}
