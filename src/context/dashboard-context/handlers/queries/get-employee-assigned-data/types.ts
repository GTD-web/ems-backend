/**
 * 산출물 정보
 */
export interface DeliverableInfo {
  id: string;
  name: string;
  description?: string;
  type: string;
  filePath?: string;
  employeeId?: string;
  mappedDate?: Date;
  mappedBy?: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * 할당된 프로젝트 정보 (WBS 목록 포함)
 */
export interface AssignedProjectWithWbs {
  projectId: string;
  projectName: string;
  projectCode: string;
  assignedAt: Date;
  projectManager?: {
    id: string;
    name: string;
  } | null;
  wbsList: AssignedWbsInfo[];
}

/**
 * WBS 평가기준 정보
 */
export interface WbsEvaluationCriterion {
  criterionId: string;
  criteria: string;
  importance: number;
  createdAt: Date;
}

/**
 * WBS 성과 정보
 */
export interface WbsPerformance {
  performanceResult?: string;
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * WBS 자기평가 정보
 */
export interface WbsSelfEvaluationInfo {
  selfEvaluationId?: string;
  evaluationContent?: string;
  score?: number;
  isCompleted: boolean;
  isEditable: boolean;
  submittedAt?: Date;
}

/**
 * WBS 하향평가 정보
 */
export interface WbsDownwardEvaluationInfo {
  downwardEvaluationId?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  evaluationContent?: string;
  score?: number;
  isCompleted: boolean;
  isEditable: boolean;
  submittedAt?: Date;
}

/**
 * 할당된 WBS 정보 (평가기준, 성과, 자기평가, 산출물 포함)
 */
export interface AssignedWbsInfo {
  wbsId: string;
  wbsName: string;
  wbsCode: string;
  weight: number;
  assignedAt: Date;
  criteria: WbsEvaluationCriterion[];
  performance?: WbsPerformance | null;
  selfEvaluation?: WbsSelfEvaluationInfo | null;
  primaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
  secondaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
  deliverables: DeliverableInfo[];
}

/**
 * 평가기간 정보
 */
export interface EvaluationPeriodInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  description?: string;
  criteriaSettingEnabled: boolean;
  selfEvaluationSettingEnabled: boolean;
  finalEvaluationSettingEnabled: boolean;
  maxSelfEvaluationRate: number;
}

/**
 * 직원 정보
 */
export interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  departmentId: string;
  departmentName?: string;
  status: string;
}

/**
 * 수정가능 상태 정보
 */
export interface EditableStatus {
  isSelfEvaluationEditable: boolean;
  isPrimaryEvaluationEditable: boolean;
  isSecondaryEvaluationEditable: boolean;
}

/**
 * 사용자 할당 정보 조회 결과
 */
export interface EmployeeAssignedDataResult {
  evaluationPeriod: EvaluationPeriodInfo;
  employee: EmployeeInfo;
  editableStatus: EditableStatus;
  projects: AssignedProjectWithWbs[];
  summary: {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
    selfEvaluation: {
      totalScore: number | null;
      grade: string | null;
    };
    primaryDownwardEvaluation: {
      totalScore: number | null;
      grade: string | null;
    };
    secondaryDownwardEvaluation: {
      totalScore: number | null;
      grade: string | null;
    };
  };
}
