import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
export declare function 가중치_기반_1차_하향평가_점수를_계산한다(evaluationPeriodId: string, employeeId: string, evaluatorIds: string[], downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationPeriodRepository: Repository<EvaluationPeriod>): Promise<number | null>;
export declare function 가중치_기반_2차_하향평가_점수를_계산한다(evaluationPeriodId: string, employeeId: string, evaluatorIds: string[], downwardEvaluationRepository: Repository<DownwardEvaluation>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, evaluationPeriodRepository: Repository<EvaluationPeriod>): Promise<number | null>;
export declare function 하향평가_등급을_조회한다(evaluationPeriodId: string, totalScore: number, periodRepository: Repository<EvaluationPeriod>): Promise<string | null>;
