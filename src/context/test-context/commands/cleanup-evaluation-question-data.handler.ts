import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroup } from '../../../domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '../../../domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '../../../domain/sub/question-group-mapping/question-group-mapping.entity';

/**
 * 평가 질문 테스트 데이터 정리 결과
 */
export interface CleanupEvaluationQuestionDataResult {
  mappings: number;
  questions: number;
  groups: number;
}

/**
 * 평가 질문 테스트 데이터 정리 커맨드
 */
export class CleanupEvaluationQuestionDataCommand implements ICommand {}

/**
 * 평가 질문 테스트 데이터 정리 핸들러
 */
@CommandHandler(CleanupEvaluationQuestionDataCommand)
@Injectable()
export class CleanupEvaluationQuestionDataHandler
  implements
    ICommandHandler<
      CleanupEvaluationQuestionDataCommand,
      CleanupEvaluationQuestionDataResult
    >
{
  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
  ) {}

  async execute(
    command: CleanupEvaluationQuestionDataCommand,
  ): Promise<CleanupEvaluationQuestionDataResult> {
    // 매핑 먼저 삭제
    const mappings = await this.questionGroupMappingRepository.find();
    if (mappings.length > 0) {
      await this.questionGroupMappingRepository.remove(mappings);
    }

    // 질문 삭제
    const questions = await this.evaluationQuestionRepository.find();
    if (questions.length > 0) {
      await this.evaluationQuestionRepository.remove(questions);
    }

    // 그룹 삭제
    const groups = await this.questionGroupRepository.find();
    if (groups.length > 0) {
      await this.questionGroupRepository.remove(groups);
    }

    console.log(
      `평가 질문 테스트 데이터 정리 완료 - 매핑: ${mappings.length}, 질문: ${questions.length}, 그룹: ${groups.length}`,
    );

    return {
      mappings: mappings.length,
      questions: questions.length,
      groups: groups.length,
    };
  }
}
