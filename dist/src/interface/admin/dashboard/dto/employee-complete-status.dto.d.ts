import { EvaluationPeriodInfoDto } from './employee-assigned-data.dto';
import { EmployeeInfoDto } from './employee-assigned-data.dto';
import { ExclusionInfoDto } from './employee-evaluation-period-status.dto';
import { PeerEvaluationInfoDto } from './employee-evaluation-period-status.dto';
import { FinalEvaluationInfoDto } from './employee-evaluation-period-status.dto';
import { AssignedProjectWithWbsDto } from './employee-assigned-data.dto';
export declare class EvaluatorInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
}
export declare class EvaluationLineWithEvaluatorsDto {
    status: 'complete' | 'in_progress' | 'none';
    hasPrimaryEvaluator: boolean;
    hasSecondaryEvaluator: boolean;
    primaryEvaluator?: EvaluatorInfoDto | null;
    secondaryEvaluators: EvaluatorInfoDto[];
}
export declare class WbsCriteriaStatusDto {
    status: 'complete' | 'in_progress' | 'none';
    totalWbsCount: number;
    wbsWithCriteriaCount: number;
}
export declare class PerformanceStatusDto {
    status: 'complete' | 'in_progress' | 'none';
    totalWbsCount: number;
    completedCount: number;
}
export declare class SelfEvaluationStatusDto {
    status: 'complete' | 'in_progress' | 'none';
    totalCount: number;
    completedCount: number;
    totalScore: number | null;
    grade: string | null;
}
export declare class DownwardEvaluationStatusDto {
    status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    totalWbsCount: number;
    completedCount: number;
    isSubmitted: boolean;
    totalScore: number | null;
    grade: string | null;
}
export declare class ProjectsWithCountDto {
    totalCount: number;
    items: AssignedProjectWithWbsDto[];
}
export declare class EmployeeCompleteStatusResponseDto {
    evaluationPeriod: EvaluationPeriodInfoDto;
    employee: EmployeeInfoDto;
    isEvaluationTarget: boolean;
    exclusionInfo: ExclusionInfoDto;
    evaluationLine: EvaluationLineWithEvaluatorsDto;
    wbsCriteria: WbsCriteriaStatusDto;
    performance: PerformanceStatusDto;
    selfEvaluation: SelfEvaluationStatusDto;
    primaryDownwardEvaluation: DownwardEvaluationStatusDto;
    secondaryDownwardEvaluation: DownwardEvaluationStatusDto;
    peerEvaluation: PeerEvaluationInfoDto;
    finalEvaluation: FinalEvaluationInfoDto;
    projects: ProjectsWithCountDto;
}
