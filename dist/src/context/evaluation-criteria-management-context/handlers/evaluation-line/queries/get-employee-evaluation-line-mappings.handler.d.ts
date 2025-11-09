import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type { EvaluationLineMappingDto } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
export declare class GetEmployeeEvaluationLineMappingsQuery {
    readonly employeeId: string;
    constructor(employeeId: string);
}
export declare class GetEmployeeEvaluationLineMappingsHandler implements IQueryHandler<GetEmployeeEvaluationLineMappingsQuery, EvaluationLineMappingDto[]> {
    private readonly evaluationLineMappingRepository;
    private readonly logger;
    constructor(evaluationLineMappingRepository: Repository<EvaluationLineMapping>);
    execute(query: GetEmployeeEvaluationLineMappingsQuery): Promise<EvaluationLineMappingDto[]>;
}
