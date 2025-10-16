import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';

/**
 * 질문 그룹 삭제 커맨드
 */
export class DeleteQuestionGroupCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 질문 그룹 삭제 핸들러
 */
@Injectable()
@CommandHandler(DeleteQuestionGroupCommand)
export class DeleteQuestionGroupHandler
  implements ICommandHandler<DeleteQuestionGroupCommand, void>
{
  private readonly logger = new Logger(DeleteQuestionGroupHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(command: DeleteQuestionGroupCommand): Promise<void> {
    this.logger.log('질문 그룹 삭제 시작', command);

    const { id, deletedBy } = command;
    await this.questionGroupService.삭제한다(id, deletedBy);

    this.logger.log(`질문 그룹 삭제 완료 - ID: ${id}`);
  }
}

