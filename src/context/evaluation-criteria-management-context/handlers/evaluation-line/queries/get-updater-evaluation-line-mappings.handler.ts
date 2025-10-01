import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';

export class GetUpdaterEvaluationLineMappingsQuery {
  constructor(public readonly updatedBy: string) {}
}

@QueryHandler(GetUpdaterEvaluationLineMappingsQuery)
export class GetUpdaterEvaluationLineMappingsHandler
  implements
    IQueryHandler<
      GetUpdaterEvaluationLineMappingsQuery,
      EvaluationLineMappingDto[]
    >
{
  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  ) {}

  async execute(
    query: GetUpdaterEvaluationLineMappingsQuery,
  ): Promise<EvaluationLineMappingDto[]> {
    const mappings = await this.evaluationLineMappingRepository.find({
      where: { updatedBy: query.updatedBy },
      order: { updatedAt: 'DESC' },
    });

    return mappings.map((mapping) => mapping.DTO로_변환한다());
  }
}
