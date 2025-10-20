import { SeedDataConfig, GeneratorResult } from '../types';

/**
 * 시드 데이터 컨텍스트 인터페이스
 */
export interface ISeedDataContext {
  /**
   * 시드 데이터를 생성한다
   */
  시드_데이터를_생성한다(config: SeedDataConfig): Promise<GeneratorResult[]>;

  /**
   * 시드 데이터를 삭제한다
   */
  시드_데이터를_삭제한다(clearAll: boolean): Promise<void>;

  /**
   * 현재 시드 데이터 상태를 조회한다
   */
  시드_데이터_상태를_조회한다(): Promise<{
    hasData: boolean;
    entityCounts: Record<string, number>;
  }>;
}
