import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
import type {
  EvaluationWbsAssignmentDto,
  CreateEvaluationWbsAssignmentData,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(
    command: CreateWbsAssignmentCommand,
  ): Promise<EvaluationWbsAssignmentDto> {
    const { data, assignedBy } = command;
    const assignment = await this.wbsAssignmentService.생성한다(data);
    
    // 가중치 재계산 (해당 직원의 해당 평가기간 모든 WBS 할당)
    await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(
      data.employeeId,
      data.periodId,
    );
    
    return assignment.DTO로_변환한다();
  }
}
