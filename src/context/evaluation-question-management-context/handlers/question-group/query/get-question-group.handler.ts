import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { QuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';

/**
 * 질문 그룹 조회 쿼리
 */
export class GetQuestionGroupQuery {
  constructor(public readonly id: string) {}
}

/**
 * 질문 그룹 조회 핸들러
 */
@Injectable()
@QueryHandler(GetQuestionGroupQuery)
export class GetQuestionGroupHandler
  implements IQueryHandler<GetQuestionGroupQuery, QuestionGroupDto>
{
  private readonly logger = new Logger(GetQuestionGroupHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(query: GetQuestionGroupQuery): Promise<QuestionGroupDto> {
    this.logger.log('질문 그룹 조회 시작', query);

    const questionGroup = await this.questionGroupService.ID로조회한다(
      query.id,
    );

    if (!questionGroup) {
      throw new NotFoundException(
        `질문 그룹을 찾을 수 없습니다. (id: ${query.id})`,
      );
    }

    return questionGroup.DTO로_변환한다();
  }
}

