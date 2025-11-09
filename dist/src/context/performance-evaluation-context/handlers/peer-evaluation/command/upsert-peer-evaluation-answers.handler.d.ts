import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
export interface AnswerItem {
    questionId: string;
    answer: string;
    score?: number;
}
export declare class UpsertPeerEvaluationAnswersCommand {
    readonly peerEvaluationId: string;
    readonly answers: AnswerItem[];
    readonly answeredBy: string;
    constructor(peerEvaluationId: string, answers: AnswerItem[], answeredBy: string);
}
export declare class UpsertPeerEvaluationAnswersHandler implements ICommandHandler<UpsertPeerEvaluationAnswersCommand, number> {
    private readonly peerEvaluationService;
    private readonly peerEvaluationQuestionMappingService;
    private readonly peerEvaluationRepository;
    private readonly logger;
    constructor(peerEvaluationService: PeerEvaluationService, peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService, peerEvaluationRepository: Repository<PeerEvaluation>);
    execute(command: UpsertPeerEvaluationAnswersCommand): Promise<number>;
}
