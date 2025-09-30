import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';

/**
 * 평가기간별 WBS 할당 초기화 커맨드
 */
export class ResetPeriodWbsAssignmentsCommand {
  constructor(
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
}

/**
 * 평가기간 WBS 할당 초기화 핸들러
 */
@CommandHandler(ResetPeriodWbsAssignmentsCommand)
@Injectable()
export class ResetPeriodWbsAssignmentsHandler
  implements ICommandHandler<ResetPeriodWbsAssignmentsCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(command: ResetPeriodWbsAssignmentsCommand): Promise<void> {
    const { periodId, resetBy } = command;
    await this.wbsAssignmentService.평가기간_할당_전체삭제한다(
      periodId,
      resetBy,
    );
  }
}
