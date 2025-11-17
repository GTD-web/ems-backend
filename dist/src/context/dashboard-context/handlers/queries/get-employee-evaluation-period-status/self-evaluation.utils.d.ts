import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { SelfEvaluationStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 자기평가_진행_상태를_조회한다(evaluationPeriodId: string, employeeId: string, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, periodRepository: Repository<EvaluationPeriod>): Promise<{
    totalMappingCount: number;
    completedMappingCount: number;
    submittedToEvaluatorCount: number;
    isSubmittedToEvaluator: boolean;
    submittedToManagerCount: number;
    isSubmittedToManager: boolean;
    totalScore: number | null;
    grade: string | null;
}>;
export declare function 자기평가_상태를_계산한다(totalMappingCount: number, completedMappingCount: number): SelfEvaluationStatus;
export declare function 자기평가_통합_상태를_계산한다(selfEvaluationStatus: SelfEvaluationStatus, approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed'): SelfEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
export declare function 가중치_기반_자기평가_점수를_계산한다(evaluationPeriodId: string, employeeId: string, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, periodRepository: Repository<EvaluationPeriod>): Promise<number | null>;
export declare function 자기평가_등급을_조회한다(evaluationPeriodId: string, totalScore: number, periodRepository: Repository<EvaluationPeriod>): Promise<string | null>;
