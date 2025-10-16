import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type {
  QuestionGroupDto,
  QuestionGroupFilter,
} from '../../../../../domain/sub/question-group/question-group.types';

/**
 * 질문 그룹 목록 조회 쿼리
 */
export class GetQuestionGroupsQuery {
  constructor(public readonly filter?: QuestionGroupFilter) {}
}

/**
 * 질문 그룹 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetQuestionGroupsQuery)
export class GetQuestionGroupsHandler
  implements IQueryHandler<GetQuestionGroupsQuery, QuestionGroupDto[]>
{
  private readonly logger = new Logger(GetQuestionGroupsHandler.name);

  constructor(private readonly questionGroupService: QuestionGroupService) {}

  async execute(query: GetQuestionGroupsQuery): Promise<QuestionGroupDto[]> {
    this.logger.log('질문 그룹 목록 조회 시작', query);

    const questionGroups = query.filter
      ? await this.questionGroupService.필터조회한다(query.filter)
      : await this.questionGroupService.전체조회한다();

    return questionGroups.map((group) => group.DTO로_변환한다());
  }
}

