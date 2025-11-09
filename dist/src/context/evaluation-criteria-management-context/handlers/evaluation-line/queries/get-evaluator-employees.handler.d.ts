import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
export declare class GetEvaluatorEmployeesQuery {
    readonly evaluationPeriodId: string;
    readonly evaluatorId: string;
    constructor(evaluationPeriodId: string, evaluatorId: string);
}
export interface EvaluatorEmployeesResult {
    evaluatorId: string;
    employees: {
        employeeId: string;
        wbsItemId?: string;
        evaluationLineId: string;
        createdBy?: string;
        updatedBy?: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
}
export declare class GetEvaluatorEmployeesHandler implements IQueryHandler<GetEvaluatorEmployeesQuery, EvaluatorEmployeesResult> {
    private readonly evaluationLineMappingRepository;
    constructor(evaluationLineMappingRepository: Repository<EvaluationLineMapping>);
    execute(query: GetEvaluatorEmployeesQuery): Promise<EvaluatorEmployeesResult>;
}
