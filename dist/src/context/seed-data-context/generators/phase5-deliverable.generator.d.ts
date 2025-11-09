import { Repository } from 'typeorm';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { SeedDataConfig, GeneratorResult } from '../types';
export declare class Phase5DeliverableGenerator {
    private readonly deliverableRepository;
    private readonly logger;
    constructor(deliverableRepository: Repository<Deliverable>);
    generate(config: SeedDataConfig, phase1Result: GeneratorResult, phase2Result: GeneratorResult): Promise<GeneratorResult>;
    private 생성_산출물들;
    private 배치로_저장한다;
}
