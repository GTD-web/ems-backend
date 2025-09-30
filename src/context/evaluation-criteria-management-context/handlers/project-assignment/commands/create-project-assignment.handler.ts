import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 생성 커맨드
 */
export class CreateProjectAssignmentCommand {
  constructor(
    public readonly data: CreateEvaluationProjectAssignmentData,
    public readonly assignedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 생성 커맨드 핸들러
 */
@CommandHandler(CreateProjectAssignmentCommand)
@Injectable()
export class CreateProjectAssignmentHandler
  implements ICommandHandler<CreateProjectAssignmentCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    command: CreateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { data, assignedBy } = command;
    const assignment = await this.projectAssignmentService.생성한다(data);
    return assignment.DTO로_변환한다();
  }
}
