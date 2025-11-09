import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { SeedDataConfig, GeneratorResult } from '../types';
export declare class Phase3AssignmentGenerator {
    private readonly projectAssignmentRepository;
    private readonly wbsAssignmentRepository;
    private readonly wbsItemRepository;
    private readonly logger;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsItemRepository: Repository<WbsItem>);
    generate(config: SeedDataConfig, phase1Result: GeneratorResult, phase2Result: GeneratorResult): Promise<GeneratorResult>;
    private 생성_프로젝트_할당들;
    private 생성_WBS_할당들;
    private 랜덤_선택;
    private 배치로_저장한다;
}
