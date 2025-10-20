import { Body, Controller, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../decorators/current-user.decorator';
import {
  ConfigurePrimaryEvaluator,
  ConfigureSecondaryEvaluator,
  GetEmployeeEvaluationSettings,
  GetEvaluatorEmployees,
} from './decorators/evaluation-line-api.decorators';
import {
  ConfigureEvaluatorResponseDto,
  ConfigurePrimaryEvaluatorDto,
  ConfigureSecondaryEvaluatorDto,
  EmployeeEvaluationSettingsResponseDto,
  EvaluatorEmployeesResponseDto,
} from './dto/evaluation-line.dto';

/**
 * 평가라인 관리 컨트롤러
 *
 * 평가라인 구성 및 조회 기능을 제공합니다.
 */
@ApiTags('B-4. 관리자 - 평가 설정 - 평가라인')
@ApiBearerAuth('Bearer')
@Controller('admin/evaluation-criteria/evaluation-lines')
export class EvaluationLineManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  /**
   * 평가자별 피평가자 조회
   */
  @GetEvaluatorEmployees()
  async getEvaluatorEmployees(
    @Param('evaluatorId') evaluatorId: string,
  ): Promise<EvaluatorEmployeesResponseDto> {
    return await this.evaluationCriteriaManagementService.특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(
      evaluatorId,
    );
  }

  /**
   * 직원 평가설정 통합 조회
   */
  @GetEmployeeEvaluationSettings()
  async getEmployeeEvaluationSettings(
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
  ): Promise<EmployeeEvaluationSettingsResponseDto> {
    const settings =
      await this.evaluationCriteriaManagementService.특정_평가기간에_직원의_평가설정을_통합_조회한다(
        employeeId,
        periodId,
      );

    return {
      employeeId,
      periodId,
      ...settings,
    };
  }

  /**
   * 1차 평가자 구성
   */
  @ConfigurePrimaryEvaluator()
  async configurePrimaryEvaluator(
    @Param('employeeId') employeeId: string,
    @Param('wbsItemId') wbsItemId: string,
    @Param('periodId') periodId: string,
    @Body() dto: ConfigurePrimaryEvaluatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfigureEvaluatorResponseDto> {
    return await this.evaluationCriteriaManagementService.일차_평가자를_구성한다(
      employeeId,
      wbsItemId,
      periodId,
      dto.evaluatorId,
      user.id,
    );
  }

  /**
   * 2차 평가자 구성
   */
  @ConfigureSecondaryEvaluator()
  async configureSecondaryEvaluator(
    @Param('employeeId') employeeId: string,
    @Param('wbsItemId') wbsItemId: string,
    @Param('periodId') periodId: string,
    @Body() dto: ConfigureSecondaryEvaluatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfigureEvaluatorResponseDto> {
    return await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(
      employeeId,
      wbsItemId,
      periodId,
      dto.evaluatorId,
      user.id,
    );
  }
}
