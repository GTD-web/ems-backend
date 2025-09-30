import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@/domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 생성 커맨드
 */
export class CreateProjectAssignmentCommand {
  constructor(
    public readonly data: CreateEvaluationProjectAssignmentData,
    public readonly assignedBy: string,
  ) {}
}

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
    private readonly projectService: ProjectService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: CreateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { data, assignedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 프로젝트 존재 여부 검증
      const project = await this.projectService.ID로_조회한다(data.projectId);
      if (!project) {
        throw new BadRequestException(
          `프로젝트 ID ${data.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
        );
      }

      const assignment = await this.projectAssignmentService.생성한다(
        data,
        manager,
      );
      return assignment.DTO로_변환한다();
    });
  }
}
