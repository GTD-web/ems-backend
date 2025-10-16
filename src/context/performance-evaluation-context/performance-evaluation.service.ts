import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

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
  SubmitPeerEvaluationCommand,
  UpdatePeerEvaluationCommand,
  UpsertPeerEvaluationCommand,
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
  private readonly logger = new Logger(PerformanceEvaluationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==================== 자기평가(성과입력) 관련 메서드 ====================

  /**
   * WBS 자기평가를 생성한다
   */
  async WBS자기평가를_생성한다(
    command: CreateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto> {
    this.logger.log('WBS 자기평가 생성 시작', {
      employeeId: command.employeeId,
      wbsItemId: command.wbsItemId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * WBS 자기평가를 수정한다
   */
  async WBS자기평가를_수정한다(
    command: UpdateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationBasicDto> {
    this.logger.log('WBS 자기평가 수정 시작', {
      evaluationId: command.evaluationId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 수정 완료', {
      evaluationId: command.evaluationId,
    });
    return result;
  }

  /**
   * WBS 자기평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async WBS자기평가를_저장한다(
    command: UpsertWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto> {
    this.logger.log('WBS 자기평가 저장 시작', {
      employeeId: command.employeeId,
      wbsItemId: command.wbsItemId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 저장 완료');
    return result;
  }

  /**
   * WBS 자기평가를 제출한다
   */
  async WBS자기평가를_제출한다(
    command: SubmitWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto> {
    this.logger.log('WBS 자기평가 제출 시작', {
      evaluationId: command.evaluationId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 제출 완료', {
      evaluationId: command.evaluationId,
    });
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 제출한다
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 완료 처리합니다.
   */
  async 직원의_전체_WBS자기평가를_제출한다(
    command: SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse> {
    this.logger.log('직원의 전체 WBS 자기평가 제출 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('직원의 전체 WBS 자기평가 제출 완료', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      submittedCount: result.submittedCount,
      failedCount: result.failedCount,
    });
    return result;
  }

  /**
   * WBS 자기평가를 초기화한다 (단일)
   */
  async WBS자기평가를_초기화한다(
    command: ResetWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationResponseDto> {
    this.logger.log('WBS 자기평가 초기화 시작', {
      evaluationId: command.evaluationId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 초기화 완료', {
      evaluationId: command.evaluationId,
    });
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 초기화한다
   * 특정 직원의 특정 평가기간에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
   */
  async 직원의_전체_WBS자기평가를_초기화한다(
    command: ResetAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ): Promise<ResetAllWbsSelfEvaluationsResponse> {
    this.logger.log('직원의 전체 WBS 자기평가 초기화 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('직원의 전체 WBS 자기평가 초기화 완료', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      resetCount: result.resetCount,
      failedCount: result.failedCount,
    });
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 제출한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 완료 처리합니다.
   */
  async 프로젝트별_WBS자기평가를_제출한다(
    command: SubmitWbsSelfEvaluationsByProjectCommand,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponse> {
    this.logger.log('프로젝트별 WBS 자기평가 제출 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      projectId: command.projectId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('프로젝트별 WBS 자기평가 제출 완료', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      projectId: command.projectId,
      submittedCount: result.submittedCount,
      failedCount: result.failedCount,
    });
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 초기화한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
   */
  async 프로젝트별_WBS자기평가를_초기화한다(
    command: ResetWbsSelfEvaluationsByProjectCommand,
  ): Promise<ResetWbsSelfEvaluationsByProjectResponse> {
    this.logger.log('프로젝트별 WBS 자기평가 초기화 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      projectId: command.projectId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('프로젝트별 WBS 자기평가 초기화 완료', {
      employeeId: command.employeeId,
      periodId: command.periodId,
      projectId: command.projectId,
      resetCount: result.resetCount,
      failedCount: result.failedCount,
    });
    return result;
  }

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  async 직원의_자기평가_목록을_조회한다(
    query: GetEmployeeSelfEvaluationsQuery,
  ): Promise<EmployeeSelfEvaluationsResponseDto> {
    this.logger.log('직원 자기평가 목록 조회', {
      employeeId: query.employeeId,
    });
    return await this.queryBus.execute(query);
  }

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  async WBS자기평가_상세정보를_조회한다(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<any> {
    this.logger.log('WBS 자기평가 상세정보 조회', {
      evaluationId: query.evaluationId,
    });
    return await this.queryBus.execute(query);
  }

  // ==================== 동료평가 관련 메서드 ====================

  /**
   * 동료평가를 생성한다
   */
  async 동료평가를_생성한다(
    command: CreatePeerEvaluationCommand,
  ): Promise<string> {
    this.logger.log('동료평가 생성 시작', {
      evaluatorId: command.evaluatorId,
      evaluateeId: command.evaluateeId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('동료평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * 동료평가를 수정한다
   */
  async 동료평가를_수정한다(
    command: UpdatePeerEvaluationCommand,
  ): Promise<void> {
    this.logger.log('동료평가 수정 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('동료평가 수정 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 동료평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async 동료평가를_저장한다(
    command: UpsertPeerEvaluationCommand,
  ): Promise<string> {
    this.logger.log('동료평가 저장 시작', {
      evaluatorId: command.evaluatorId,
      evaluateeId: command.evaluateeId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('동료평가 저장 완료', {
      evaluationId: result,
    });
    return result;
  }

  /**
   * 동료평가를 취소한다
   */
  async 동료평가를_취소한다(
    evaluationId: string,
    cancelledBy: string,
  ): Promise<void> {
    this.logger.log('동료평가 취소 시작', {
      evaluationId,
    });

    const command = new CancelPeerEvaluationCommand(evaluationId, cancelledBy);

    await this.commandBus.execute(command);
    this.logger.log('동료평가 취소 완료', {
      evaluationId,
    });
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가를 취소한다
   */
  async 피평가자의_동료평가를_일괄_취소한다(
    evaluateeId: string,
    periodId: string,
    cancelledBy: string,
  ): Promise<{ cancelledCount: number }> {
    this.logger.log('피평가자의 동료평가 일괄 취소 시작', {
      evaluateeId,
      periodId,
    });

    const command = new CancelPeerEvaluationsByPeriodCommand(
      evaluateeId,
      periodId,
      cancelledBy,
    );

    const result = await this.commandBus.execute(command);
    this.logger.log('피평가자의 동료평가 일괄 취소 완료', {
      cancelledCount: result.cancelledCount,
    });
    return result;
  }

  /**
   * 동료평가를 제출한다
   */
  async 동료평가를_제출한다(
    command: SubmitPeerEvaluationCommand,
  ): Promise<void> {
    this.logger.log('동료평가 제출 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('동료평가 제출 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 동료평가 목록을 조회한다
   */
  async 동료평가_목록을_조회한다(
    query: GetPeerEvaluationListQuery,
  ): Promise<any> {
    this.logger.log('동료평가 목록 조회', { evaluatorId: query.evaluatorId });
    return await this.queryBus.execute(query);
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<any> {
    this.logger.log('동료평가 상세정보 조회', {
      evaluationId: query.evaluationId,
    });
    return await this.queryBus.execute(query);
  }

  // ==================== 하향평가 관련 메서드 ====================

  /**
   * 하향평가를 생성한다
   */
  async 하향평가를_생성한다(
    command: CreateDownwardEvaluationCommand,
  ): Promise<string> {
    this.logger.log('하향평가 생성 시작', {
      evaluatorId: command.evaluatorId,
      evaluateeId: command.evaluateeId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('하향평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * 하향평가를 수정한다
   */
  async 하향평가를_수정한다(
    command: UpdateDownwardEvaluationCommand,
  ): Promise<void> {
    this.logger.log('하향평가 수정 시작', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('하향평가 수정 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 하향평가를 Upsert한다 (있으면 수정, 없으면 생성)
   */
  async 하향평가를_저장한다(
    command: UpsertDownwardEvaluationCommand,
  ): Promise<string> {
    this.logger.log('하향평가 저장 시작', {
      evaluatorId: command.evaluatorId,
      evaluateeId: command.evaluateeId,
      evaluationType: command.evaluationType,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('하향평가 저장 완료', {
      evaluationId: result,
    });
    return result;
  }

  /**
   * 1차 하향평가를 제출한다
   */
  async 일차_하향평가를_제출한다(params: {
    evaluateeId: string;
    periodId: string;
    projectId: string;
    evaluatorId: string;
    submittedBy: string;
  }): Promise<void> {
    this.logger.log('1차 하향평가 제출 시작', {
      evaluateeId: params.evaluateeId,
      periodId: params.periodId,
      projectId: params.projectId,
    });

    // 1차 하향평가를 조회
    const query = new GetDownwardEvaluationListQuery(
      params.evaluatorId,
      params.evaluateeId,
      params.periodId,
      params.projectId,
      'primary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);
    if (!result.evaluations || result.evaluations.length === 0) {
      throw new Error('1차 하향평가를 찾을 수 없습니다.');
    }

    const evaluation = result.evaluations[0];

    // 제출 커맨드 실행
    const command = new SubmitDownwardEvaluationCommand(
      evaluation.id,
      params.submittedBy,
    );

    await this.commandBus.execute(command);
    this.logger.log('1차 하향평가 제출 완료', {
      evaluationId: evaluation.id,
    });
  }

  /**
   * 2차 하향평가를 제출한다
   */
  async 이차_하향평가를_제출한다(params: {
    evaluateeId: string;
    periodId: string;
    projectId: string;
    evaluatorId: string;
    submittedBy: string;
  }): Promise<void> {
    this.logger.log('2차 하향평가 제출 시작', {
      evaluateeId: params.evaluateeId,
      periodId: params.periodId,
      projectId: params.projectId,
    });

    // 2차 하향평가를 조회
    const query = new GetDownwardEvaluationListQuery(
      params.evaluatorId,
      params.evaluateeId,
      params.periodId,
      params.projectId,
      'secondary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);
    if (!result.evaluations || result.evaluations.length === 0) {
      throw new Error('2차 하향평가를 찾을 수 없습니다.');
    }

    const evaluation = result.evaluations[0];

    // 제출 커맨드 실행
    const command = new SubmitDownwardEvaluationCommand(
      evaluation.id,
      params.submittedBy,
    );

    await this.commandBus.execute(command);
    this.logger.log('2차 하향평가 제출 완료', {
      evaluationId: evaluation.id,
    });
  }

  /**
   * 하향평가를 제출한다 (ID로 직접)
   */
  async 하향평가를_제출한다(
    command: SubmitDownwardEvaluationCommand,
  ): Promise<void> {
    this.logger.log('하향평가 제출 시작 (ID로 직접)', {
      evaluationId: command.evaluationId,
    });

    await this.commandBus.execute(command);
    this.logger.log('하향평가 제출 완료', {
      evaluationId: command.evaluationId,
    });
  }

  /**
   * 하향평가 목록을 조회한다
   */
  async 하향평가_목록을_조회한다(
    query: GetDownwardEvaluationListQuery,
  ): Promise<any> {
    this.logger.log('하향평가 목록 조회', { evaluatorId: query.evaluatorId });
    return await this.queryBus.execute(query);
  }

  /**
   * 하향평가 상세정보를 조회한다
   */
  async 하향평가_상세정보를_조회한다(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<any> {
    this.logger.log('하향평가 상세정보 조회', {
      evaluationId: query.evaluationId,
    });
    return await this.queryBus.execute(query);
  }

  // ==================== 최종평가 관련 메서드 ====================

  /**
   * 최종평가를 생성한다
   */
  async 최종평가를_생성한다(
    command: CreateFinalEvaluationCommand,
  ): Promise<string> {
    this.logger.log('최종평가 생성 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('최종평가 생성 완료', { evaluationId: result });
    return result;
  }

  /**
   * 최종평가를 수정한다
   */
  async 최종평가를_수정한다(
    command: UpdateFinalEvaluationCommand,
  ): Promise<void> {
    this.logger.log('최종평가 수정 시작', {
      id: command.id,
    });

    await this.commandBus.execute(command);
    this.logger.log('최종평가 수정 완료', {
      id: command.id,
    });
  }

  /**
   * 최종평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async 최종평가를_저장한다(
    command: UpsertFinalEvaluationCommand,
  ): Promise<string> {
    this.logger.log('최종평가 저장 시작', {
      employeeId: command.employeeId,
      periodId: command.periodId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('최종평가 저장 완료', {
      evaluationId: result,
    });
    return result;
  }

  /**
   * 최종평가를 삭제한다
   */
  async 최종평가를_삭제한다(
    command: DeleteFinalEvaluationCommand,
  ): Promise<void> {
    this.logger.log('최종평가 삭제 시작', {
      id: command.id,
    });

    await this.commandBus.execute(command);
    this.logger.log('최종평가 삭제 완료', {
      id: command.id,
    });
  }

  /**
   * 최종평가를 확정한다
   */
  async 최종평가를_확정한다(
    command: ConfirmFinalEvaluationCommand,
  ): Promise<void> {
    this.logger.log('최종평가 확정 시작', {
      id: command.id,
    });

    await this.commandBus.execute(command);
    this.logger.log('최종평가 확정 완료', {
      id: command.id,
    });
  }

  /**
   * 최종평가 확정을 취소한다
   */
  async 최종평가_확정을_취소한다(
    command: CancelConfirmationFinalEvaluationCommand,
  ): Promise<void> {
    this.logger.log('최종평가 확정 취소 시작', {
      id: command.id,
    });

    await this.commandBus.execute(command);
    this.logger.log('최종평가 확정 취소 완료', {
      id: command.id,
    });
  }

  /**
   * 최종평가를 조회한다
   */
  async 최종평가를_조회한다(query: GetFinalEvaluationQuery): Promise<any> {
    this.logger.log('최종평가 조회', { id: query.id });
    return await this.queryBus.execute(query);
  }

  /**
   * 최종평가 목록을 조회한다
   */
  async 최종평가_목록을_조회한다(
    query: GetFinalEvaluationListQuery,
  ): Promise<any> {
    this.logger.log('최종평가 목록 조회', {
      employeeId: query.employeeId,
      periodId: query.periodId,
    });
    return await this.queryBus.execute(query);
  }

  /**
   * 직원-평가기간별 최종평가를 조회한다
   */
  async 직원_평가기간별_최종평가를_조회한다(
    query: GetFinalEvaluationByEmployeePeriodQuery,
  ): Promise<any> {
    this.logger.log('직원-평가기간별 최종평가 조회', {
      employeeId: query.employeeId,
      periodId: query.periodId,
    });
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

    this.logger.log('평가 수정 가능 상태 변경 시작', {
      mappingId: command.mappingId,
      evaluationType: command.evaluationType,
      isEditable: command.isEditable,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('평가 수정 가능 상태 변경 완료', {
      mappingId: command.mappingId,
    });
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

    this.logger.log('평가기간별 모든 평가 수정 가능 상태 일괄 변경 시작', {
      evaluationPeriodId: command.evaluationPeriodId,
      isSelfEvaluationEditable: command.isSelfEvaluationEditable,
      isPrimaryEvaluationEditable: command.isPrimaryEvaluationEditable,
      isSecondaryEvaluationEditable: command.isSecondaryEvaluationEditable,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('평가기간별 모든 평가 수정 가능 상태 일괄 변경 완료', {
      evaluationPeriodId: command.evaluationPeriodId,
      updatedCount: result.updatedCount,
    });
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

    this.logger.log('WBS 자기평가 내용 초기화 시작', {
      evaluationId: data.evaluationId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('WBS 자기평가 내용 초기화 완료');
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

    this.logger.log('직원의 전체 WBS 자기평가 내용 초기화 시작', {
      employeeId: data.employeeId,
      periodId: data.periodId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('직원의 전체 WBS 자기평가 내용 초기화 완료', {
      clearedCount: result.clearedCount,
    });
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

    this.logger.log('프로젝트별 WBS 자기평가 내용 초기화 시작', {
      employeeId: data.employeeId,
      periodId: data.periodId,
      projectId: data.projectId,
    });

    const result = await this.commandBus.execute(command);
    this.logger.log('프로젝트별 WBS 자기평가 내용 초기화 완료', {
      clearedCount: result.clearedCount,
    });
    return result;
  }
}
