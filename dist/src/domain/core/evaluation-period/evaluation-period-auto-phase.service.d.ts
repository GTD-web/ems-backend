import { Repository } from 'typeorm';
import { EvaluationPeriod } from './evaluation-period.entity';
import { EvaluationPeriodService } from './evaluation-period.service';
export declare class EvaluationPeriodAutoPhaseService {
    private readonly evaluationPeriodRepository;
    private readonly evaluationPeriodService;
    private readonly logger;
    constructor(evaluationPeriodRepository: Repository<EvaluationPeriod>, evaluationPeriodService: EvaluationPeriodService);
    private get koreaTime();
    private toKoreaDayjs;
    autoPhaseTransition(): Promise<number>;
    private checkAndTransitionPhase;
    private getNextPhase;
    private shouldTransitionToNextPhase;
    private getPhaseDeadline;
    manualPhaseTransition(periodId: string): Promise<EvaluationPeriod | null>;
    checkAllActivePeriods(): Promise<number>;
    adjustStatusAndPhaseAfterScheduleUpdate(periodId: string, changedBy: string): Promise<EvaluationPeriod | null>;
}
