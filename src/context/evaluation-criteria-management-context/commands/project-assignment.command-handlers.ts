import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { EvaluationProjectAssignmentService } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationProjectAssignmentDto } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import {
  CreateProjectAssignmentCommand,
  UpdateProjectAssignmentCommand,
  CancelProjectAssignmentCommand,
  BulkCreateProjectAssignmentCommand,
  ResetPeriodProjectAssignmentsCommand,
} from './project-assignment.commands';

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
    private readonly dataSource: DataSource,
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
