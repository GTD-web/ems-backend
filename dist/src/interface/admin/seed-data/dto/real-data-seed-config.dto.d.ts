import type { StateDistributionConfig } from '@context/seed-data-context/types';
export declare class EvaluationConfig {
    periodCount?: number;
}
export declare class RealDataSeedConfigDto {
    scenario: 'minimal' | 'with_period' | 'with_assignments' | 'with_setup' | 'full';
    clearExisting?: boolean;
    projectCount?: number;
    wbsPerProject?: number;
    evaluationConfig?: EvaluationConfig;
    stateDistribution?: StateDistributionConfig;
    includeCurrentUserAsEvaluator?: boolean;
}
