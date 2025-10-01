import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import {
  ConfigureEmployeeWbsEvaluationLine,
  GetEmployeeEvaluationLineMappings,
  GetEmployeeEvaluationSettings,
  GetEvaluationLineList,
  GetEvaluatorEmployees,
  GetUpdaterEvaluationLineMappings,
} from './decorators/evaluation-line-api.decorators';
import {
  ConfigureEmployeeWbsEvaluationLineResponseDto,
  EmployeeEvaluationLineMappingsResponseDto,
  EmployeeEvaluationSettingsResponseDto,
  EvaluationLineDto,
  EvaluationLineFilterDto,
  EvaluatorEmployeesResponseDto,
} from './dto/evaluation-line.dto';

/**
 * 평가라인 관리 컨트롤러
 *
 * 평가라인 구성 및 조회 기능을 제공합니다.
 */
@ApiTags('B-3. 관리자 - 평가 설정 - 평가라인')
@Controller('admin/evaluation-criteria/evaluation-lines')
export class EvaluationLineManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  /**
   * 평가라인 목록 조회
   */
  @GetEvaluationLineList()
  async getEvaluationLineList(
    @Query() filter: EvaluationLineFilterDto,
  ): Promise<EvaluationLineDto[]> {
    return await this.evaluationCriteriaManagementService.평가라인_목록을_조회한다(
      {
        evaluatorType: filter.evaluatorType as any,
        requiredOnly: filter.isRequired,
        autoAssignedOnly: filter.isAutoAssigned,
      },
    );
  }

  /**
   * 직원 평가라인 매핑 조회
   */
  @GetEmployeeEvaluationLineMappings()
  async getEmployeeEvaluationLineMappings(
    @Param('employeeId') employeeId: string,
  ): Promise<EmployeeEvaluationLineMappingsResponseDto> {
    const mappings =
      await this.evaluationCriteriaManagementService.특정_직원의_평가라인_매핑을_조회한다(
        employeeId,
      );

    return {
      employeeId,
      mappings,
    };
  }

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
   * 수정자별 평가라인 매핑 조회
   */
  @GetUpdaterEvaluationLineMappings()
  async getUpdaterEvaluationLineMappings(
    @Param('updatedBy') updatedBy: string,
  ): Promise<any[]> {
    return await this.evaluationCriteriaManagementService.특정_사용자가_수정한_평가라인_매핑을_조회한다(
      updatedBy,
    );
  }

  /**
   * 직원-WBS별 평가라인 구성
   */
  @ConfigureEmployeeWbsEvaluationLine()
  async configureEmployeeWbsEvaluationLine(
    @Param('employeeId') employeeId: string,
    @Param('wbsItemId') wbsItemId: string,
    @Param('periodId') periodId: string,
    @Body() body: { createdBy?: string },
  ): Promise<ConfigureEmployeeWbsEvaluationLineResponseDto> {
    const createdBy = body.createdBy || uuidv4(); // DTO에서 받은 UUID 또는 임시 UUID 사용
    return await this.evaluationCriteriaManagementService.직원_WBS별_평가라인을_구성한다(
      employeeId,
      wbsItemId,
      periodId,
      createdBy,
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
}
