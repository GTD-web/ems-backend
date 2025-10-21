import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodDto } from '../../domain/core/evaluation-period/evaluation-period.types';
import {
  CompleteEvaluationPeriodCommand,
  CreateEvaluationPeriodCommand,
  DeleteEvaluationPeriodCommand,
  StartEvaluationPeriodCommand,
  UpdateCriteriaSettingPermissionCommand,
  UpdateEvaluationPeriodBasicInfoCommand,
  UpdateEvaluationPeriodGradeRangesCommand,
  UpdateEvaluationPeriodScheduleCommand,
  UpdateEvaluationPeriodStartDateCommand,
  UpdateEvaluationSetupDeadlineCommand,
  UpdateFinalEvaluationSettingPermissionCommand,
  UpdateManualSettingPermissionsCommand,
  UpdatePeerEvaluationDeadlineCommand,
  UpdatePerformanceDeadlineCommand,
  UpdateSelfEvaluationDeadlineCommand,
  UpdateSelfEvaluationSettingPermissionCommand,
  RegisterEvaluationTargetCommand,
  RegisterBulkEvaluationTargetsCommand,
  ExcludeEvaluationTargetCommand,
  IncludeEvaluationTargetCommand,
  UnregisterEvaluationTargetCommand,
  UnregisterAllEvaluationTargetsCommand,
} from './handlers';
import {
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
} from './interfaces/evaluation-period-creation.interface';
import { IEvaluationPeriodManagementContext } from './interfaces/evaluation-period-management-context.interface';
import {
  GetActiveEvaluationPeriodsQuery,
  GetEvaluationPeriodDetailQuery,
  GetEvaluationPeriodListQuery,
  GetEvaluationTargetsQuery,
  GetExcludedEvaluationTargetsQuery,
  GetEmployeeEvaluationPeriodsQuery,
  CheckEvaluationTargetQuery,
  GetEvaluationTargetsByFilterQuery,
} from './handlers';

/**
 * 평가 기간 관리 서비스
 *
 * CQRS 패턴을 사용하여 평가 기간의 생명주기 관리를 위한 비즈니스 로직을 구현합니다.
 */
@Injectable()
export class EvaluationPeriodManagementContextService
  implements IEvaluationPeriodManagementContext
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  /**
   * 평가 기간을 생성한다 (최소 필수 정보만)
   */
  async 평가기간_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new CreateEvaluationPeriodCommand(createData, createdBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간을 시작한다
   */
  async 평가기간_시작한다(
    periodId: string,
    startedBy: string,
  ): Promise<boolean> {
    const command = new StartEvaluationPeriodCommand(periodId, startedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간을 완료한다
   */
  async 평가기간_완료한다(
    periodId: string,
    completedBy: string,
  ): Promise<boolean> {
    const command = new CompleteEvaluationPeriodCommand(periodId, completedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 기본 정보를 수정한다
   */
  async 평가기간기본정보_수정한다(
    periodId: string,
    updateData: UpdateEvaluationPeriodBasicDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodBasicInfoCommand(
      periodId,
      updateData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 일정을 수정한다
   */
  async 평가기간일정_수정한다(
    periodId: string,
    scheduleData: UpdateEvaluationPeriodScheduleDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodScheduleCommand(
      periodId,
      scheduleData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가설정 단계 마감일을 수정한다
   */
  async 평가설정단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdateEvaluationSetupDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationSetupDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 업무 수행 단계 마감일을 수정한다
   */
  async 업무수행단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdatePerformanceDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdatePerformanceDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 자기 평가 단계 마감일을 수정한다
   */
  async 자기평가단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdateSelfEvaluationDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateSelfEvaluationDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 하향/동료평가 단계 마감일을 수정한다
   */
  async 하향동료평가단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdatePeerEvaluationDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdatePeerEvaluationDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 시작일을 수정한다
   */
  async 평가기간시작일_수정한다(
    periodId: string,
    startDateData: UpdateEvaluationPeriodStartDateDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodStartDateCommand(
      periodId,
      startDateData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 등급 구간을 수정한다
   */
  async 평가기간등급구간_수정한다(
    periodId: string,
    gradeData: UpdateGradeRangesDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodGradeRangesCommand(
      periodId,
      gradeData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간을 삭제한다
   */
  async 평가기간_삭제한다(
    periodId: string,
    deletedBy: string,
  ): Promise<boolean> {
    const command = new DeleteEvaluationPeriodCommand(periodId, deletedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 활성 평가 기간을 조회한다
   */
  async 활성평가기간_조회한다(): Promise<EvaluationPeriodDto[]> {
    const query = new GetActiveEvaluationPeriodsQuery();
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 기간 상세 정보를 조회한다
   */
  async 평가기간상세_조회한다(
    periodId: string,
  ): Promise<EvaluationPeriodDto | null> {
    const query = new GetEvaluationPeriodDetailQuery(periodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 기간 목록을 조회한다
   */
  async 평가기간목록_조회한다(
    page: number,
    limit: number,
  ): Promise<{
    items: EvaluationPeriodDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = new GetEvaluationPeriodListQuery(page, limit);
    return await this.queryBus.execute(query);
  }

  // ==================== 수동 허용 설정 관리 ====================

  /**
   * 평가 기준 설정 수동 허용을 변경한다
   */
  async 평가기준설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateCriteriaSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateCriteriaSettingPermissionCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 자기 평가 설정 수동 허용을 변경한다
   */
  async 자기평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateSelfEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateSelfEvaluationSettingPermissionCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 최종 평가 설정 수동 허용을 변경한다
   */
  async 최종평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateFinalEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateFinalEvaluationSettingPermissionCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 전체 수동 허용 설정을 변경한다
   */
  async 전체수동허용설정_변경한다(
    periodId: string,
    permissionData: UpdateManualSettingPermissionsDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateManualSettingPermissionsCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  // ==================== 평가 대상자 관리 ====================

  /**
   * 평가 대상자를 등록한다
   */
  async 평가대상자_등록한다(
    evaluationPeriodId: string,
    employeeId: string,
    createdBy: string,
  ): Promise<any> {
    const command = new RegisterEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상자를 대량 등록한다
   */
  async 평가대상자_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
    createdBy: string,
  ): Promise<any[]> {
    const command = new RegisterBulkEvaluationTargetsCommand(
      evaluationPeriodId,
      employeeIds,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상에서 제외한다
   */
  async 평가대상에서_제외한다(
    evaluationPeriodId: string,
    employeeId: string,
    excludeReason: string,
    excludedBy: string,
  ): Promise<any> {
    const command = new ExcludeEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
      excludeReason,
      excludedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상에 포함한다 (제외 취소)
   */
  async 평가대상에_포함한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<any> {
    const command = new IncludeEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상자 등록을 해제한다
   */
  async 평가대상자_등록_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    const command = new UnregisterEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 모든 대상자를 해제한다
   */
  async 평가기간의_모든_대상자_해제한다(
    evaluationPeriodId: string,
  ): Promise<number> {
    const command = new UnregisterAllEvaluationTargetsCommand(
      evaluationPeriodId,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 평가대상자를 조회한다
   */
  async 평가기간의_평가대상자_조회한다(
    evaluationPeriodId: string,
    includeExcluded: boolean = false,
  ): Promise<any[]> {
    const query = new GetEvaluationTargetsQuery(
      evaluationPeriodId,
      includeExcluded,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간의 제외된 대상자를 조회한다
   */
  async 평가기간의_제외된_대상자_조회한다(
    evaluationPeriodId: string,
  ): Promise<any[]> {
    const query = new GetExcludedEvaluationTargetsQuery(evaluationPeriodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 직원의 평가기간 맵핑을 조회한다
   */
  async 직원의_평가기간_맵핑_조회한다(employeeId: string): Promise<any[]> {
    const query = new GetEmployeeEvaluationPeriodsQuery(employeeId);
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 대상 여부를 확인한다
   */
  async 평가대상_여부_확인한다(evaluationPeriodId: string, employeeId: string) {
    const query = new CheckEvaluationTargetQuery(
      evaluationPeriodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 필터로 평가대상자를 조회한다
   */
  async 필터로_평가대상자_조회한다(filter: any): Promise<any[]> {
    const query = new GetEvaluationTargetsByFilterQuery(filter);
    return await this.queryBus.execute(query);
  }
}
