import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';

/**
 * 평가기간별 프로젝트 할당 초기화 커맨드
 */
export class ResetPeriodProjectAssignmentsCommand {
  constructor(
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
}

/**
 * 평가기간별 프로젝트 할당 초기화 커맨드 핸들러
 */
@CommandHandler(ResetPeriodProjectAssignmentsCommand)
@Injectable()
export class ResetPeriodProjectAssignmentsHandler
  implements ICommandHandler<ResetPeriodProjectAssignmentsCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(command: ResetPeriodProjectAssignmentsCommand): Promise<void> {
    const { periodId, resetBy } = command;
    await this.projectAssignmentService.평가기간_할당_전체삭제한다(
      periodId,
      resetBy,
    );
  }
}
