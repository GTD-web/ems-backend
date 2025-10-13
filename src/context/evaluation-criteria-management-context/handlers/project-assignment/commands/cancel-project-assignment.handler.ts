import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 프로젝트 할당 취소 커맨드
 */
export class CancelProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 프로젝트 할당 취소 커맨드 핸들러
 */
@CommandHandler(CancelProjectAssignmentCommand)
@Injectable()
export class CancelProjectAssignmentHandler
  implements ICommandHandler<CancelProjectAssignmentCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly projectService: ProjectService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: CancelProjectAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 할당 존재 여부 확인 (도메인 서비스 사용)
      const assignment = await this.projectAssignmentService.ID로_조회한다(
        id,
        manager,
      );
      if (!assignment) {
        throw new NotFoundException(
          `프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      // 프로젝트 존재 여부 확인
      const assignmentDto = assignment.DTO로_변환한다();
      const project = await this.projectService.ID로_조회한다(
        assignmentDto.projectId,
      );
      if (!project) {
        throw new NotFoundException(
          `프로젝트 ID ${assignmentDto.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
        );
      }

      // 할당 삭제
      await this.projectAssignmentService.삭제한다(id, cancelledBy, manager);
    });
  }
}
