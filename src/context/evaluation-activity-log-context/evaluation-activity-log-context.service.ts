import { Injectable, Logger } from '@nestjs/common';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import type {
  EvaluationActivityLogDto,
  EvaluationActivityType,
  EvaluationActivityAction,
} from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
import type {
  CreateEvaluationActivityLogRequest,
  GetEvaluationActivityLogListRequest,
  GetEvaluationActivityLogListResult,
} from './interfaces/evaluation-activity-log-context.interface';

/**
 * 평가 활동 내역 컨텍스트 서비스
 * 평가 활동 내역 저장 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class EvaluationActivityLogContextService {
  private readonly logger = new Logger(
    EvaluationActivityLogContextService.name,
  );

  constructor(
    private readonly activityLogService: EvaluationActivityLogService,
    private readonly employeeService: EmployeeService,
  ) {}

  /**
   * 활동 내역을 기록한다
   *
   * activityDescription이 제공되지 않은 경우, performedByName을 사용하여 자동 생성합니다.
   * 생성 형식: "{performedByName}님이 {activityTitle}을(를) {activityAction}했습니다."
   * 예: "홍길동님이 WBS 자기평가를 생성했습니다."
   */
  async 활동내역을_기록한다(
    params: CreateEvaluationActivityLogRequest,
  ): Promise<EvaluationActivityLogDto> {
    this.logger.log('활동 내역 기록 시작', {
      periodId: params.periodId,
      employeeId: params.employeeId,
      activityType: params.activityType,
    });

    // performedByName이 없으면 조회
    let performedByName = params.performedByName;
    if (!performedByName && params.performedBy) {
      try {
        const employee = await this.employeeService.ID로_조회한다(
          params.performedBy,
        );
        if (employee) {
          performedByName = employee.name;
        }
      } catch (error) {
        this.logger.warn('활동 수행자 이름 조회 실패', {
          performedBy: params.performedBy,
          error: error.message,
        });
      }
    }

    // activityDescription 자동 생성
    let activityDescription = params.activityDescription;
    if (!activityDescription && performedByName && params.activityTitle) {
      const actionText = this.액션을_텍스트로_변환한다(params.activityAction);
      activityDescription = `${performedByName}님이 ${params.activityTitle}을(를) ${actionText}했습니다.`;
    }

    const result = await this.activityLogService.생성한다({
      periodId: params.periodId,
      employeeId: params.employeeId,
      activityType: params.activityType as EvaluationActivityType,
      activityAction: params.activityAction as EvaluationActivityAction,
      activityTitle: params.activityTitle,
      activityDescription,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      performedBy: params.performedBy,
      performedByName,
      activityMetadata: params.activityMetadata,
      activityDate: params.activityDate,
    });

    this.logger.log('활동 내역 기록 완료', { id: result.id });

    return result;
  }

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  async 평가기간_피평가자_활동내역을_조회한다(
    params: GetEvaluationActivityLogListRequest,
  ): Promise<GetEvaluationActivityLogListResult> {
    this.logger.log('평가기간 피평가자 활동 내역 조회 시작', {
      periodId: params.periodId,
      employeeId: params.employeeId,
    });

    return await this.activityLogService.평가기간_피평가자_활동내역을_조회한다({
      periodId: params.periodId,
      employeeId: params.employeeId,
      activityType: params.activityType,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      limit: params.limit,
    });
  }

  /**
   * 활동 액션을 텍스트로 변환한다
   */
  private 액션을_텍스트로_변환한다(action: string): string {
    const actionMap: Record<string, string> = {
      created: '생성',
      updated: '수정',
      submitted: '제출',
      completed: '완료',
      cancelled: '취소',
      deleted: '삭제',
      assigned: '할당',
      unassigned: '할당 해제',
    };

    return actionMap[action] || action;
  }
}
