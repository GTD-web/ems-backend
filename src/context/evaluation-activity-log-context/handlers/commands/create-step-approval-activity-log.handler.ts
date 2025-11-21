import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
import { 평가활동내역을생성한다 } from './create-evaluation-activity-log.handler';

/**
 * 단계 승인 활동 내역 생성 Command
 */
export class 단계승인활동내역을생성한다 {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly step: string,
    public readonly status: StepApprovalStatus,
    public readonly updatedBy: string,
    public readonly revisionComment?: string,
    public readonly evaluatorId?: string, // 2차 하향평가의 경우 필요
  ) {}
}

/**
 * 단계 승인 활동 내역 생성 Handler
 *
 * 단계 승인 상태 변경 시 활동 내역을 기록합니다.
 */
@Injectable()
@CommandHandler(단계승인활동내역을생성한다)
export class CreateStepApprovalActivityLogHandler
  implements
    ICommandHandler<단계승인활동내역을생성한다, EvaluationActivityLogDto>
{
  private readonly logger = new Logger(
    CreateStepApprovalActivityLogHandler.name,
  );

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    command: 단계승인활동내역을생성한다,
  ): Promise<EvaluationActivityLogDto> {
    this.logger.log('단계 승인 상태 변경 활동 내역 기록 시작', {
      evaluationPeriodId: command.evaluationPeriodId,
      employeeId: command.employeeId,
      step: command.step,
      status: command.status,
    });

    // 단계별 제목 결정
    let activityTitle = '';
    let activityAction: 'approved' | 'revision_requested' = 'approved';

    switch (command.step) {
      case 'criteria':
        activityTitle = '평가기준 설정';
        break;
      case 'self':
        activityTitle = '자기평가';
        break;
      case 'primary':
        activityTitle = '1차 하향평가';
        break;
      case 'secondary':
        activityTitle = '2차 하향평가';
        break;
      default:
        activityTitle = '단계 승인';
    }

    // 상태에 따른 액션 결정
    if (command.status === StepApprovalStatus.APPROVED) {
      activityAction = 'approved';
      activityTitle += ' 승인';
    } else if (command.status === StepApprovalStatus.REVISION_REQUESTED) {
      activityAction = 'revision_requested';
      activityTitle += ' 재작성 요청';
    } else {
      // 다른 상태는 기록하지 않음
      this.logger.log('기록하지 않는 상태입니다', {
        status: command.status,
      });
      throw new Error(`기록하지 않는 상태입니다: ${command.status}`);
    }

    // 활동 내역 기록
    return await this.commandBus.execute(
      new 평가활동내역을생성한다(
        command.evaluationPeriodId,
        command.employeeId,
        'step_approval',
        activityAction,
        activityTitle,
        undefined, // activityDescription은 자동 생성
        'step_approval',
        undefined, // relatedEntityId
        command.updatedBy,
        undefined, // performedByName은 자동 조회
        {
          step: command.step,
          status: command.status,
          revisionComment: command.revisionComment,
          evaluatorId: command.evaluatorId,
        },
      ),
    );
  }
}
