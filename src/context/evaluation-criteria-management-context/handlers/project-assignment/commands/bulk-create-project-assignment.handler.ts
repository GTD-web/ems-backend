import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 대량 프로젝트 할당 생성 커맨드
 */
export class BulkCreateProjectAssignmentCommand {
  constructor(
    public readonly assignments: CreateEvaluationProjectAssignmentData[],
    public readonly assignedBy: string,
  ) {}
}

/**
 * 대량 프로젝트 할당 생성 커맨드 핸들러
 */
@CommandHandler(BulkCreateProjectAssignmentCommand)
@Injectable()
export class BulkCreateProjectAssignmentHandler
  implements ICommandHandler<BulkCreateProjectAssignmentCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    command: BulkCreateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { assignments, assignedBy } = command;
    const results: EvaluationProjectAssignmentDto[] = [];

    for (const data of assignments) {
      const assignment = await this.projectAssignmentService.생성한다(data);
      results.push(assignment.DTO로_변환한다());
    }

    return results;
  }
}
