import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';

/**
 * WBS 할당 취소 커맨드
 */
export class CancelWbsAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * WBS 할당 취소 핸들러
 */
@CommandHandler(CancelWbsAssignmentCommand)
@Injectable()
export class CancelWbsAssignmentHandler
  implements ICommandHandler<CancelWbsAssignmentCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(command: CancelWbsAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;
    await this.wbsAssignmentService.삭제한다(id, cancelledBy);
  }
}
