import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import { QuestionGroup } from '../../../../../domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '../../../../../domain/sub/evaluation-question/evaluation-question.entity';

/**
 * 그룹에 여러 질문 추가 커맨드
 */
export class AddMultipleQuestionsToGroupCommand {
  constructor(
    public readonly groupId: string,
    public readonly questionIds: string[],
    public readonly startDisplayOrder: number,
    public readonly createdBy: string,
  ) {}
}

/**
 * 그룹에 여러 질문 추가 핸들러
 *
 * 여러 질문을 한 번에 그룹에 추가합니다.
 * displayOrder는 startDisplayOrder부터 순차적으로 할당됩니다.
 */
@Injectable()
@CommandHandler(AddMultipleQuestionsToGroupCommand)
export class AddMultipleQuestionsToGroupHandler
  implements ICommandHandler<AddMultipleQuestionsToGroupCommand, string[]>
{
  private readonly logger = new Logger(AddMultipleQuestionsToGroupHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
  ) {}

  async execute(
    command: AddMultipleQuestionsToGroupCommand,
  ): Promise<string[]> {
    this.logger.log('여러 질문을 그룹에 추가 시작', command);

    const { groupId, questionIds, startDisplayOrder, createdBy } = command;

    // 1. 그룹 존재 확인
    const group = await this.questionGroupRepository
      .createQueryBuilder('group')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.deletedAt IS NULL')
      .getOne();

    if (!group) {
      throw new NotFoundException(
        `질문 그룹을 찾을 수 없습니다. (id: ${groupId})`,
      );
    }

    // 2. 질문들 존재 확인
    const questions = await this.evaluationQuestionRepository
      .createQueryBuilder('question')
      .where('question.id IN (:...questionIds)', { questionIds })
      .andWhere('question.deletedAt IS NULL')
      .getMany();

    if (questions.length !== questionIds.length) {
      const foundIds = questions.map((q) => q.id);
      const missingIds = questionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `일부 질문을 찾을 수 없습니다. (ids: ${missingIds.join(', ')})`,
      );
    }

    // 3. 각 질문을 순차적으로 그룹에 추가
    const createdMappingIds: string[] = [];
    let currentDisplayOrder = startDisplayOrder;

    for (const questionId of questionIds) {
      try {
        // 이미 존재하는 매핑인지 확인
        const existingMapping =
          await this.questionGroupMappingService.그룹질문으로조회한다(
            groupId,
            questionId,
          );

        if (existingMapping) {
          this.logger.warn(
            `이미 그룹에 추가된 질문 건너뜀 - 질문 ID: ${questionId}`,
          );
          continue;
        }

        const mapping = await this.questionGroupMappingService.생성한다(
          {
            groupId,
            questionId,
            displayOrder: currentDisplayOrder,
          },
          createdBy,
        );

        createdMappingIds.push(mapping.id);
        currentDisplayOrder++;

        this.logger.log(
          `질문이 그룹에 추가됨 - 질문 ID: ${questionId}, 매핑 ID: ${mapping.id}`,
        );
      } catch (error) {
        this.logger.error(
          `질문 추가 실패 - 질문 ID: ${questionId}`,
          error.message,
        );
        // 개별 실패는 로그만 남기고 계속 진행
      }
    }

    this.logger.log(
      `여러 질문을 그룹에 추가 완료 - 그룹 ID: ${groupId}, 추가된 개수: ${createdMappingIds.length}/${questionIds.length}`,
    );

    return createdMappingIds;
  }
}
