import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../domain/sub/question-group-mapping/question-group-mapping.entity';
import { QuestionGroupMappingDto } from '../../../domain/sub/question-group-mapping/question-group-mapping.types';

/**
 * 질문 그룹에 질문 매핑 커맨드
 */
export class MapQuestionsToGroupCommand implements ICommand {
  constructor(
    public readonly groupId: string,
    public readonly questionIds: string[],
    public readonly createdBy: string,
  ) {}
}

/**
 * 질문 그룹에 질문 매핑 핸들러
 */
@CommandHandler(MapQuestionsToGroupCommand)
@Injectable()
export class MapQuestionsToGroupHandler
  implements
    ICommandHandler<MapQuestionsToGroupCommand, QuestionGroupMappingDto[]>
{
  constructor(
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  async execute(
    command: MapQuestionsToGroupCommand,
  ): Promise<QuestionGroupMappingDto[]> {
    const { groupId, questionIds, createdBy } = command;
    const mappings: QuestionGroupMapping[] = [];

    for (let i = 0; i < questionIds.length; i++) {
      const mapping = new QuestionGroupMapping({
        groupId,
        questionId: questionIds[i],
        displayOrder: i,
        createdBy,
      });
      mappings.push(mapping);
    }

    const savedMappings =
      await this.questionGroupMappingRepository.save(mappings);
    console.log(
      `질문 그룹 매핑 ${savedMappings.length}개 생성 완료 (그룹 ID: ${groupId})`,
    );

    return savedMappings.map((m) => m.DTO로_변환한다());
  }
}
