import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ISeedDataContext } from './interfaces/seed-data-context.interface';
import { SeedDataConfig, GeneratorResult } from './types';
import {
  GenerateSeedDataCommand,
  ClearSeedDataCommand,
} from './handlers/commands';
import {
  GetSeedDataStatusQuery,
  type SeedDataStatus,
} from './handlers/queries';

@Injectable()
export class SeedDataService implements ISeedDataContext {
  private readonly logger = new Logger(SeedDataService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 시드 데이터를 생성한다
   */
  async 시드_데이터를_생성한다(
    config: SeedDataConfig,
  ): Promise<GeneratorResult[]> {
    this.logger.log(`시드 데이터 생성 요청 - 시나리오: ${config.scenario}`);

    // clearExisting이 true면 먼저 삭제
    if (config.clearExisting) {
      await this.시드_데이터를_삭제한다(true);
    }

    // 데이터 생성
    const results = await this.commandBus.execute<
      GenerateSeedDataCommand,
      GeneratorResult[]
    >(new GenerateSeedDataCommand(config));

    return results;
  }

  /**
   * 시드 데이터를 삭제한다
   */
  async 시드_데이터를_삭제한다(clearAll: boolean): Promise<void> {
    this.logger.log(`시드 데이터 삭제 요청 - 전체 삭제: ${clearAll}`);

    await this.commandBus.execute(new ClearSeedDataCommand());
  }

  /**
   * 현재 시드 데이터 상태를 조회한다
   */
  async 시드_데이터_상태를_조회한다(): Promise<{
    hasData: boolean;
    entityCounts: Record<string, number>;
  }> {
    const status = await this.queryBus.execute<
      GetSeedDataStatusQuery,
      SeedDataStatus
    >(new GetSeedDataStatusQuery());

    return status;
  }
}
