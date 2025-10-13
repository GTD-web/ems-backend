import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationProjectAssignmentDto,
  OrderDirection,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 순서 변경 커맨드
 */
export class ChangeProjectAssignmentOrderCommand {
  constructor(
    public readonly assignmentId: string,
    public readonly direction: OrderDirection,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 순서 변경 커맨드 핸들러
 * 위/아래 이동 시 자동으로 다른 항목들의 순서도 재정렬한다
 */
@CommandHandler(ChangeProjectAssignmentOrderCommand)
@Injectable()
export class ChangeProjectAssignmentOrderHandler
  implements ICommandHandler<ChangeProjectAssignmentOrderCommand>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ChangeProjectAssignmentOrderCommand,
  ): Promise<EvaluationProjectAssignmentDto> {
    const { assignmentId, direction, updatedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 1. 도메인 서비스를 통해 할당 조회
      const assignment = await this.projectAssignmentService.ID로_조회한다(
        assignmentId,
        manager,
      );
      if (!assignment) {
        throw new NotFoundException(
          `프로젝트 할당 ID ${assignmentId}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      // 2. 평가기간 상태 검증 (Context 레벨 비즈니스 규칙)
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        assignment.periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 순서 변경 불가 (Context 레벨 비즈니스 규칙)
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 프로젝트 할당 순서를 변경할 수 없습니다.',
        );
      }

      // 3. 도메인 서비스에 순서 변경 위임
      const updatedAssignment =
        await this.projectAssignmentService.순서를_변경한다(
          assignmentId,
          direction,
          updatedBy,
          manager,
        );

      return updatedAssignment.DTO로_변환한다();
    });
  }
}
