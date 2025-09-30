import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '../../../../../domain/common/project/project.service';
import { TransactionManagerService } from '../../../../../../libs/database/transaction-manager.service';
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
    private readonly projectService: ProjectService,
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
