import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';

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
  implements ICommandHandler<DeleteWbsEvaluationCriteriaCommand>
{
  private readonly logger = new Logger(DeleteWbsEvaluationCriteriaHandler.name);

  constructor(
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
  ) {}

  async execute(command: DeleteWbsEvaluationCriteriaCommand) {
    const { id, deletedBy } = command;

    this.logger.log(`WBS 평가기준 삭제 시작 - ID: ${id}, 삭제자: ${deletedBy}`);

    try {
      await this.wbsEvaluationCriteriaService.삭제한다(id, deletedBy);

      this.logger.log(`WBS 평가기준 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`WBS 평가기준 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
