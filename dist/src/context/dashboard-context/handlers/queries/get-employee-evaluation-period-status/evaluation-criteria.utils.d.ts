import { EvaluationCriteriaStatus, WbsCriteriaStatus, EvaluationLineStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 평가항목_상태를_계산한다(projectCount: number, wbsCount: number): EvaluationCriteriaStatus;
export declare function WBS평가기준_상태를_계산한다(totalWbsCount: number, wbsWithCriteriaCount: number): WbsCriteriaStatus;
export declare function 평가기준설정_진행_상태를_계산한다(evaluationCriteriaStatus: EvaluationCriteriaStatus, wbsCriteriaStatus: WbsCriteriaStatus, evaluationLineStatus: EvaluationLineStatus): 'none' | 'in_progress' | 'complete';
export declare function 평가기준설정_상태를_계산한다(evaluationCriteriaStatus: EvaluationCriteriaStatus, wbsCriteriaStatus: WbsCriteriaStatus, evaluationLineStatus: EvaluationLineStatus, approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed' | null, isSubmitted: boolean): 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
