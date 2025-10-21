import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
import type {
  EvaluationWbsAssignmentDto,
  CreateEvaluationWbsAssignmentData,
} from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * 대량 WBS 할당 생성 커맨드
 */
export class BulkCreateWbsAssignmentCommand {
  constructor(
    public readonly assignments: CreateEvaluationWbsAssignmentData[],
    public readonly assignedBy: string,
  ) {}
}

/**
 * WBS 할당 대량 생성 핸들러
 * 전체 대량 할당을 하나의 트랜잭션으로 처리하여 원자성을 보장합니다.
 */
@CommandHandler(BulkCreateWbsAssignmentCommand)
@Injectable()
export class BulkCreateWbsAssignmentHandler
  implements ICommandHandler<BulkCreateWbsAssignmentCommand>
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(
    command: BulkCreateWbsAssignmentCommand,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { assignments, assignedBy } = command;

    // 전체 대량 할당을 하나의 트랜잭션으로 처리
    return await this.dataSource.transaction(async (manager) => {
      const results: EvaluationWbsAssignmentDto[] = [];

      for (const data of assignments) {
        const assignment = await this.wbsAssignmentService.생성한다(
          data,
          manager,
        );
        results.push(assignment.DTO로_변환한다());
      }

      // 영향받는 직원-기간 조합 추출
      const employeePeriodSet = new Set<string>();
      assignments.forEach((data) => {
        employeePeriodSet.add(`${data.employeeId}:${data.periodId}`);
      });

      // 각 직원-기간에 대해 가중치 재계산
      for (const key of employeePeriodSet) {
        const [employeeId, periodId] = key.split(':');
        await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(
          employeeId,
          periodId,
          manager,
        );
      }

      return results;
    });
  }
}
