import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
export declare class GetUpdaterEvaluationLineMappingsQuery {
    readonly updatedBy: string;
    constructor(updatedBy: string);
}
export declare class GetUpdaterEvaluationLineMappingsHandler implements IQueryHandler<GetUpdaterEvaluationLineMappingsQuery, EvaluationLineMappingDto[]> {
    private readonly evaluationLineMappingRepository;
    constructor(evaluationLineMappingRepository: Repository<EvaluationLineMapping>);
    execute(query: GetUpdaterEvaluationLineMappingsQuery): Promise<EvaluationLineMappingDto[]>;
}
