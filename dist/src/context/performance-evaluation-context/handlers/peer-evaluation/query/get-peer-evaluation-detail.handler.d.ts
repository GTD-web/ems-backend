import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { PeerEvaluationQuestionMapping } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity';
export declare class GetPeerEvaluationDetailQuery {
    readonly evaluationId: string;
    constructor(evaluationId: string);
}
export interface PeerEvaluationDetailResult {
    id: string;
    evaluationDate: Date;
    status: string;
    isCompleted: boolean;
    completedAt?: Date;
    requestDeadline?: Date;
    mappedDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    version: number;
    period: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
    } | null;
    evaluator: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
        rankName?: string;
        roles?: string[];
    } | null;
    evaluatorDepartment: {
        id: string;
        name: string;
        code: string;
    } | null;
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
        status: string;
    } | null;
    questions: {
        id: string;
        text: string;
        minScore?: number;
        maxScore?: number;
        displayOrder: number;
        answer?: string;
        score?: number;
        answeredAt?: Date;
        answeredBy?: string;
    }[];
}
export declare class GetPeerEvaluationDetailHandler implements IQueryHandler<GetPeerEvaluationDetailQuery> {
    private readonly peerEvaluationRepository;
    private readonly questionMappingRepository;
    private readonly logger;
    constructor(peerEvaluationRepository: Repository<PeerEvaluation>, questionMappingRepository: Repository<PeerEvaluationQuestionMapping>);
    execute(query: GetPeerEvaluationDetailQuery): Promise<PeerEvaluationDetailResult | null>;
}
