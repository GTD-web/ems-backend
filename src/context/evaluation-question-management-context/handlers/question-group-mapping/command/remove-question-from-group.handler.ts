import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';

/**
 * 그룹에서 질문 제거 커맨드
 */
export class RemoveQuestionFromGroupCommand {
  constructor(
    public readonly mappingId: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 그룹에서 질문 제거 핸들러
 */
@Injectable()
@CommandHandler(RemoveQuestionFromGroupCommand)
export class RemoveQuestionFromGroupHandler
  implements ICommandHandler<RemoveQuestionFromGroupCommand, void>
{
  private readonly logger = new Logger(RemoveQuestionFromGroupHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(command: RemoveQuestionFromGroupCommand): Promise<void> {
    this.logger.log('그룹에서 질문 제거 시작', command);

    const { mappingId, deletedBy } = command;
    await this.questionGroupMappingService.삭제한다(mappingId, deletedBy);

    this.logger.log(`그룹에서 질문 제거 완료 - 매핑 ID: ${mappingId}`);
  }
}

