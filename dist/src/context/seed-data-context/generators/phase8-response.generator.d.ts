import { Repository } from 'typeorm';
import { EvaluationResponse } from '@domain/sub/evaluation-response/evaluation-response.entity';
import { SeedDataConfig, GeneratorResult } from '../types';
export declare class Phase8ResponseGenerator {
    private readonly evaluationResponseRepository;
    private readonly logger;
    constructor(evaluationResponseRepository: Repository<EvaluationResponse>);
    generate(config: SeedDataConfig, phase1Result: GeneratorResult, phase6Result: GeneratorResult, phase7Result: GeneratorResult): Promise<GeneratorResult>;
    private 생성_평가응답들;
    private 랜덤_선택;
    private 배치로_저장한다;
}
