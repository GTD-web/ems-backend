import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
export declare class GetDownwardEvaluationDetailQuery {
    readonly evaluationId: string;
    constructor(evaluationId: string);
}
export interface DownwardEvaluationDetailResult {
    id: string;
    evaluationDate: Date;
    downwardEvaluationContent: string | null;
    downwardEvaluationScore: number | null;
    evaluationType: string;
    isCompleted: boolean;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    version: number;
    employee: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    evaluator: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    wbsItem: {
        id: string;
        title: string;
        wbsCode: string;
    } | null;
    period: {
        id: string;
        name: string;
        startDate: Date;
        status: string;
    } | null;
    selfEvaluation: {
        id: string;
        wbsItemId: string;
        performanceResult: string | null;
        selfEvaluationContent: string | null;
        selfEvaluationScore: number | null;
        isCompleted: boolean;
        completedAt: Date | null;
        evaluationDate: Date;
    } | null;
}
export declare class GetDownwardEvaluationDetailHandler implements IQueryHandler<GetDownwardEvaluationDetailQuery> {
    private readonly downwardEvaluationRepository;
    private readonly logger;
    constructor(downwardEvaluationRepository: Repository<DownwardEvaluation>);
    execute(query: GetDownwardEvaluationDetailQuery): Promise<DownwardEvaluationDetailResult>;
}
