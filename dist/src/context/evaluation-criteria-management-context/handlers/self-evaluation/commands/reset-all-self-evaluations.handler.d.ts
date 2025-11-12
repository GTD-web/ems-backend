import { ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
export interface ResetAllSelfEvaluationsResult {
    deletedCounts: {
        downwardEvaluations: number;
        selfEvaluations: number;
    };
    message: string;
}
export declare class ResetAllSelfEvaluationsCommand {
    readonly deletedBy: string;
    constructor(deletedBy: string);
}
export declare class ResetAllSelfEvaluationsHandler implements ICommandHandler<ResetAllSelfEvaluationsCommand> {
    private readonly dataSource;
    private readonly selfEvaluationService;
    private readonly downwardEvaluationService;
    private readonly logger;
    constructor(dataSource: DataSource, selfEvaluationService: WbsSelfEvaluationService, downwardEvaluationService: DownwardEvaluationService);
    execute(command: ResetAllSelfEvaluationsCommand): Promise<ResetAllSelfEvaluationsResult>;
}
