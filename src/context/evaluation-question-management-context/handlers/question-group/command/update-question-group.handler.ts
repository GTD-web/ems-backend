import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { UpdateQuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';

/**
 * 질문 그룹 수정 커맨드
 */
export class UpdateQuestionGroupCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateQuestionGroupDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 질문 그룹 수정 핸들러
 */
@Injectable()
@CommandHandler(UpdateQuestionGroupCommand)
export class UpdateQuestionGroupHandler
  implements ICommandHandler<UpdateQuestionGroupCommand, void>
{
  private readonly logger = new Logger(UpdateQuestionGroupHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(command: UpdateQuestionGroupCommand): Promise<void> {
    this.logger.log('질문 그룹 수정 시작', command);

    const { id, data, updatedBy } = command;
    await this.questionGroupService.업데이트한다(id, data, updatedBy);

    this.logger.log(`질문 그룹 수정 완료 - ID: ${id}`);
  }
}

