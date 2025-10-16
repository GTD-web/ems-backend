import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { QuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';

/**
 * 기본 질문 그룹 조회 쿼리
 */
export class GetDefaultQuestionGroupQuery {}

/**
 * 기본 질문 그룹 조회 핸들러
 */
@Injectable()
@QueryHandler(GetDefaultQuestionGroupQuery)
export class GetDefaultQuestionGroupHandler
  implements IQueryHandler<GetDefaultQuestionGroupQuery, QuestionGroupDto>
{
  private readonly logger = new Logger(GetDefaultQuestionGroupHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(
    query: GetDefaultQuestionGroupQuery,
  ): Promise<QuestionGroupDto> {
    this.logger.log('기본 질문 그룹 조회 시작', query);

    const questionGroup = await this.questionGroupService.기본그룹조회한다();

    if (!questionGroup) {
      throw new NotFoundException('기본 질문 그룹을 찾을 수 없습니다.');
    }

    return questionGroup.DTO로_변환한다();
  }
}

