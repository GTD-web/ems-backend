import { EntityManager, Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
export declare class WbsAssignmentWeightCalculationService {
    private readonly assignmentRepository;
    private readonly criteriaRepository;
    private readonly logger;
    constructor(assignmentRepository: Repository<EvaluationWbsAssignment>, criteriaRepository: Repository<WbsEvaluationCriteria>);
    직원_평가기간_가중치를_재계산한다(employeeId: string, periodId: string, manager?: EntityManager): Promise<void>;
    WBS별_할당된_직원_가중치를_재계산한다(wbsItemId: string, manager?: EntityManager): Promise<void>;
}
