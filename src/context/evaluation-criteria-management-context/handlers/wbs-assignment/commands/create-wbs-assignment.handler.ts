import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type {
  EvaluationWbsAssignmentDto,
  CreateEvaluationWbsAssignmentData,
} from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 생성 커맨드
 */
export class CreateWbsAssignmentCommand {
  constructor(
    public readonly data: CreateEvaluationWbsAssignmentData,
    public readonly assignedBy: string,
  ) {}
}

/**
 * WBS 할당 생성 핸들러
 */
@CommandHandler(CreateWbsAssignmentCommand)
@Injectable()
export class CreateWbsAssignmentHandler
  implements ICommandHandler<CreateWbsAssignmentCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    command: CreateWbsAssignmentCommand,
  ): Promise<EvaluationWbsAssignmentDto> {
    const { data, assignedBy } = command;
    const assignment = await this.wbsAssignmentService.생성한다(data);
    return assignment.DTO로_변환한다();
  }
}
