import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationProjectAssignmentDto,
  UpdateEvaluationProjectAssignmentData,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 수정 커맨드
 */
export class UpdateProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationProjectAssignmentData,
    public readonly updatedBy: string,
  ) {}
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
    private readonly projectService: ProjectService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpdateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { id, data, updatedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 프로젝트 ID가 변경되는 경우 존재 여부 검증
      if (data.projectId) {
        const project = await this.projectService.ID로_조회한다(data.projectId);
        if (!project) {
          throw new BadRequestException(
            `프로젝트 ID ${data.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
          );
        }
      }

      const assignment = await this.projectAssignmentService.업데이트한다(
        id,
        data,
        updatedBy,
        manager,
      );
      return assignment.DTO로_변환한다();
    });
  }
}
