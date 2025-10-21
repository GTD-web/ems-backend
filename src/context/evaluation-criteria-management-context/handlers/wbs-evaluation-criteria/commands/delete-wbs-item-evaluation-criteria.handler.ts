import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';

/**
 * WBS 항목 평가기준 전체 삭제 커맨드
 */
export class DeleteWbsItemEvaluationCriteriaCommand {
  constructor(
    public readonly wbsItemId: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * WBS 항목 평가기준 전체 삭제 커맨드 핸들러
 */
@CommandHandler(DeleteWbsItemEvaluationCriteriaCommand)
export class DeleteWbsItemEvaluationCriteriaHandler
  implements ICommandHandler<DeleteWbsItemEvaluationCriteriaCommand, boolean>
{
  private readonly logger = new Logger(
    DeleteWbsItemEvaluationCriteriaHandler.name,
  );

  constructor(
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async execute(
    command: DeleteWbsItemEvaluationCriteriaCommand,
  ): Promise<boolean> {
    const { wbsItemId, deletedBy } = command;

    this.logger.log(
      `WBS 항목 평가기준 전체 삭제 시작 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}`,
    );

    try {
      await this.wbsEvaluationCriteriaService.WBS항목_평가기준_전체삭제한다(
        wbsItemId,
        deletedBy,
      );

      this.logger.log(
        `WBS 항목 평가기준 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}`,
      );

      // 가중치 재계산
      await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(
        wbsItemId,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `WBS 항목 평가기준 전체 삭제 실패 - WBS 항목 ID: ${wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }
}
