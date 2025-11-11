import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationLine } from '../../../../../domain/core/evaluation-line/evaluation-line.entity';
import type { EvaluationLineDto, EvaluationLineFilter } from '../../../../../domain/core/evaluation-line/evaluation-line.types';
export declare class GetEvaluationLineListQuery {
    readonly filter: EvaluationLineFilter;
    constructor(filter: EvaluationLineFilter);
}
export declare class GetEvaluationLineListHandler implements IQueryHandler<GetEvaluationLineListQuery, EvaluationLineDto[]> {
    private readonly evaluationLineRepository;
    private readonly logger;
    constructor(evaluationLineRepository: Repository<EvaluationLine>);
    execute(query: GetEvaluationLineListQuery): Promise<EvaluationLineDto[]>;
}
