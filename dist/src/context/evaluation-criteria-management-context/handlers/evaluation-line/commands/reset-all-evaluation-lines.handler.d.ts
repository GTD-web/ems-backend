import { ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
export interface ResetAllEvaluationLinesResult {
    deletedCounts: {
        peerEvaluationQuestionMappings: number;
        peerEvaluations: number;
        downwardEvaluations: number;
        evaluationLineMappings: number;
    };
    message: string;
}
export declare class ResetAllEvaluationLinesCommand {
    readonly deletedBy: string;
    constructor(deletedBy: string);
}
export declare class ResetAllEvaluationLinesHandler implements ICommandHandler<ResetAllEvaluationLinesCommand> {
    private readonly dataSource;
    private readonly evaluationLineMappingService;
    private readonly downwardEvaluationService;
    private readonly peerEvaluationService;
    private readonly peerEvaluationQuestionMappingService;
    private readonly logger;
    constructor(dataSource: DataSource, evaluationLineMappingService: EvaluationLineMappingService, downwardEvaluationService: DownwardEvaluationService, peerEvaluationService: PeerEvaluationService, peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService);
    execute(command: ResetAllEvaluationLinesCommand): Promise<ResetAllEvaluationLinesResult>;
}
