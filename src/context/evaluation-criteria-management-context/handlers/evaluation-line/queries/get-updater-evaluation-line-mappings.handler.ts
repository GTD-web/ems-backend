import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';

export class GetUpdaterEvaluationLineMappingsQuery {
  constructor(public readonly updatedBy: string) {}
}

@QueryHandler(GetUpdaterEvaluationLineMappingsQuery)
export class GetUpdaterEvaluationLineMappingsHandler
  implements IQueryHandler<GetUpdaterEvaluationLineMappingsQuery, EvaluationLineMappingDto[]>
{
  constructor(
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
  ) {}

  async execute(
    query: GetUpdaterEvaluationLineMappingsQuery,
  ): Promise<EvaluationLineMappingDto[]> {
    const mappings = await this.evaluationLineMappingService.수정자별_조회한다(
      query.updatedBy,
    );

    return mappings.map((mapping) => mapping.DTO로_변환한다());
  }
}
