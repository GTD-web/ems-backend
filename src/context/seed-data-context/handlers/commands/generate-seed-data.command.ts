import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { SeedDataConfig, GeneratorResult } from '../../types';
import {
  Phase1OrganizationGenerator,
  Phase2EvaluationPeriodGenerator,
  Phase3To8FullCycleGenerator,
} from '../../generators';

export class GenerateSeedDataCommand {
  constructor(public readonly config: SeedDataConfig) {}
}

@Injectable()
@CommandHandler(GenerateSeedDataCommand)
export class GenerateSeedDataHandler
  implements ICommandHandler<GenerateSeedDataCommand, GeneratorResult[]>
{
  private readonly logger = new Logger(GenerateSeedDataHandler.name);

  constructor(
    private readonly phase1Generator: Phase1OrganizationGenerator,
    private readonly phase2Generator: Phase2EvaluationPeriodGenerator,
    private readonly phase3To8Generator: Phase3To8FullCycleGenerator,
  ) {}

  async execute(command: GenerateSeedDataCommand): Promise<GeneratorResult[]> {
    const { config } = command;
    const results: GeneratorResult[] = [];

    this.logger.log(
      `시드 데이터 생성 시작 - 시나리오: ${config.scenario}, 삭제: ${config.clearExisting}`,
    );

    try {
      // Phase 1: 조직 데이터 (모든 시나리오에서 실행)
      const phase1Result = await this.phase1Generator.generate(config);
      results.push(phase1Result);

      // Phase 2: 평가기간 (WITH_PERIOD 이상)
      if (this.shouldRunPhase2OrHigher(config.scenario)) {
        const phase2Result = await this.phase2Generator.generate(
          config,
          phase1Result,
        );
        results.push(phase2Result);

        // Phase 3-8: 나머지 (WITH_ASSIGNMENTS 이상)
        if (this.shouldRunPhase3OrHigher(config.scenario)) {
          const phase3To8Result = await this.phase3To8Generator.generate(
            config,
            phase1Result,
            phase2Result,
          );
          results.push(phase3To8Result);
        }
      }

      this.logger.log('시드 데이터 생성 완료');
      return results;
    } catch (error) {
      this.logger.error('시드 데이터 생성 실패', error.stack);
      throw error;
    }
  }

  private shouldRunPhase2OrHigher(scenario: string): boolean {
    return ['with_period', 'with_assignments', 'with_setup', 'full'].includes(
      scenario,
    );
  }

  private shouldRunPhase3OrHigher(scenario: string): boolean {
    return ['with_assignments', 'with_setup', 'full'].includes(scenario);
  }
}
