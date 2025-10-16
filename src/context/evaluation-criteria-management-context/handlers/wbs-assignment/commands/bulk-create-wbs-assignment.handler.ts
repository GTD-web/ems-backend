import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
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

      return results;
    });
  }
}
