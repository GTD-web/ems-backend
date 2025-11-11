import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Employee } from '@domain/common/employee/employee.entity';
export declare function calculateSelfEvaluationScore(evaluationPeriodId: string, employeeId: string, completedSelfEvaluations: number, selfEvaluationRepository: Repository<WbsSelfEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationPeriodRepository: Repository<EvaluationPeriod>): Promise<{
    totalScore: number | null;
    grade: string | null;
}>;
export declare function calculatePrimaryDownwardEvaluationScore(evaluationPeriodId: string, employeeId: string, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationPeriodRepository: Repository<EvaluationPeriod>): Promise<{
    totalScore: number | null;
    grade: string | null;
    isSubmitted: boolean;
}>;
export declare function calculateSecondaryDownwardEvaluationScore(evaluationPeriodId: string, employeeId: string, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationPeriodRepository: Repository<EvaluationPeriod>, employeeRepository?: Repository<Employee>): Promise<{
    totalScore: number | null;
    grade: string | null;
    isSubmitted: boolean;
    evaluators: Array<{
        evaluatorId: string;
        evaluatorName: string;
        evaluatorEmployeeNumber: string;
        evaluatorEmail: string;
        assignedWbsCount: number;
        completedEvaluationCount: number;
        isSubmitted: boolean;
    }>;
}>;
