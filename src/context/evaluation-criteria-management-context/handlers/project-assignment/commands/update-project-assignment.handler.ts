import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import {
  EvaluationProjectAssignmentDto,
  UpdateEvaluationProjectAssignmentData,
} from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 수정 커맨드
 */
export class UpdateProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationProjectAssignmentData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 수정 커맨드 핸들러
 */
@CommandHandler(UpdateProjectAssignmentCommand)
@Injectable()
export class UpdateProjectAssignmentHandler
  implements ICommandHandler<UpdateProjectAssignmentCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    command: UpdateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { id, data, updatedBy } = command;
    const assignment = await this.projectAssignmentService.업데이트한다(
      id,
      data,
      updatedBy,
    );
    return assignment.DTO로_변환한다();
  }
}
