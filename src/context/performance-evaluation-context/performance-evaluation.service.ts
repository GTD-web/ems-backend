import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { DownwardEvaluationNotFoundException } from '@domain/core/downward-evaluation/downward-evaluation.exceptions';

// 자기평가 관련 커맨드 및 쿼리
import {
  CreateWbsSelfEvaluationCommand,
  GetEmployeeSelfEvaluationsQuery,
  GetWbsSelfEvaluationDetailQuery,
  SubmitWbsSelfEvaluationCommand,
  SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ResetWbsSelfEvaluationCommand,
  ResetAllWbsSelfEvaluationsByEmployeePeriodCommand,
  SubmitWbsSelfEvaluationsByProjectCommand,
  ResetWbsSelfEvaluationsByProjectCommand,
  ClearWbsSelfEvaluationCommand,
  ClearAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ClearWbsSelfEvaluationsByProjectCommand,
  UpdateWbsSelfEvaluationCommand,
  UpsertWbsSelfEvaluationCommand,
} from './handlers/self-evaluation';
import type {
  SubmitAllWbsSelfEvaluationsResponse,
  ResetAllWbsSelfEvaluationsResponse,
  SubmitWbsSelfEvaluationsByProjectResponse,
  ResetWbsSelfEvaluationsByProjectResponse,
  ClearAllWbsSelfEvaluationsResponse,
  ClearWbsSelfEvaluationsByProjectResponse,
} from './handlers/self-evaluation';

// 평가 수정 가능 상태 관련 커맨드
import {
  UpdateEvaluationEditableStatusCommand,
  UpdatePeriodAllEvaluationEditableStatusCommand,
  EvaluationType,
} from './handlers/evaluation-editable-status';
import type { UpdatePeriodAllEvaluationEditableStatusResponse } from './handlers/evaluation-editable-status';

// 동료평가 관련 커맨드 및 쿼리
import {
  CancelPeerEvaluationCommand,
  CancelPeerEvaluationsByPeriodCommand,
  CreatePeerEvaluationCommand,
  GetPeerEvaluationDetailQuery,
  GetPeerEvaluationListQuery,
  GetEvaluatorAssignedEvaluateesQuery,
  SubmitPeerEvaluationCommand,
  UpdatePeerEvaluationCommand,
  UpsertPeerEvaluationCommand,
  AddQuestionGroupToPeerEvaluationCommand,
  AddQuestionToPeerEvaluationCommand,
  RemoveQuestionFromPeerEvaluationCommand,
  UpdatePeerEvaluationQuestionOrderCommand,
  GetPeerEvaluationQuestionsQuery,
  type PeerEvaluationQuestionDetail,
} from './handlers/peer-evaluation';

// 하향평가 관련 커맨드 및 쿼리
import {
  CreateDownwardEvaluationCommand,
  GetDownwardEvaluationDetailQuery,
  GetDownwardEvaluationListQuery,
  SubmitDownwardEvaluationCommand,
  UpdateDownwardEvaluationCommand,
  UpsertDownwardEvaluationCommand,
} from './handlers/downward-evaluation';

// 최종평가 관련 커맨드 및 쿼리
import {
  CancelConfirmationFinalEvaluationCommand,
  ConfirmFinalEvaluationCommand,
  CreateFinalEvaluationCommand,
  DeleteFinalEvaluationCommand,
  GetFinalEvaluationByEmployeePeriodQuery,
  GetFinalEvaluationListQuery,
  GetFinalEvaluationQuery,
  UpdateFinalEvaluationCommand,
  UpsertFinalEvaluationCommand,
} from './handlers/final-evaluation';

import {
  EmployeeSelfEvaluationsResponseDto,
  WbsSelfEvaluationBasicDto,
  WbsSelfEvaluationResponseDto,
} from '@interface/admin/performance-evaluation/dto/wbs-self-evaluation.dto';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { IPerformanceEvaluationService } from './interfaces/performance-evaluation.interface';

/**
 * 성과평가 컨텍스트 서비스
 * 자기평가(성과입력), 동료평가, 하향평가를 관리합니다.
 */
@Injectable()
export class PerformanceEvaluationService
  implements IPerformanceEvaluationService
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==================== 자기평가(성과입력) 관련 메서드 ====================

  /**
   * WBS 자기평가를 생성한다
   */
  async WBS자기평가를_생성한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    selfEvaluationContent: string,
    selfEvaluationScore: number,
    performanceResult?: string,
    createdBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new CreateWbsSelfEvaluationCommand(
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 수정한다
   */
  async WBS자기평가를_수정한다(
    evaluationId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    updatedBy?: string,
  ): Promise<WbsSelfEvaluationBasicDto> {
    const command = new UpdateWbsSelfEvaluationCommand(
      evaluationId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      updatedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async WBS자기평가를_저장한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    actionBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new UpsertWbsSelfEvaluationCommand(
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 제출한다
   */
  async WBS자기평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new SubmitWbsSelfEvaluationCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 제출한다
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 완료 처리합니다.
   */
  async 직원의_전체_WBS자기평가를_제출한다(
    employeeId: string,
    periodId: string,
    submittedBy?: string,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse> {
    const command = new SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand(
      employeeId,
      periodId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 초기화한다 (단일)
   */
  async WBS자기평가를_초기화한다(
    evaluationId: string,
    resetBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new ResetWbsSelfEvaluationCommand(
      evaluationId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 초기화한다
   * 특정 직원의 특정 평가기간에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
   */
  async 직원의_전체_WBS자기평가를_초기화한다(
    employeeId: string,
    periodId: string,
    resetBy?: string,
  ): Promise<ResetAllWbsSelfEvaluationsResponse> {
    const command = new ResetAllWbsSelfEvaluationsByEmployeePeriodCommand(
      employeeId,
      periodId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 제출한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 완료 처리합니다.
   */
  async 프로젝트별_WBS자기평가를_제출한다(
    employeeId: string,
    periodId: string,
    projectId: string,
    submittedBy?: string,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponse> {
    const command = new SubmitWbsSelfEvaluationsByProjectCommand(
      employeeId,
      periodId,
      projectId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 초기화한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
   */
  async 프로젝트별_WBS자기평가를_초기화한다(
    employeeId: string,
    periodId: string,
    projectId: string,
    resetBy?: string,
  ): Promise<ResetWbsSelfEvaluationsByProjectResponse> {
    const command = new ResetWbsSelfEvaluationsByProjectCommand(
      employeeId,
      periodId,
      projectId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  async 직원의_자기평가_목록을_조회한다(
    query: GetEmployeeSelfEvaluationsQuery,
  ): Promise<EmployeeSelfEvaluationsResponseDto> {
    return await this.queryBus.execute(query);
  }

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  async WBS자기평가_상세정보를_조회한다(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 동료평가 관련 메서드 ====================

  /**
   * 동료평가를 생성한다
   */
  async 동료평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluationContent?: string,
    score?: number,
    createdBy?: string,
  ): Promise<string> {
    const command = new CreatePeerEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가를 수정한다
   */
  async 동료평가를_수정한다(
    evaluationId: string,
    evaluationContent?: string,
    score?: number,
    updatedBy?: string,
  ): Promise<void> {
    const command = new UpdatePeerEvaluationCommand(
      evaluationId,
      updatedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async 동료평가를_저장한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluationContent?: string,
    score?: number,
    actionBy?: string,
  ): Promise<string> {
    const command = new UpsertPeerEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가를 취소한다
   */
  async 동료평가를_취소한다(
    evaluationId: string,
    cancelledBy: string,
  ): Promise<void> {
    const command = new CancelPeerEvaluationCommand(evaluationId, cancelledBy);

    await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가를 취소한다
   */
  async 피평가자의_동료평가를_일괄_취소한다(
    evaluateeId: string,
    periodId: string,
    cancelledBy: string,
  ): Promise<{ cancelledCount: number }> {
    const command = new CancelPeerEvaluationsByPeriodCommand(
      evaluateeId,
      periodId,
      cancelledBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가를 제출한다
   */
  async 동료평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<void> {
    const command = new SubmitPeerEvaluationCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가 목록을 조회한다
   */
  async 동료평가_목록을_조회한다(
    query: GetPeerEvaluationListQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 평가자에게 할당된 피평가자 목록을 조회한다
   */
  async 평가자에게_할당된_피평가자_목록을_조회한다(
    query: GetEvaluatorAssignedEvaluateesQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 하향평가 관련 메서드 ====================

  /**
   * 하향평가를 생성한다
   */
  async 하향평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    selfEvaluationId?: string,
    evaluationType?: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    createdBy?: string,
  ): Promise<string> {
    const command = new CreateDownwardEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      selfEvaluationId,
      evaluationType || 'primary',
      downwardEvaluationContent,
      downwardEvaluationScore,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 하향평가를 수정한다
   */
  async 하향평가를_수정한다(
    evaluationId: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    updatedBy?: string,
  ): Promise<void> {
    const command = new UpdateDownwardEvaluationCommand(
      evaluationId,
      downwardEvaluationContent,
      downwardEvaluationScore,
      updatedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 하향평가를 Upsert한다 (있으면 수정, 없으면 생성)
   */
  async 하향평가를_저장한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    selfEvaluationId?: string,
    evaluationType?: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    actionBy?: string,
  ): Promise<string> {
    const command = new UpsertDownwardEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      selfEvaluationId,
      evaluationType || 'primary',
      downwardEvaluationContent,
      downwardEvaluationScore,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 1차 하향평가를 제출한다
   */
  async 일차_하향평가를_제출한다(
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void> {
    // 1차 하향평가를 조회
    const query = new GetDownwardEvaluationListQuery(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      'primary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);
    if (!result.evaluations || result.evaluations.length === 0) {
      throw new DownwardEvaluationNotFoundException(
        `1차 하향평가 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, projectId: ${projectId})`,
      );
    }

    const evaluation = result.evaluations[0];

    // 제출 커맨드 실행
    const command = new SubmitDownwardEvaluationCommand(
      evaluation.id,
      submittedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 2차 하향평가를 제출한다
   */
  async 이차_하향평가를_제출한다(
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void> {
    // 2차 하향평가를 조회
    const query = new GetDownwardEvaluationListQuery(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      'secondary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);
    if (!result.evaluations || result.evaluations.length === 0) {
      throw new DownwardEvaluationNotFoundException(
        `2차 하향평가 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, projectId: ${projectId})`,
      );
    }

    const evaluation = result.evaluations[0];

    // 제출 커맨드 실행
    const command = new SubmitDownwardEvaluationCommand(
      evaluation.id,
      submittedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 하향평가를 제출한다 (ID로 직접)
   */
  async 하향평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<void> {
    const command = new SubmitDownwardEvaluationCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 하향평가 목록을 조회한다
   */
  async 하향평가_목록을_조회한다(
    query: GetDownwardEvaluationListQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 하향평가 상세정보를 조회한다
   */
  async 하향평가_상세정보를_조회한다(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 최종평가 관련 메서드 ====================

  /**
   * 최종평가를 생성한다
   */
  async 최종평가를_생성한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments?: string,
    createdBy?: string,
  ): Promise<string> {
    const command = new CreateFinalEvaluationCommand(
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 최종평가를 수정한다
   */
  async 최종평가를_수정한다(
    id: string,
    evaluationGrade?: string,
    jobGrade?: any,
    jobDetailedGrade?: any,
    finalComments?: string,
    updatedBy?: string,
  ): Promise<void> {
    const command = new UpdateFinalEvaluationCommand(
      id,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      updatedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async 최종평가를_저장한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments?: string,
    actionBy?: string,
  ): Promise<string> {
    const command = new UpsertFinalEvaluationCommand(
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 최종평가를 삭제한다
   */
  async 최종평가를_삭제한다(id: string, deletedBy?: string): Promise<void> {
    const command = new DeleteFinalEvaluationCommand(id, deletedBy || '시스템');

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가를 확정한다
   */
  async 최종평가를_확정한다(id: string, confirmedBy: string): Promise<void> {
    const command = new ConfirmFinalEvaluationCommand(id, confirmedBy);

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가 확정을 취소한다
   */
  async 최종평가_확정을_취소한다(id: string, updatedBy: string): Promise<void> {
    const command = new CancelConfirmationFinalEvaluationCommand(id, updatedBy);

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가를 조회한다
   */
  async 최종평가를_조회한다(query: GetFinalEvaluationQuery): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 최종평가 목록을 조회한다
   */
  async 최종평가_목록을_조회한다(
    query: GetFinalEvaluationListQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 직원-평가기간별 최종평가를 조회한다
   */
  async 직원_평가기간별_최종평가를_조회한다(
    query: GetFinalEvaluationByEmployeePeriodQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 평가 수정 가능 상태 관리 ====================

  /**
   * 평가 수정 가능 상태를 변경한다
   */
  async 평가_수정_가능_상태를_변경한다(
    mappingId: string,
    evaluationType: EvaluationType,
    isEditable: boolean,
    updatedBy?: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const command = new UpdateEvaluationEditableStatusCommand(
      mappingId,
      evaluationType,
      isEditable,
      updatedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 자기평가 수정 가능 상태를 변경한다
   */
  async 자기평가_수정_가능_상태를_변경한다(
    mappingId: string,
    isEditable: boolean,
    updatedBy?: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    return await this.평가_수정_가능_상태를_변경한다(
      mappingId,
      EvaluationType.SELF,
      isEditable,
      updatedBy,
    );
  }

  /**
   * 1차평가 수정 가능 상태를 변경한다
   */
  async 일차평가_수정_가능_상태를_변경한다(
    mappingId: string,
    isEditable: boolean,
    updatedBy?: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    return await this.평가_수정_가능_상태를_변경한다(
      mappingId,
      EvaluationType.PRIMARY,
      isEditable,
      updatedBy,
    );
  }

  /**
   * 2차평가 수정 가능 상태를 변경한다
   */
  async 이차평가_수정_가능_상태를_변경한다(
    mappingId: string,
    isEditable: boolean,
    updatedBy?: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    return await this.평가_수정_가능_상태를_변경한다(
      mappingId,
      EvaluationType.SECONDARY,
      isEditable,
      updatedBy,
    );
  }

  /**
   * 모든 평가의 수정 가능 상태를 일괄 변경한다
   */
  async 모든_평가_수정_가능_상태를_변경한다(
    mappingId: string,
    isEditable: boolean,
    updatedBy?: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    return await this.평가_수정_가능_상태를_변경한다(
      mappingId,
      EvaluationType.ALL,
      isEditable,
      updatedBy,
    );
  }

  /**
   * 평가기간별 모든 평가 대상자의 수정 가능 상태를 일괄 변경한다
   */
  async 평가기간별_모든_평가_수정_가능_상태를_변경한다(
    evaluationPeriodId: string,
    isSelfEvaluationEditable: boolean,
    isPrimaryEvaluationEditable: boolean,
    isSecondaryEvaluationEditable: boolean,
    updatedBy?: string,
  ): Promise<UpdatePeriodAllEvaluationEditableStatusResponse> {
    const command = new UpdatePeriodAllEvaluationEditableStatusCommand(
      evaluationPeriodId,
      isSelfEvaluationEditable,
      isPrimaryEvaluationEditable,
      isSecondaryEvaluationEditable,
      updatedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  // ==================== WBS 자기평가 내용 초기화 ====================

  /**
   * WBS 자기평가 내용을 초기화한다 (단일)
   */
  async WBS자기평가_내용을_초기화한다(data: {
    evaluationId: string;
    clearedBy?: string;
  }): Promise<WbsSelfEvaluationDto> {
    const command = new ClearWbsSelfEvaluationCommand(
      data.evaluationId,
      data.clearedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가 내용을 초기화한다
   */
  async 직원의_전체_WBS자기평가_내용을_초기화한다(data: {
    employeeId: string;
    periodId: string;
    clearedBy?: string;
  }): Promise<ClearAllWbsSelfEvaluationsResponse> {
    const command = new ClearAllWbsSelfEvaluationsByEmployeePeriodCommand(
      data.employeeId,
      data.periodId,
      data.clearedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가 내용을 초기화한다
   */
  async 프로젝트별_WBS자기평가_내용을_초기화한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
    clearedBy?: string;
  }): Promise<ClearWbsSelfEvaluationsByProjectResponse> {
    const command = new ClearWbsSelfEvaluationsByProjectCommand(
      data.employeeId,
      data.periodId,
      data.projectId,
      data.clearedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  // ==================== 동료평가 질문 매핑 관련 메서드 ====================

  /**
   * 동료평가에 질문 그룹을 추가한다
   */
  async 동료평가에_질문그룹을_추가한다(
    peerEvaluationId: string,
    questionGroupId: string,
    startDisplayOrder: number,
    createdBy: string,
  ): Promise<string[]> {
    const command = new AddQuestionGroupToPeerEvaluationCommand(
      peerEvaluationId,
      questionGroupId,
      startDisplayOrder,
      createdBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가에 개별 질문을 추가한다
   */
  async 동료평가에_질문을_추가한다(
    peerEvaluationId: string,
    questionId: string,
    displayOrder: number,
    questionGroupId: string | undefined,
    createdBy: string,
  ): Promise<string> {
    const command = new AddQuestionToPeerEvaluationCommand(
      peerEvaluationId,
      questionId,
      displayOrder,
      questionGroupId,
      createdBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가에서 질문을 제거한다
   */
  async 동료평가에서_질문을_제거한다(
    mappingId: string,
    deletedBy: string,
  ): Promise<void> {
    const command = new RemoveQuestionFromPeerEvaluationCommand(
      mappingId,
      deletedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가 질문 순서를 변경한다
   */
  async 동료평가_질문_순서를_변경한다(
    mappingId: string,
    newDisplayOrder: number,
    updatedBy: string,
  ): Promise<void> {
    const command = new UpdatePeerEvaluationQuestionOrderCommand(
      mappingId,
      newDisplayOrder,
      updatedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가의 질문 목록을 조회한다
   */
  async 동료평가의_질문목록을_조회한다(
    peerEvaluationId: string,
  ): Promise<PeerEvaluationQuestionDetail[]> {
    const query = new GetPeerEvaluationQuestionsQuery(peerEvaluationId);

    const result = await this.queryBus.execute(query);
    return result;
  }
}
