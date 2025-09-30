import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type {
  EvaluationWbsAssignmentDto,
  UpdateEvaluationWbsAssignmentData,
} from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 수정 커맨드
 */
export class UpdateWbsAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationWbsAssignmentData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * WBS 할당 수정 핸들러
 */
@CommandHandler(UpdateWbsAssignmentCommand)
@Injectable()
export class UpdateWbsAssignmentHandler
  implements ICommandHandler<UpdateWbsAssignmentCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    command: UpdateWbsAssignmentCommand,
  ): Promise<EvaluationWbsAssignmentDto> {
    const { id, data, updatedBy } = command;
    const assignment = await this.wbsAssignmentService.업데이트한다(
      id,
      data,
      updatedBy,
    );
    return assignment.DTO로_변환한다();
  }
}
