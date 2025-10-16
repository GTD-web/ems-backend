import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { CreateQuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';

/**
 * 질문 그룹 생성 커맨드
 */
export class CreateQuestionGroupCommand {
  constructor(
    public readonly data: CreateQuestionGroupDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 질문 그룹 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateQuestionGroupCommand)
export class CreateQuestionGroupHandler
  implements ICommandHandler<CreateQuestionGroupCommand, string>
{
  private readonly logger = new Logger(CreateQuestionGroupHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(command: CreateQuestionGroupCommand): Promise<string> {
    this.logger.log('질문 그룹 생성 시작', command);

    const { data, createdBy } = command;
    const questionGroup = await this.questionGroupService.생성한다(
      data,
      createdBy,
    );

    this.logger.log(
      `질문 그룹 생성 완료 - ID: ${questionGroup.id}, 그룹명: ${questionGroup.name}`,
    );
    return questionGroup.id;
  }
}

