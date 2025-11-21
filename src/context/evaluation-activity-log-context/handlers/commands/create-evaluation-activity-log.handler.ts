import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationActivityLogService } from '@domain/core/evaluation-activity-log/evaluation-activity-log.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import type {
  EvaluationActivityLogDto,
  EvaluationActivityType,
  EvaluationActivityAction,
} from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';

/**
 * 평가 활동 내역 생성 Command
 */
export class 평가활동내역을생성한다 {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly activityType: string,
    public readonly activityAction: string,
    public readonly activityTitle?: string,
    public readonly activityDescription?: string,
    public readonly relatedEntityType?: string,
    public readonly relatedEntityId?: string,
    public readonly performedBy?: string,
    public readonly performedByName?: string,
    public readonly activityMetadata?: Record<string, any>,
    public readonly activityDate?: Date,
  ) {}
}

/**
 * 평가 활동 내역 생성 Handler
 *
 * activityDescription이 제공되지 않은 경우, performedByName을 사용하여 자동 생성합니다.
 * 생성 형식: "{performedByName}님이 {activityTitle}을(를) {activityAction}했습니다."
 * 예: "홍길동님이 WBS 자기평가를 생성했습니다."
 */
@Injectable()
@CommandHandler(평가활동내역을생성한다)
export class CreateEvaluationActivityLogHandler
  implements ICommandHandler<평가활동내역을생성한다, EvaluationActivityLogDto>
{
  private readonly logger = new Logger(CreateEvaluationActivityLogHandler.name);

  constructor(
    private readonly activityLogService: EvaluationActivityLogService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(
    command: 평가활동내역을생성한다,
  ): Promise<EvaluationActivityLogDto> {
    this.logger.log('활동 내역 기록 시작', {
      periodId: command.periodId,
      employeeId: command.employeeId,
      activityType: command.activityType,
    });

    // performedByName이 없으면 조회
    let performedByName = command.performedByName;
    if (!performedByName && command.performedBy) {
      try {
        const employee = await this.employeeService.ID로_조회한다(
          command.performedBy,
        );
        if (employee) {
          performedByName = employee.name;
        }
      } catch (error) {
        this.logger.warn('활동 수행자 이름 조회 실패', {
          performedBy: command.performedBy,
          error: error.message,
        });
      }
    }

    // activityDescription 자동 생성
    let activityDescription = command.activityDescription;
    if (!activityDescription && performedByName && command.activityTitle) {
      const actionText = this.액션을_텍스트로_변환한다(command.activityAction);
      // activityTitle에서 액션을 제거하고 객체명만 추출
      const objectName = this.객체명을_추출한다(
        command.activityTitle,
        actionText,
      );
      // 조사(을/를) 결정
      const particle = this.조사를_결정한다(objectName);
      activityDescription = `${performedByName}님이 ${objectName}${particle} ${actionText}했습니다.`;
    }

    const result = await this.activityLogService.생성한다({
      periodId: command.periodId,
      employeeId: command.employeeId,
      activityType: command.activityType as EvaluationActivityType,
      activityAction: command.activityAction as EvaluationActivityAction,
      activityTitle: command.activityTitle,
      activityDescription,
      relatedEntityType: command.relatedEntityType,
      relatedEntityId: command.relatedEntityId,
      performedBy: command.performedBy || '',
      performedByName,
      activityMetadata: command.activityMetadata,
      activityDate: command.activityDate,
    });

    this.logger.log('활동 내역 기록 완료', { id: result.id });

    return result;
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
      approved: '승인',
      rejected: '거부',
      revision_requested: '재작성 요청',
      revision_completed: '재작성 완료',
    };

    return actionMap[action] || action;
  }

  /**
   * activityTitle에서 객체명을 추출한다
   * 예: "WBS 자기평가 제출" → "WBS 자기평가"
   *     "하향평가 완료" → "하향평가"
   */
  private 객체명을_추출한다(activityTitle: string, actionText: string): string {
    // activityTitle에서 액션 텍스트를 제거
    let objectName = activityTitle;

    // 액션이 포함되어 있으면 제거
    if (objectName.includes(actionText)) {
      objectName = objectName
        .replace(new RegExp(`\\s*${actionText}\\s*`), '')
        .trim();
    }

    // 괄호 안의 내용 제거 (예: "(1차 평가자)" → "")
    objectName = objectName.replace(/\s*\([^)]*\)\s*/g, '').trim();

    return objectName || activityTitle; // 추출 실패 시 원본 반환
  }

  /**
   * 조사(을/를)를 결정한다
   * 받침이 있으면 "을", 없으면 "를"
   */
  private 조사를_결정한다(text: string): string {
    if (!text) return '를';

    // 마지막 글자의 받침 여부 확인
    const lastChar = text[text.length - 1];
    const lastCharCode = lastChar.charCodeAt(0);

    // 한글인 경우
    if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
      const hasBatchim = (lastCharCode - 0xac00) % 28 !== 0;
      return hasBatchim ? '을' : '를';
    }

    // 한글이 아닌 경우 기본값
    return '를';
  }
}
