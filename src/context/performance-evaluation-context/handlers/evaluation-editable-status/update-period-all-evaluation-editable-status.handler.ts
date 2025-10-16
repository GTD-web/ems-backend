import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 평가기간별 모든 평가 수정 가능 상태 변경 커맨드
 */
export class UpdatePeriodAllEvaluationEditableStatusCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly isSelfEvaluationEditable: boolean,
    public readonly isPrimaryEvaluationEditable: boolean,
    public readonly isSecondaryEvaluationEditable: boolean,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * 평가기간별 모든 평가 수정 가능 상태 변경 응답
 */
export interface UpdatePeriodAllEvaluationEditableStatusResponse {
  /** 변경된 맵핑 개수 */
  updatedCount: number;
  /** 평가기간 ID */
  evaluationPeriodId: string;
  /** 자기평가 수정 가능 여부 */
  isSelfEvaluationEditable: boolean;
  /** 1차평가 수정 가능 여부 */
  isPrimaryEvaluationEditable: boolean;
  /** 2차평가 수정 가능 여부 */
  isSecondaryEvaluationEditable: boolean;
}

/**
 * 평가기간별 모든 평가 수정 가능 상태 변경 핸들러
 * 특정 평가기간의 모든 평가 대상자에 대한 평가 수정 가능 상태를 일괄 변경합니다.
 */
@Injectable()
@CommandHandler(UpdatePeriodAllEvaluationEditableStatusCommand)
export class UpdatePeriodAllEvaluationEditableStatusHandler
  implements ICommandHandler<UpdatePeriodAllEvaluationEditableStatusCommand>
{
  private readonly logger = new Logger(
    UpdatePeriodAllEvaluationEditableStatusHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpdatePeriodAllEvaluationEditableStatusCommand,
  ): Promise<UpdatePeriodAllEvaluationEditableStatusResponse> {
    const {
      evaluationPeriodId,
      isSelfEvaluationEditable,
      isPrimaryEvaluationEditable,
      isSecondaryEvaluationEditable,
      updatedBy,
    } = command;

    this.logger.log('평가기간별 모든 평가 수정 가능 상태 일괄 변경 시작', {
      evaluationPeriodId,
      isSelfEvaluationEditable,
      isPrimaryEvaluationEditable,
      isSecondaryEvaluationEditable,
    });

    return await this.transactionManager.executeTransaction(async () => {
      const updatedCount =
        await this.evaluationPeriodEmployeeMappingService.평가기간별_모든_평가_수정_가능_상태를_변경한다(
          evaluationPeriodId,
          isSelfEvaluationEditable,
          isPrimaryEvaluationEditable,
          isSecondaryEvaluationEditable,
          updatedBy,
        );

      const result: UpdatePeriodAllEvaluationEditableStatusResponse = {
        updatedCount,
        evaluationPeriodId,
        isSelfEvaluationEditable,
        isPrimaryEvaluationEditable,
        isSecondaryEvaluationEditable,
      };

      this.logger.log('평가기간별 모든 평가 수정 가능 상태 일괄 변경 완료', {
        evaluationPeriodId,
        updatedCount,
      });

      return result;
    });
  }
}

