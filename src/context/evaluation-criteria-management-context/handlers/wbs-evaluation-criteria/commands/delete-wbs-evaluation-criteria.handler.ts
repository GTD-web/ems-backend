import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';

/**
 * WBS 평가기준 삭제 커맨드
 */
export class DeleteWbsEvaluationCriteriaCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * WBS 평가기준 삭제 커맨드 핸들러
 */
@CommandHandler(DeleteWbsEvaluationCriteriaCommand)
export class DeleteWbsEvaluationCriteriaHandler
  implements ICommandHandler<DeleteWbsEvaluationCriteriaCommand, boolean>
{
  private readonly logger = new Logger(DeleteWbsEvaluationCriteriaHandler.name);

  constructor(
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(command: DeleteWbsEvaluationCriteriaCommand): Promise<boolean> {
    const { id, deletedBy } = command;

    this.logger.log(`WBS 평가기준 삭제 시작 - ID: ${id}, 삭제자: ${deletedBy}`);

    try {
      // 삭제 전에 wbsItemId 조회
      const criteria = await this.wbsEvaluationCriteriaService.ID로_조회한다(id);
      const wbsItemId = criteria?.wbsItemId;

      await this.wbsEvaluationCriteriaService.삭제한다(id, deletedBy);

      this.logger.log(`WBS 평가기준 삭제 완료 - ID: ${id}`);

      // 가중치 재계산
      if (wbsItemId) {
        await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(
          wbsItemId,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(`WBS 평가기준 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
