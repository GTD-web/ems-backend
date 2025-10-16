import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가 타입
 */
export enum EvaluationType {
  SELF = 'self', // 자기평가
  PRIMARY = 'primary', // 1차평가
  SECONDARY = 'secondary', // 2차평가
  ALL = 'all', // 모든 평가
}

/**
 * 평가 수정 가능 상태 변경 커맨드
 */
export class UpdateEvaluationEditableStatusCommand {
  constructor(
    public readonly mappingId: string,
    public readonly evaluationType: EvaluationType,
    public readonly isEditable: boolean,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * 평가 수정 가능 상태 변경 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationEditableStatusCommand)
export class UpdateEvaluationEditableStatusHandler
  implements ICommandHandler<UpdateEvaluationEditableStatusCommand>
{
  private readonly logger = new Logger(
    UpdateEvaluationEditableStatusHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpdateEvaluationEditableStatusCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const { mappingId, evaluationType, isEditable, updatedBy } = command;

    this.logger.log('평가 수정 가능 상태 변경 시작', {
      mappingId,
      evaluationType,
      isEditable,
    });

    return await this.transactionManager.executeTransaction(async () => {
      let result: EvaluationPeriodEmployeeMappingDto;

      switch (evaluationType) {
        case EvaluationType.SELF:
          result =
            await this.evaluationPeriodEmployeeMappingService.자기평가_수정_가능_상태를_변경한다(
              mappingId,
              isEditable,
              updatedBy,
            );
          break;

        case EvaluationType.PRIMARY:
          result =
            await this.evaluationPeriodEmployeeMappingService.일차평가_수정_가능_상태를_변경한다(
              mappingId,
              isEditable,
              updatedBy,
            );
          break;

        case EvaluationType.SECONDARY:
          result =
            await this.evaluationPeriodEmployeeMappingService.이차평가_수정_가능_상태를_변경한다(
              mappingId,
              isEditable,
              updatedBy,
            );
          break;

        case EvaluationType.ALL:
          result =
            await this.evaluationPeriodEmployeeMappingService.모든_평가_수정_가능_상태를_변경한다(
              mappingId,
              isEditable,
              updatedBy,
            );
          break;

        default:
          throw new Error(`지원하지 않는 평가 타입입니다: ${evaluationType}`);
      }

      this.logger.log('평가 수정 가능 상태 변경 완료', {
        mappingId,
        evaluationType,
        isEditable,
      });

      return result;
    });
  }
}

