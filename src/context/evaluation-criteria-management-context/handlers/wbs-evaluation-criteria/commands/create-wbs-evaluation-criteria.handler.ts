import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { CreateWbsEvaluationCriteriaData } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';

/**
 * WBS 평가기준 생성 커맨드
 */
export class CreateWbsEvaluationCriteriaCommand {
  constructor(
    public readonly createData: CreateWbsEvaluationCriteriaData,
    public readonly createdBy: string,
  ) {}
}

/**
 * WBS 평가기준 생성 커맨드 핸들러
 */
@CommandHandler(CreateWbsEvaluationCriteriaCommand)
export class CreateWbsEvaluationCriteriaHandler
  implements ICommandHandler<CreateWbsEvaluationCriteriaCommand>
{
  private readonly logger = new Logger(CreateWbsEvaluationCriteriaHandler.name);

  constructor(
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
  ) {}

  async execute(command: CreateWbsEvaluationCriteriaCommand) {
    const { createData, createdBy } = command;

    this.logger.log(
      `WBS 평가기준 생성 시작 - WBS 항목: ${createData.wbsItemId}, 기준: ${createData.criteria}`,
    );

    try {
      const criteria =
        await this.wbsEvaluationCriteriaService.생성한다(createData);

      this.logger.log(`WBS 평가기준 생성 완료 - ID: ${criteria.id}`);

      return criteria.DTO로_변환한다();
    } catch (error) {
      this.logger.error(
        `WBS 평가기준 생성 실패 - WBS 항목: ${createData.wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }
}
