import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import type { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';
import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
import { 평가활동내역을생성한다 } from './create-evaluation-activity-log.handler';

/**
 * 재작성 완료 활동 내역 생성 Command
 */
export class 재작성완료활동내역을생성한다 {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly step: RevisionRequestStepType,
    public readonly requestId: string,
    public readonly performedBy: string,
    public readonly responseComment: string,
    public readonly allCompleted: boolean,
  ) {}
}

/**
 * 재작성 완료 활동 내역 생성 Handler
 *
 * 재작성 완료 시 활동 내역을 기록합니다.
 */
@Injectable()
@CommandHandler(재작성완료활동내역을생성한다)
export class CreateRevisionCompletedActivityLogHandler
  implements
    ICommandHandler<재작성완료활동내역을생성한다, EvaluationActivityLogDto>
{
  private readonly logger = new Logger(
    CreateRevisionCompletedActivityLogHandler.name,
  );

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    command: 재작성완료활동내역을생성한다,
  ): Promise<EvaluationActivityLogDto> {
    this.logger.log('재작성 완료 활동 내역 기록 시작', {
      evaluationPeriodId: command.evaluationPeriodId,
      employeeId: command.employeeId,
      step: command.step,
      requestId: command.requestId,
    });

    // 단계별 제목 결정
    let activityTitle = '';
    switch (command.step) {
      case 'criteria':
        activityTitle = '평가기준 설정 재작성 완료';
        break;
      case 'self':
        activityTitle = '자기평가 재작성 완료';
        break;
      case 'primary':
        activityTitle = '1차 하향평가 재작성 완료';
        break;
      case 'secondary':
        activityTitle = '2차 하향평가 재작성 완료';
        break;
      default:
        activityTitle = '재작성 완료';
    }

    // 활동 내역 기록
    return await this.commandBus.execute(
      new 평가활동내역을생성한다(
        command.evaluationPeriodId,
        command.employeeId,
        'revision_request',
        'revision_completed',
        activityTitle,
        undefined, // activityDescription은 자동 생성
        'revision_request',
        command.requestId,
        command.performedBy,
        undefined, // performedByName은 자동 조회
        {
          step: command.step,
          responseComment: command.responseComment,
          allCompleted: command.allCompleted,
        },
      ),
    );
  }
}
