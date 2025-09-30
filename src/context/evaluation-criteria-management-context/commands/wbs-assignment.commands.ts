import type {
  CreateEvaluationWbsAssignmentData,
  UpdateEvaluationWbsAssignmentData,
} from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 생성 커맨드
 */
export class CreateWbsAssignmentCommand {
  constructor(
    public readonly data: CreateEvaluationWbsAssignmentData,
    public readonly assignedBy: string,
  ) {}
}

/**
 * WBS 할당 수정 커맨드
 */
export class UpdateWbsAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationWbsAssignmentData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * WBS 할당 취소 커맨드
 */
export class CancelWbsAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * WBS 할당 대량 생성 커맨드
 */
export class BulkCreateWbsAssignmentCommand {
  constructor(
    public readonly assignments: CreateEvaluationWbsAssignmentData[],
    public readonly assignedBy: string,
  ) {}
}

/**
 * 평가기간의 WBS 할당 초기화 커맨드
 */
export class ResetPeriodWbsAssignmentsCommand {
  constructor(
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
}

/**
 * 프로젝트의 WBS 할당 초기화 커맨드
 */
export class ResetProjectWbsAssignmentsCommand {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
}

/**
 * 직원의 WBS 할당 초기화 커맨드
 */
export class ResetEmployeeWbsAssignmentsCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
}
