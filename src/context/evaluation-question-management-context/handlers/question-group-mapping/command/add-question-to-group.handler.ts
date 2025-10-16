import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { CreateQuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';

/**
 * 그룹에 질문 추가 커맨드
 */
export class AddQuestionToGroupCommand {
  constructor(
    public readonly data: CreateQuestionGroupMappingDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 그룹에 질문 추가 핸들러
 */
@Injectable()
@CommandHandler(AddQuestionToGroupCommand)
export class AddQuestionToGroupHandler
  implements ICommandHandler<AddQuestionToGroupCommand, string>
{
  private readonly logger = new Logger(AddQuestionToGroupHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(command: AddQuestionToGroupCommand): Promise<string> {
    this.logger.log('그룹에 질문 추가 시작', command);

    const { data, createdBy } = command;
    const mapping = await this.questionGroupMappingService.생성한다(
      data,
      createdBy,
    );

    this.logger.log(
      `그룹에 질문 추가 완료 - 매핑 ID: ${mapping.id}, 그룹: ${data.groupId}, 질문: ${data.questionId}`,
    );
    return mapping.id;
  }
}

