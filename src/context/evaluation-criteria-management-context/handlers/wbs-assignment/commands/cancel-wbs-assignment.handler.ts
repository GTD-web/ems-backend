import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';

/**
 * WBS 할당 취소 커맨드
 */
export class CancelWbsAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * WBS 할당 취소 핸들러
 *
 * 비즈니스 규칙:
 * - 할당이 존재하지 않을 경우 멱등성을 보장하기 위해 조용히 성공 처리
 * - 이미 삭제된 할당을 다시 삭제해도 에러를 발생시키지 않음
 * - 완료된 평가기간에는 할당 취소 불가
 */
@CommandHandler(CancelWbsAssignmentCommand)
@Injectable()
export class CancelWbsAssignmentHandler
  implements ICommandHandler<CancelWbsAssignmentCommand>
{
  private readonly logger = new Logger(CancelWbsAssignmentHandler.name);

  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(command: CancelWbsAssignmentCommand): Promise<void> {
    const { id, cancelledBy } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 1. 컨텍스트 레벨에서 할당 존재 여부 확인
      const assignment = await this.wbsAssignmentService.ID로_조회한다(
        id,
        manager,
      );

      // 2. 할당이 없으면 멱등성 보장을 위해 조용히 성공 처리
      if (!assignment) {
        this.logger.log(
          `WBS 할당을 찾을 수 없습니다. 이미 삭제된 것으로 간주합니다. - ID: ${id}`,
        );
        return; // 성공으로 처리
      }

      // 3. 평가기간 상태 검증 (Context 레벨 비즈니스 규칙)
      const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
        assignment.periodId,
        manager,
      );
      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
        );
      }

      // 완료된 평가기간에는 할당 취소 불가 (Context 레벨 비즈니스 규칙)
      if (evaluationPeriod.완료된_상태인가()) {
        throw new UnprocessableEntityException(
          '완료된 평가기간에는 WBS 할당을 취소할 수 없습니다.',
        );
      }

      // 4. 할당이 존재하고 평가기간이 완료되지 않았으면 삭제 수행
      const employeeId = assignment.employeeId;
      const periodId = assignment.periodId;

      await this.wbsAssignmentService.삭제한다(id, cancelledBy, manager);

      this.logger.log(`WBS 할당 취소 완료 - ID: ${id}`);

      // 5. 가중치 재계산 (트랜잭션 매니저 전달)
      await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(
        employeeId,
        periodId,
        manager,
      );
    });
  }
}
