import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';

/**
 * 프로젝트별 WBS 할당 초기화 커맨드
 */
export class ResetProjectWbsAssignmentsCommand {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
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
