import { IQueryHandler } from '@nestjs/cqrs';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { EvaluationQuestionService } from '@domain/sub/evaluation-question/evaluation-question.service';
export declare class GetPeerEvaluationQuestionsQuery {
    readonly peerEvaluationId: string;
    constructor(peerEvaluationId: string);
}
export interface PeerEvaluationQuestionDetail {
    mappingId: string;
    questionId: string;
    questionText: string;
    questionGroupId?: string;
    displayOrder: number;
    createdAt: Date;
}
export declare class GetPeerEvaluationQuestionsHandler implements IQueryHandler<GetPeerEvaluationQuestionsQuery, PeerEvaluationQuestionDetail[]> {
    private readonly peerEvaluationQuestionMappingService;
    private readonly evaluationQuestionService;
    private readonly logger;
    constructor(peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService, evaluationQuestionService: EvaluationQuestionService);
    execute(query: GetPeerEvaluationQuestionsQuery): Promise<PeerEvaluationQuestionDetail[]>;
}
