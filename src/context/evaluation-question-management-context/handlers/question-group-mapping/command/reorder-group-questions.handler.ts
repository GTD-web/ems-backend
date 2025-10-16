import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';

/**
 * 그룹 내 질문 순서 재정의 커맨드
 */
export class ReorderGroupQuestionsCommand {
  constructor(
    public readonly groupId: string,
    public readonly questionIds: string[],
    public readonly updatedBy: string,
  ) {}
}

/**
 * 그룹 내 질문 순서 재정의 핸들러
 *
 * 질문 ID 배열의 순서대로 displayOrder를 재할당합니다.
 * 배열의 인덱스가 새로운 displayOrder가 됩니다.
 */
@Injectable()
@CommandHandler(ReorderGroupQuestionsCommand)
export class ReorderGroupQuestionsHandler
  implements ICommandHandler<ReorderGroupQuestionsCommand, void>
{
  private readonly logger = new Logger(ReorderGroupQuestionsHandler.name);

  constructor(
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  async execute(command: ReorderGroupQuestionsCommand): Promise<void> {
    this.logger.log('그룹 내 질문 순서 재정의 시작', command);

    const { groupId, questionIds, updatedBy } = command;

    // 1. 그룹의 모든 매핑 조회
    const mappings = await this.questionGroupMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.groupId = :groupId', { groupId })
      .andWhere('mapping.deletedAt IS NULL')
      .getMany();

    if (mappings.length === 0) {
      throw new NotFoundException(
        `그룹에 질문이 없습니다. (groupId: ${groupId})`,
      );
    }

    // 2. 제공된 questionIds가 모두 그룹에 속한 질문인지 확인
    const mappingQuestionIds = mappings.map((m) => m.questionId);
    const invalidIds = questionIds.filter(
      (id) => !mappingQuestionIds.includes(id),
    );

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `그룹에 속하지 않은 질문이 포함되어 있습니다. (ids: ${invalidIds.join(', ')})`,
      );
    }

    // 3. 제공된 questionIds가 그룹의 모든 질문을 포함하는지 확인
    if (questionIds.length !== mappings.length) {
      throw new BadRequestException(
        `모든 질문의 ID를 제공해야 합니다. (제공: ${questionIds.length}, 필요: ${mappings.length})`,
      );
    }

    // 4. 중복 ID 확인
    const uniqueIds = new Set(questionIds);
    if (uniqueIds.size !== questionIds.length) {
      throw new BadRequestException('중복된 질문 ID가 포함되어 있습니다.');
    }

    // 5. 각 질문의 displayOrder를 배열 인덱스로 업데이트
    const updatedMappings: QuestionGroupMapping[] = [];

    for (let i = 0; i < questionIds.length; i++) {
      const questionId = questionIds[i];
      const mapping = mappings.find((m) => m.questionId === questionId);

      if (mapping) {
        mapping.표시순서변경한다(i, updatedBy);
        updatedMappings.push(mapping);
      }
    }

    // 6. 일괄 저장
    await this.questionGroupMappingRepository.save(updatedMappings);

    this.logger.log(
      `그룹 내 질문 순서 재정의 완료 - 그룹 ID: ${groupId}, 질문 개수: ${questionIds.length}`,
    );
  }
}

