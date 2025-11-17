import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '@interface/common/decorators/public.decorator';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';

/**
 * 크론 작업 컨트롤러
 *
 * Vercel 환경에서 크론 작업을 실행하기 위한 HTTP 엔드포인트를 제공합니다.
 * 모든 엔드포인트는 Public으로 설정되어 있지만, Vercel Cron Secret을 통해 보안을 유지합니다.
 */
@ApiTags('Public - 크론 작업')
@Controller('cron')
@Public()
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
    private readonly employeeSyncService: EmployeeSyncService,
    private readonly departmentSyncService: DepartmentSyncService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Vercel Cron Secret 검증
   */
  private validateCronSecret(authHeader: string | undefined): void {
    const cronSecret = this.configService.get<string>('CRON_SECRET');
    
    if (!cronSecret) {
      this.logger.warn('CRON_SECRET이 설정되지 않았습니다. 보안을 위해 설정을 권장합니다.');
      return; // CRON_SECRET이 없으면 검증을 건너뜀 (개발 환경)
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    
    if (authHeader !== expectedAuth) {
      this.logger.warn(`잘못된 크론 시크릿: ${authHeader}`);
      throw new UnauthorizedException('Invalid cron secret');
    }
  }

  /**
   * 평가기간 자동 단계 변경 크론 작업
   * Vercel Cron: 매 시간 실행
   */
  @Get('evaluation-period-auto-phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '평가기간 자동 단계 변경 크론 작업',
    description: '매 시간마다 실행되어 평가기간의 단계를 자동으로 전이합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '평가기간 자동 단계 변경 완료',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (잘못된 크론 시크릿)',
  })
  async triggerEvaluationPeriodAutoPhase(
    @Headers('authorization') authHeader: string | undefined,
  ) {
    this.validateCronSecret(authHeader);

    const isVercel = !!this.configService.get('VERCEL');
    
    if (!isVercel) {
      this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
      return { message: 'Vercel 환경이 아닙니다.' };
    }

    try {
      const count = await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();
      return {
        success: true,
        message: `평가기간 자동 단계 변경 완료: ${count}개 평가기간 전이됨`,
        transitionedCount: count,
      };
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 직원 동기화 크론 작업
   * Vercel Cron: 10분마다 실행
   */
  @Get('employee-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '직원 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 직원 데이터를 동기화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '직원 동기화 완료',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (잘못된 크론 시크릿)',
  })
  async triggerEmployeeSync(
    @Headers('authorization') authHeader: string | undefined,
  ) {
    this.validateCronSecret(authHeader);

    const isVercel = !!this.configService.get('VERCEL');
    
    if (!isVercel) {
      this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
      return { message: 'Vercel 환경이 아닙니다.' };
    }

    try {
      await this.employeeSyncService.scheduledSync();
      return {
        success: true,
        message: '직원 동기화 완료',
      };
    } catch (error) {
      this.logger.error('직원 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 부서 동기화 크론 작업
   * Vercel Cron: 10분마다 실행
   */
  @Get('department-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '부서 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 부서 데이터를 동기화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '부서 동기화 완료',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (잘못된 크론 시크릿)',
  })
  async triggerDepartmentSync(
    @Headers('authorization') authHeader: string | undefined,
  ) {
    this.validateCronSecret(authHeader);

    const isVercel = !!this.configService.get('VERCEL');
    
    if (!isVercel) {
      this.logger.warn('이 엔드포인트는 Vercel 환경에서만 사용됩니다.');
      return { message: 'Vercel 환경이 아닙니다.' };
    }

    try {
      await this.departmentSyncService.scheduledSync();
      return {
        success: true,
        message: '부서 동기화 완료',
      };
    } catch (error) {
      this.logger.error('부서 동기화 실패:', error);
      throw error;
    }
  }

}

