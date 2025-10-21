import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { UpdateWbsEvaluationCriteriaData } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';

/**
 * WBS 평가기준 수정 커맨드
 */
export class UpdateWbsEvaluationCriteriaCommand {
  constructor(
    public readonly id: string,
    public readonly updateData: UpdateWbsEvaluationCriteriaData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * WBS 평가기준 수정 커맨드 핸들러
 */
@CommandHandler(UpdateWbsEvaluationCriteriaCommand)
export class UpdateWbsEvaluationCriteriaHandler
  implements ICommandHandler<UpdateWbsEvaluationCriteriaCommand>
{
  private readonly logger = new Logger(UpdateWbsEvaluationCriteriaHandler.name);

  constructor(
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(command: UpdateWbsEvaluationCriteriaCommand) {
    const { id, updateData, updatedBy } = command;

    this.logger.log(`WBS 평가기준 수정 시작 - ID: ${id}, 수정자: ${updatedBy}`);

    try {
      const criteria = await this.wbsEvaluationCriteriaService.업데이트한다(
        id,
        updateData,
        updatedBy,
      );

      this.logger.log(`WBS 평가기준 수정 완료 - ID: ${id}`);

      // 중요도가 변경된 경우 가중치 재계산
      if (updateData.importance !== undefined) {
        await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(
          criteria.wbsItemId,
        );
      }

      return criteria.DTO로_변환한다();
    } catch (error) {
      this.logger.error(`WBS 평가기준 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
