import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
export declare class GetEvaluatorAssignedEvaluateesQuery {
    readonly evaluatorId: string;
    readonly periodId?: string | undefined;
    readonly includeCompleted: boolean;
    constructor(evaluatorId: string, periodId?: string | undefined, includeCompleted?: boolean);
}
export interface EvaluatorAssignedEvaluatee {
    evaluationId: string;
    evaluateeId: string;
    periodId: string;
    status: string;
    isCompleted: boolean;
    completedAt?: Date;
    requestDeadline?: Date;
    mappedDate: Date;
    isActive: boolean;
    evaluatee: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    evaluateeDepartment: {
        id: string;
        name: string;
        code: string;
    } | null;
    mappedBy: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
}
export declare class GetEvaluatorAssignedEvaluateesHandler implements IQueryHandler<GetEvaluatorAssignedEvaluateesQuery> {
    private readonly peerEvaluationRepository;
    private readonly logger;
    constructor(peerEvaluationRepository: Repository<PeerEvaluation>);
    execute(query: GetEvaluatorAssignedEvaluateesQuery): Promise<EvaluatorAssignedEvaluatee[]>;
}
