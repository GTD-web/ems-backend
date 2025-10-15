import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvaluationPeriodManagementContextService } from '../../../context/evaluation-period-management-context/evaluation-period-management.service';
import { ParseUUID } from '../../decorators/parse-uuid.decorator';
import {
  CheckEvaluationTarget,
  ExcludeEvaluationTarget,
  GetEmployeeEvaluationPeriods,
  GetEvaluationTargets,
  GetExcludedEvaluationTargets,
  IncludeEvaluationTarget,
  RegisterBulkEvaluationTargets,
  RegisterEvaluationTarget,
  UnregisterAllEvaluationTargets,
  UnregisterEvaluationTarget,
} from './decorators/evaluation-target-api.decorators';
import {
  EvaluationTargetMappingResponseDto,
  EvaluationTargetStatusResponseDto,
  EvaluationTargetsResponseDto,
  ExcludeEvaluationTargetDto,
  GetEvaluationTargetsQueryDto,
  IncludeEvaluationTargetDto,
  RegisterBulkEvaluationTargetsDto,
  RegisterEvaluationTargetDto,
} from './dto/evaluation-target.dto';

/**
 * 평가 대상 관리 컨트롤러
 *
 * 평가기간별 평가 대상자 등록, 제외/포함, 조회 등을 처리하는 API 엔드포인트를 제공합니다.
 */
@ApiTags('A-3. 관리자 - 평가 대상')
@Controller('admin/evaluation-periods')
export class EvaluationTargetController {
  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
  ) {}

  /**
   * 평가 대상자 대량 등록
   *
   * 주의: 이 메서드는 단일 등록 메서드보다 먼저 정의되어야 합니다.
   * NestJS는 라우트를 순서대로 매칭하므로, /targets/bulk가 /targets/:employeeId보다 먼저 매칭되어야 합니다.
   */
  @RegisterBulkEvaluationTargets()
  async registerBulkEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @Body() dto: RegisterBulkEvaluationTargetsDto,
  ): Promise<EvaluationTargetMappingResponseDto[]> {
    return await this.evaluationPeriodManagementService.평가대상자_대량_등록한다(
      evaluationPeriodId,
      dto.employeeIds,
      dto.createdBy,
    );
  }

  /**
   * 평가 대상자 등록
   */
  @RegisterEvaluationTarget()
  async registerEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @Body() dto: RegisterEvaluationTargetDto,
  ): Promise<EvaluationTargetMappingResponseDto> {
    return await this.evaluationPeriodManagementService.평가대상자_등록한다(
      evaluationPeriodId,
      employeeId,
      dto.createdBy,
    );
  }

  /**
   * 평가 대상 제외
   */
  @ExcludeEvaluationTarget()
  async excludeEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @Body() dto: ExcludeEvaluationTargetDto,
  ): Promise<EvaluationTargetMappingResponseDto> {
    return await this.evaluationPeriodManagementService.평가대상에서_제외한다(
      evaluationPeriodId,
      employeeId,
      dto.excludeReason,
      dto.excludedBy,
    );
  }

  /**
   * 평가 대상 포함 (제외 취소)
   */
  @IncludeEvaluationTarget()
  async includeEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @Body() dto: IncludeEvaluationTargetDto,
  ): Promise<EvaluationTargetMappingResponseDto> {
    return await this.evaluationPeriodManagementService.평가대상에_포함한다(
      evaluationPeriodId,
      employeeId,
      dto.updatedBy,
    );
  }

  /**
   * 평가기간의 평가 대상자 조회
   */
  @GetEvaluationTargets()
  async getEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @Query() query: GetEvaluationTargetsQueryDto,
  ): Promise<EvaluationTargetsResponseDto> {
    const targets =
      await this.evaluationPeriodManagementService.평가기간의_평가대상자_조회한다(
        evaluationPeriodId,
        query.includeExcluded ?? false,
      );

    return {
      evaluationPeriodId,
      targets: targets.map((target) => {
        const { evaluationPeriodId: _, employeeId: __, ...rest } = target;
        return rest;
      }),
    };
  }

  /**
   * 제외된 평가 대상자 조회
   */
  @GetExcludedEvaluationTargets()
  async getExcludedEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<EvaluationTargetsResponseDto> {
    const targets =
      await this.evaluationPeriodManagementService.평가기간의_제외된_대상자_조회한다(
        evaluationPeriodId,
      );

    return {
      evaluationPeriodId,
      targets: targets.map((target) => {
        const { evaluationPeriodId: _, employeeId: __, ...rest } = target;
        return rest;
      }),
    };
  }

  /**
   * 직원의 평가기간 맵핑 조회
   */
  @GetEmployeeEvaluationPeriods()
  async getEmployeeEvaluationPeriods(
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EvaluationTargetMappingResponseDto[]> {
    return await this.evaluationPeriodManagementService.직원의_평가기간_맵핑_조회한다(
      employeeId,
    );
  }

  /**
   * 평가 대상 여부 확인
   */
  @CheckEvaluationTarget()
  async checkEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EvaluationTargetStatusResponseDto> {
    const isTarget =
      await this.evaluationPeriodManagementService.평가대상_여부_확인한다(
        evaluationPeriodId,
        employeeId,
      );

    return {
      isEvaluationTarget: isTarget,
      evaluationPeriodId,
      employeeId,
    };
  }

  /**
   * 평가 대상자 등록 해제
   */
  @UnregisterEvaluationTarget()
  async unregisterEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<{ success: boolean }> {
    const result =
      await this.evaluationPeriodManagementService.평가대상자_등록_해제한다(
        evaluationPeriodId,
        employeeId,
      );

    return { success: result };
  }

  /**
   * 평가기간의 모든 대상자 등록 해제
   */
  @UnregisterAllEvaluationTargets()
  async unregisterAllEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<{ deletedCount: number }> {
    const deletedCount =
      await this.evaluationPeriodManagementService.평가기간의_모든_대상자_해제한다(
        evaluationPeriodId,
      );

    return { deletedCount };
  }
}
