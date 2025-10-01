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
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: CreateProjectAssignmentCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { data, assignedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 프로젝트 존재 여부 검증 (Infrastructure 레벨)
      const project = await this.projectService.ID로_조회한다(data.projectId);
      if (!project) {
        throw new BadRequestException(
          `프로젝트 ID ${data.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
        );
      }

      // 평가기간 존재 여부 및 상태 검증 (Context 레벨)
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        data.periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간 ID ${data.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 할당 생성 불가
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 프로젝트 할당을 생성할 수 없습니다.',
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
