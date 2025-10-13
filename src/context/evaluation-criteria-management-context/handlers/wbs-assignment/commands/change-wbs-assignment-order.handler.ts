import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  EvaluationWbsAssignmentDto,
  OrderDirection,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 순서 변경 커맨드
 */
export class ChangeWbsAssignmentOrderCommand {
  constructor(
    public readonly assignmentId: string,
    public readonly direction: OrderDirection,
    public readonly updatedBy: string,
  ) {}
}

/**
 * WBS 할당 순서 변경 커맨드 핸들러
 * 위/아래 이동 시 자동으로 다른 항목들의 순서도 재정렬한다
 */
@CommandHandler(ChangeWbsAssignmentOrderCommand)
@Injectable()
export class ChangeWbsAssignmentOrderHandler
  implements ICommandHandler<ChangeWbsAssignmentOrderCommand>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ChangeWbsAssignmentOrderCommand,
  ): Promise<EvaluationWbsAssignmentDto> {
    const { assignmentId, direction, updatedBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 1. 도메인 서비스를 통해 할당 조회
      const assignment = await this.wbsAssignmentService.ID로_조회한다(
        assignmentId,
        manager,
      );
      if (!assignment) {
        throw new NotFoundException(
          `WBS 할당 ID ${assignmentId}에 해당하는 할당을 찾을 수 없습니다.`,
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
          '완료된 평가기간에는 WBS 할당 순서를 변경할 수 없습니다.',
        );
      }

      // 3. 도메인 서비스에 순서 변경 위임
      const updatedAssignment = await this.wbsAssignmentService.순서를_변경한다(
        assignmentId,
        direction,
        updatedBy,
        manager,
      );

      // 도메인 서비스에서 null을 반환할 수 있음 (이중 검증 방지)
      if (!updatedAssignment) {
        throw new NotFoundException(
          `WBS 할당 ID ${assignmentId}에 해당하는 할당을 찾을 수 없습니다.`,
        );
      }

      return updatedAssignment.DTO로_변환한다();
    });
  }
}
