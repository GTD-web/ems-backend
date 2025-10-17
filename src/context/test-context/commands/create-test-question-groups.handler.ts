import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroup } from '../../../domain/sub/question-group/question-group.entity';
import { QuestionGroupDto } from '../../../domain/sub/question-group/question-group.types';

/**
 * 테스트용 질문 그룹 생성 커맨드
 */
export class CreateTestQuestionGroupsCommand implements ICommand {
  constructor(public readonly createdBy: string) {}
}

/**
 * 테스트용 질문 그룹 생성 핸들러
 */
@CommandHandler(CreateTestQuestionGroupsCommand)
@Injectable()
export class CreateTestQuestionGroupsHandler
  implements
    ICommandHandler<CreateTestQuestionGroupsCommand, QuestionGroupDto[]>
{
  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
  ) {}

  async execute(
    command: CreateTestQuestionGroupsCommand,
  ): Promise<QuestionGroupDto[]> {
    const { createdBy } = command;
    const timestamp = Date.now();
    const groups: QuestionGroup[] = [];

    // 기본 질문 그룹 생성
    const defaultGroup = new QuestionGroup({
      name: `기본 질문 그룹 ${timestamp}`,
      isDefault: true,
      isDeletable: false,
      createdBy,
    });
    groups.push(defaultGroup);

    // 일반 질문 그룹 생성
    const normalGroup1 = new QuestionGroup({
      name: `동료평가 질문 그룹 ${timestamp}`,
      isDefault: false,
      isDeletable: true,
      createdBy,
    });
    groups.push(normalGroup1);

    const normalGroup2 = new QuestionGroup({
      name: `자기평가 질문 그룹 ${timestamp}`,
      isDefault: false,
      isDeletable: true,
      createdBy,
    });
    groups.push(normalGroup2);

    const savedGroups = await this.questionGroupRepository.save(groups);
    console.log(`질문 그룹 ${savedGroups.length}개 생성 완료`);

    return savedGroups.map((g) => g.DTO로_변환한다());
  }
}
