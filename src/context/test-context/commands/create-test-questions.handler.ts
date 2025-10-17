import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationQuestion } from '../../../domain/sub/evaluation-question/evaluation-question.entity';
import { EvaluationQuestionDto } from '../../../domain/sub/evaluation-question/evaluation-question.types';

/**
 * 테스트용 평가 질문 생성 커맨드
 */
export class CreateTestQuestionsCommand implements ICommand {
  constructor(public readonly createdBy: string) {}
}

/**
 * 테스트용 평가 질문 생성 핸들러
 */
@CommandHandler(CreateTestQuestionsCommand)
@Injectable()
export class CreateTestQuestionsHandler
  implements
    ICommandHandler<CreateTestQuestionsCommand, EvaluationQuestionDto[]>
{
  constructor(
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
  ) {}

  async execute(
    command: CreateTestQuestionsCommand,
  ): Promise<EvaluationQuestionDto[]> {
    const { createdBy } = command;
    const questions: EvaluationQuestion[] = [];

    // 동료평가용 질문 생성
    questions.push(
      new EvaluationQuestion({
        text: '동료의 업무 수행 능력을 평가해주세요.',
        minScore: 1,
        maxScore: 5,
        createdBy,
      }),
    );

    questions.push(
      new EvaluationQuestion({
        text: '동료의 협업 능력을 평가해주세요.',
        minScore: 1,
        maxScore: 5,
        createdBy,
      }),
    );

    questions.push(
      new EvaluationQuestion({
        text: '동료의 의사소통 능력을 평가해주세요.',
        minScore: 1,
        maxScore: 5,
        createdBy,
      }),
    );

    questions.push(
      new EvaluationQuestion({
        text: '동료의 문제 해결 능력을 평가해주세요.',
        minScore: 1,
        maxScore: 5,
        createdBy,
      }),
    );

    questions.push(
      new EvaluationQuestion({
        text: '동료의 책임감을 평가해주세요.',
        minScore: 1,
        maxScore: 5,
        createdBy,
      }),
    );

    const savedQuestions =
      await this.evaluationQuestionRepository.save(questions);
    console.log(`평가 질문 ${savedQuestions.length}개 생성 완료`);

    return savedQuestions.map((q) => q.DTO로_변환한다());
  }
}
