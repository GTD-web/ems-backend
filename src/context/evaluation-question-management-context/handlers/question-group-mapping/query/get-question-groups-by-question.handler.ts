import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { QuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';

/**
 * 질문이 속한 그룹 목록 조회 쿼리
 */
export class GetQuestionGroupsByQuestionQuery {
  constructor(public readonly questionId: string) {}
}

/**
 * 질문이 속한 그룹 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetQuestionGroupsByQuestionQuery)
export class GetQuestionGroupsByQuestionHandler
  implements
    IQueryHandler<GetQuestionGroupsByQuestionQuery, QuestionGroupMappingDto[]>
{
  private readonly logger = new Logger(GetQuestionGroupsByQuestionHandler.name);

  constructor(
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(
    query: GetQuestionGroupsByQuestionQuery,
  ): Promise<QuestionGroupMappingDto[]> {
    this.logger.log('질문이 속한 그룹 목록 조회 시작', query);

    const mappings = await this.questionGroupMappingService.질문ID로조회한다(
      query.questionId,
    );

    return mappings.map((mapping) => mapping.DTO로_변환한다());
  }
}

