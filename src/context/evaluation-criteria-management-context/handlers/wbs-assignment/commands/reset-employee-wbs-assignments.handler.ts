import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';

/**
 * 직원별 WBS 할당 초기화 커맨드
 */
export class ResetEmployeeWbsAssignmentsCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
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
