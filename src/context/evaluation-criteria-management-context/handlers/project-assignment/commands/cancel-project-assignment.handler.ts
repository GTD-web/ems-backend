import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';

/**
 * 프로젝트 할당 취소 커맨드
 */
export class CancelProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 프로젝트 할당 취소 커맨드 핸들러
 */
@CommandHandler(CancelProjectAssignmentCommand)
@Injectable()
export class CancelProjectAssignmentHandler
  implements ICommandHandler<CancelProjectAssignmentCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(command: CancelProjectAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;
    await this.projectAssignmentService.삭제한다(id, cancelledBy);
  }
}
