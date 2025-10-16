import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';

/**
 * 질문 표시 순서 변경 커맨드
 */
export class UpdateQuestionDisplayOrderCommand {
  constructor(
    public readonly mappingId: string,
    public readonly displayOrder: number,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 질문 표시 순서 변경 핸들러
 */
@Injectable()
@CommandHandler(UpdateQuestionDisplayOrderCommand)
export class UpdateQuestionDisplayOrderHandler
  implements ICommandHandler<UpdateQuestionDisplayOrderCommand, void>
{
  private readonly logger = new Logger(UpdateQuestionDisplayOrderHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(command: UpdateQuestionDisplayOrderCommand): Promise<void> {
    this.logger.log('질문 표시 순서 변경 시작', command);

    const { mappingId, displayOrder, updatedBy } = command;
    await this.questionGroupMappingService.업데이트한다(
      mappingId,
      { displayOrder },
      updatedBy,
    );

    this.logger.log(
      `질문 표시 순서 변경 완료 - 매핑 ID: ${mappingId}, 순서: ${displayOrder}`,
    );
  }
}

