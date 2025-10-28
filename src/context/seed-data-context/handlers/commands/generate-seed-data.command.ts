import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { SeedDataConfig, GeneratorResult, SeedScenario } from '../../types';
import {
  Phase1OrganizationGenerator,
  Phase2EvaluationPeriodGenerator,
  Phase3AssignmentGenerator,
  Phase4EvaluationCriteriaGenerator,
  Phase5DeliverableGenerator,
  Phase6QuestionGenerator,
  Phase7EvaluationGenerator,
  Phase8ResponseGenerator,
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
    private readonly phase3Generator: Phase3AssignmentGenerator,
    private readonly phase4Generator: Phase4EvaluationCriteriaGenerator,
    private readonly phase5Generator: Phase5DeliverableGenerator,
    private readonly phase6Generator: Phase6QuestionGenerator,
    private readonly phase7Generator: Phase7EvaluationGenerator,
    private readonly phase8Generator: Phase8ResponseGenerator,
  ) {}

  async execute(command: GenerateSeedDataCommand): Promise<GeneratorResult[]> {
    const { config } = command;
    const results: GeneratorResult[] = [];

    this.logger.log(
      `시드 데이터 생성 시작 - 시나리오: ${config.scenario}, 삭제: ${config.clearExisting}`,
    );
    this.logger.log(
      `설정 확인 - useRealDepartments: ${config.useRealDepartments}, useRealEmployees: ${config.useRealEmployees}`,
    );
    console.log(
      `시드 데이터 생성 시작 - 시나리오: ${config.scenario}, 삭제: ${config.clearExisting}`,
    );
    console.log(
      `설정 확인 - useRealDepartments: ${config.useRealDepartments}, useRealEmployees: ${config.useRealEmployees}`,
    );
    this.logger.log(`shouldRunPhase(2, ${config.scenario}): ${this.shouldRunPhase(2, config.scenario)}`);
    this.logger.log(`shouldRunPhase(3, ${config.scenario}): ${this.shouldRunPhase(3, config.scenario)}`);
    this.logger.log(`shouldRunPhase(4, ${config.scenario}): ${this.shouldRunPhase(4, config.scenario)}`);

    try {
      // Phase 1: 조직 데이터 (모든 시나리오에서 실행)
      const phase1Result = await this.phase1Generator.generate(config);
      results.push(phase1Result);

      // Phase 2: 평가기간 (WITH_PERIOD 이상)
      if (this.shouldRunPhase(2, config.scenario)) {
        this.logger.log('Phase 2 실행 중...');
        const phase2Result = await this.phase2Generator.generate(
          config,
          phase1Result,
        );
        results.push(phase2Result);
        this.logger.log('Phase 2 실행 완료');

        // Phase 3: 프로젝트 및 WBS 할당 (WITH_ASSIGNMENTS 이상)
        if (this.shouldRunPhase(3, config.scenario)) {
          this.logger.log('Phase 3 실행 중...');
          const phase3Result = await this.phase3Generator.generate(
            config,
            phase1Result,
            phase2Result,
          );
          results.push(phase3Result);
          this.logger.log('Phase 3 실행 완료');

          // Phase 4: 평가 기준 및 라인 (WITH_ASSIGNMENTS 이상)
          if (this.shouldRunPhase(4, config.scenario)) {
            this.logger.log('Phase 4 실행 중...');
            const phase4Result = await this.phase4Generator.generate(
              config,
              phase1Result,
              phase2Result,
              phase3Result,
            );
            results.push(phase4Result);
            this.logger.log('Phase 4 실행 완료');

            // Phase 5: 산출물 (WITH_ASSIGNMENTS 이상)
            if (this.shouldRunPhase(5, config.scenario)) {
              const phase5Result = await this.phase5Generator.generate(
                config,
                phase1Result,
                phase2Result,
              );
              results.push(phase5Result);

              // Phase 6: 질문 그룹 및 질문 (WITH_SETUP 이상)
              if (this.shouldRunPhase(6, config.scenario)) {
                const phase6Result = await this.phase6Generator.generate(
                  config,
                  phase1Result,
                );
                results.push(phase6Result);

                // Phase 7: 평가 실행 (FULL)
                if (this.shouldRunPhase(7, config.scenario)) {
                  const phase7Result = await this.phase7Generator.generate(
                    config,
                    phase1Result,
                    phase2Result,
                  );
                  results.push(phase7Result);

                  // Phase 8: 응답 (FULL)
                  if (this.shouldRunPhase(8, config.scenario)) {
                    const phase8Result = await this.phase8Generator.generate(
                      config,
                      phase1Result,
                      phase6Result,
                      phase7Result,
                    );
                    results.push(phase8Result);
                  }
                }
              }
            }
          }
        }
      }

      this.logger.log('시드 데이터 생성 완료');
      return results;
    } catch (error) {
      this.logger.error('시드 데이터 생성 실패', error.stack);
      throw error;
    }
  }

  private shouldRunPhase(phase: number, scenario: SeedScenario): boolean {
    const phaseMap = {
      [SeedScenario.MINIMAL]: 1,
      [SeedScenario.WITH_PERIOD]: 7, // Phase 7까지 실행하여 자기평가 생성
      [SeedScenario.WITH_ASSIGNMENTS]: 5,
      [SeedScenario.WITH_SETUP]: 6,
      [SeedScenario.FULL]: 8,
    };
    return phase <= phaseMap[scenario];
  }
}
