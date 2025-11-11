import { SeedScenario } from '@context/seed-data-context/types';
import type { StateDistributionConfig } from '@context/seed-data-context/types';
declare class DataScaleDto {
    departmentCount: number;
    employeeCount: number;
    projectCount: number;
    wbsPerProject: number;
}
export declare class SeedDataConfigDto {
    scenario: SeedScenario;
    clearExisting: boolean;
    dataScale: DataScaleDto;
    evaluationConfig?: {
        periodCount: number;
    };
    stateDistribution?: StateDistributionConfig;
    includeCurrentUserAsEvaluator?: boolean;
    useRealDepartments?: boolean;
    useRealEmployees?: boolean;
}
export {};
