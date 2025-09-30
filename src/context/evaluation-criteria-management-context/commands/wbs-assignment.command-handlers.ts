import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EvaluationWbsAssignmentService } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type { EvaluationWbsAssignmentDto } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import {
  CreateWbsAssignmentCommand,
  UpdateWbsAssignmentCommand,
  CancelWbsAssignmentCommand,
  BulkCreateWbsAssignmentCommand,
  ResetPeriodWbsAssignmentsCommand,
  ResetProjectWbsAssignmentsCommand,
  ResetEmployeeWbsAssignmentsCommand,
} from './wbs-assignment.commands';

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

/**
 * WBS 할당 대량 생성 핸들러
 */
@CommandHandler(BulkCreateWbsAssignmentCommand)
@Injectable()
export class BulkCreateWbsAssignmentHandler
  implements ICommandHandler<BulkCreateWbsAssignmentCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    command: BulkCreateWbsAssignmentCommand,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { assignments, assignedBy } = command;
    const results: EvaluationWbsAssignmentDto[] = [];

    for (const data of assignments) {
      const assignment = await this.wbsAssignmentService.생성한다(data);
      results.push(assignment.DTO로_변환한다());
    }

    return results;
  }
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

/**
 * 프로젝트 WBS 할당 초기화 핸들러
 */
@CommandHandler(ResetProjectWbsAssignmentsCommand)
@Injectable()
export class ResetProjectWbsAssignmentsHandler
  implements ICommandHandler<ResetProjectWbsAssignmentsCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(command: ResetProjectWbsAssignmentsCommand): Promise<void> {
    const { projectId, periodId, resetBy } = command;
    // TODO: 프로젝트별 삭제 메서드가 필요하면 도메인 서비스에 추가
    const assignments = await this.wbsAssignmentService.필터_조회한다({
      projectId,
      periodId,
    });

    for (const assignment of assignments) {
      await this.wbsAssignmentService.삭제한다(assignment.id, resetBy);
    }
  }
}

/**
 * 직원 WBS 할당 초기화 핸들러
 */
@CommandHandler(ResetEmployeeWbsAssignmentsCommand)
@Injectable()
export class ResetEmployeeWbsAssignmentsHandler
  implements ICommandHandler<ResetEmployeeWbsAssignmentsCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(command: ResetEmployeeWbsAssignmentsCommand): Promise<void> {
    const { employeeId, periodId, resetBy } = command;
    // TODO: 직원별 삭제 메서드가 필요하면 도메인 서비스에 추가
    const assignments = await this.wbsAssignmentService.필터_조회한다({
      employeeId,
      periodId,
    });

    for (const assignment of assignments) {
      await this.wbsAssignmentService.삭제한다(assignment.id, resetBy);
    }
  }
}
