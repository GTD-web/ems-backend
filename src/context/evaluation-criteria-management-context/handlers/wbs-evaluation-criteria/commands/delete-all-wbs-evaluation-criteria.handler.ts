import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';

/**
 * 모든 WBS 평가기준 삭제 커맨드
 */
export class DeleteAllWbsEvaluationCriteriaCommand {
  constructor(public readonly deletedBy: string) {}
}

/**
 * 모든 WBS 평가기준 삭제 커맨드 핸들러
 */
@Injectable()
@CommandHandler(DeleteAllWbsEvaluationCriteriaCommand)
export class DeleteAllWbsEvaluationCriteriaHandler
  implements ICommandHandler<DeleteAllWbsEvaluationCriteriaCommand, boolean>
{
  private readonly logger = new Logger(
    DeleteAllWbsEvaluationCriteriaHandler.name,
  );

  constructor(
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
  ) {}

  async execute(
    command: DeleteAllWbsEvaluationCriteriaCommand,
  ): Promise<boolean> {
    const { deletedBy } = command;

    this.logger.log(`모든 WBS 평가기준 삭제 시작 - 삭제자: ${deletedBy}`);

    try {
      await this.wbsEvaluationCriteriaService.모든_평가기준을_삭제한다(
        deletedBy,
      );

      this.logger.log('모든 WBS 평가기준 삭제 완료');

      return true;
    } catch (error) {
      this.logger.error('모든 WBS 평가기준 삭제 실패', error.stack);
      throw error;
    }
  }
}

