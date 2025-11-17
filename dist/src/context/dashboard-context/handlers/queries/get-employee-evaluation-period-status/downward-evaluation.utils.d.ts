import { Repository } from 'typeorm';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { DownwardEvaluationStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 하향평가_통합_상태를_계산한다(downwardStatus: DownwardEvaluationStatus, approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed'): DownwardEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
export declare function 이차평가_전체_상태를_계산한다(evaluatorStatuses: Array<DownwardEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed'>): DownwardEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
export declare function 하향평가_상태를_조회한다(evaluationPeriodId: string, employeeId: string, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, periodRepository: Repository<EvaluationPeriod>, employeeRepository?: Repository<any>): Promise<{
    primary: {
        evaluator: {
            id: string;
            name: string;
            employeeNumber: string;
            email: string;
            departmentName?: string;
            rankName?: string;
        } | null;
        status: DownwardEvaluationStatus;
        assignedWbsCount: number;
        completedEvaluationCount: number;
        isSubmitted: boolean;
        totalScore: number | null;
        grade: string | null;
    };
    secondary: {
        evaluators: Array<{
            evaluator: {
                id: string;
                name: string;
                employeeNumber: string;
                email: string;
                departmentName?: string;
                rankName?: string;
            };
            status: DownwardEvaluationStatus;
            assignedWbsCount: number;
            completedEvaluationCount: number;
            isSubmitted: boolean;
        }>;
        isSubmitted: boolean;
        totalScore: number | null;
        grade: string | null;
    };
}>;
export declare function 평가자별_하향평가_상태를_조회한다(evaluationPeriodId: string, employeeId: string, evaluationType: DownwardEvaluationType, evaluatorId: string | null, downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>): Promise<{
    status: DownwardEvaluationStatus;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
    averageScore: number | null;
}>;
export declare function 특정_평가자의_하향평가_상태를_조회한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, evaluationType: DownwardEvaluationType, downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationLineMappingRepository?: Repository<EvaluationLineMapping>, evaluationLineRepository?: Repository<EvaluationLine>): Promise<{
    status: DownwardEvaluationStatus;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
    averageScore: number | null;
}>;
