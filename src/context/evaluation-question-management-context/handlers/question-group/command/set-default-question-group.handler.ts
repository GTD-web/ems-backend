import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';

/**
 * 기본 질문 그룹 설정 커맨드
 */
export class SetDefaultQuestionGroupCommand {
  constructor(
    public readonly groupId: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 기본 질문 그룹 설정 핸들러
 */
@Injectable()
@CommandHandler(SetDefaultQuestionGroupCommand)
export class SetDefaultQuestionGroupHandler
  implements ICommandHandler<SetDefaultQuestionGroupCommand, void>
{
  private readonly logger = new Logger(SetDefaultQuestionGroupHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(command: SetDefaultQuestionGroupCommand): Promise<void> {
    this.logger.log('기본 질문 그룹 설정 시작', command);

    const { groupId, updatedBy } = command;
    await this.questionGroupService.기본그룹설정한다(groupId, updatedBy);

    this.logger.log(`기본 질문 그룹 설정 완료 - ID: ${groupId}`);
  }
}

