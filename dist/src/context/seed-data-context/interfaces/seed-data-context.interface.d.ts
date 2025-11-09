import { SeedDataConfig, GeneratorResult } from '../types';
export interface ISeedDataContext {
    시드_데이터를_생성한다(config: SeedDataConfig): Promise<GeneratorResult[]>;
    시드_데이터를_삭제한다(clearAll: boolean): Promise<void>;
    시드_데이터_상태를_조회한다(): Promise<{
        hasData: boolean;
        entityCounts: Record<string, number>;
    }>;
}
