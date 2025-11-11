import { Repository } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { SeedDataConfig, GeneratorResult } from '../types';
export declare class Phase2EvaluationPeriodGenerator {
    private readonly periodRepository;
    private readonly mappingRepository;
    private readonly logger;
    constructor(periodRepository: Repository<EvaluationPeriod>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>);
    generate(config: SeedDataConfig, phase1Result: GeneratorResult): Promise<GeneratorResult>;
    private 생성_평가기간들;
    private 생성_기본_등급구간;
    private 맵_단계_키_to_Enum;
    private 설정_단계별_마감일;
    private 생성_평가대상자_매핑들;
    private 평가기간을_배치로_저장한다;
    private 매핑을_배치로_저장한다;
}
