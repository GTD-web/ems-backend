import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsAssignmentWeightCalculationService } from '@context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service';
import { SeedDataConfig, GeneratorResult } from '../types';
export declare class Phase4EvaluationCriteriaGenerator {
    private readonly wbsCriteriaRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationLineMappingRepository;
    private readonly wbsAssignmentRepository;
    private readonly weightCalculationService;
    private readonly logger;
    constructor(wbsCriteriaRepository: Repository<WbsEvaluationCriteria>, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, weightCalculationService: WbsAssignmentWeightCalculationService);
    generate(config: SeedDataConfig, phase1Result: GeneratorResult, phase2Result: GeneratorResult, phase3Result: GeneratorResult): Promise<GeneratorResult>;
    private 생성_WBS평가기준들;
    private 생성_평가라인들;
    private 생성_평가라인매핑들;
    private 부서별_직원_그룹화;
    private 일차평가자_선택;
    private WBS할당_가중치를_재계산한다;
    private 실제_할당된_WBS_ID를_조회한다;
    private 배치로_저장한다;
}
