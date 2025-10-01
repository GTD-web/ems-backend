import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

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
    private readonly projectService: ProjectService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: BulkCreateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { assignments, assignedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      const results: EvaluationProjectAssignmentDto[] = [];

      // 모든 프로젝트 ID 검증
      const projectIds = [
        ...new Set(assignments.map((data) => data.projectId)),
      ];
      for (const projectId of projectIds) {
        const project = await this.projectService.ID로_조회한다(projectId);
        if (!project) {
          throw new BadRequestException(
            `프로젝트 ID ${projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
          );
        }
      }

      // 모든 평가기간 ID 검증 및 상태 확인
      const periodIds = [...new Set(assignments.map((data) => data.periodId))];
      for (const periodId of periodIds) {
        const evaluationPeriod =
          await this.evaluationPeriodService.ID로_조회한다(periodId, manager);
        if (!evaluationPeriod) {
          throw new BadRequestException(
            `평가기간 ID ${periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
          );
        }
        if (evaluationPeriod.완료된_상태인가()) {
          throw new UnprocessableEntityException(
            `완료된 평가기간 ID ${periodId}에는 프로젝트 할당을 생성할 수 없습니다.`,
          );
        }
      }

      for (const data of assignments) {
        const assignment = await this.projectAssignmentService.생성한다(
          data,
          manager,
        );
        results.push(assignment.DTO로_변환한다());
      }

      return results;
    });
  }
}
