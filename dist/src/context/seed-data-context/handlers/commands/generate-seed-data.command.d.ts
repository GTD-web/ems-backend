import { ICommandHandler } from '@nestjs/cqrs';
import { SeedDataConfig, GeneratorResult } from '../../types';
import { Phase1OrganizationGenerator, Phase2EvaluationPeriodGenerator, Phase3AssignmentGenerator, Phase4EvaluationCriteriaGenerator, Phase5DeliverableGenerator, Phase6QuestionGenerator, Phase7EvaluationGenerator, Phase8ResponseGenerator } from '../../generators';
export declare class GenerateSeedDataCommand {
    readonly config: SeedDataConfig;
    constructor(config: SeedDataConfig);
}
export declare class GenerateSeedDataHandler implements ICommandHandler<GenerateSeedDataCommand, GeneratorResult[]> {
    private readonly phase1Generator;
    private readonly phase2Generator;
    private readonly phase3Generator;
    private readonly phase4Generator;
    private readonly phase5Generator;
    private readonly phase6Generator;
    private readonly phase7Generator;
    private readonly phase8Generator;
    private readonly logger;
    constructor(phase1Generator: Phase1OrganizationGenerator, phase2Generator: Phase2EvaluationPeriodGenerator, phase3Generator: Phase3AssignmentGenerator, phase4Generator: Phase4EvaluationCriteriaGenerator, phase5Generator: Phase5DeliverableGenerator, phase6Generator: Phase6QuestionGenerator, phase7Generator: Phase7EvaluationGenerator, phase8Generator: Phase8ResponseGenerator);
    execute(command: GenerateSeedDataCommand): Promise<GeneratorResult[]>;
    private shouldRunPhase;
}
