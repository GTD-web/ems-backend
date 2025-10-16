import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { QuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';

/**
 * 그룹의 질문 목록 조회 쿼리
 */
export class GetGroupQuestionsQuery {
  constructor(public readonly groupId: string) {}
}

/**
 * 그룹의 질문 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetGroupQuestionsQuery)
export class GetGroupQuestionsHandler
  implements IQueryHandler<GetGroupQuestionsQuery, QuestionGroupMappingDto[]>
{
  private readonly logger = new Logger(GetGroupQuestionsHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(
    query: GetGroupQuestionsQuery,
  ): Promise<QuestionGroupMappingDto[]> {
    this.logger.log('그룹의 질문 목록 조회 시작', query);

    const mappings = await this.questionGroupMappingService.그룹ID로조회한다(
      query.groupId,
    );

    return mappings.map((mapping) => mapping.DTO로_변환한다());
  }
}

