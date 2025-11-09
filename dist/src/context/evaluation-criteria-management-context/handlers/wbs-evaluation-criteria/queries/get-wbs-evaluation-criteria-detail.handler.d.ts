import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
export declare class GetWbsEvaluationCriteriaDetailQuery {
    readonly id: string;
    constructor(id: string);
}
export interface WbsEvaluationCriteriaDetailResult {
    id: string;
    criteria: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
    wbsItem: {
        id: string;
        wbsCode: string;
        title: string;
        status: string;
        level: number;
        startDate: Date;
        endDate: Date;
        progressPercentage: string;
    } | null;
}
export declare class GetWbsEvaluationCriteriaDetailHandler implements IQueryHandler<GetWbsEvaluationCriteriaDetailQuery> {
    private readonly wbsEvaluationCriteriaRepository;
    private readonly logger;
    constructor(wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>);
    execute(query: GetWbsEvaluationCriteriaDetailQuery): Promise<WbsEvaluationCriteriaDetailResult | null>;
}
