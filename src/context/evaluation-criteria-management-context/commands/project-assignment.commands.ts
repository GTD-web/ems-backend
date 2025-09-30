import {
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
} from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 생성 커맨드
 */
export class CreateProjectAssignmentCommand {
  constructor(
    public readonly data: CreateEvaluationProjectAssignmentData,
    public readonly assignedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 수정 커맨드
 */
export class UpdateProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationProjectAssignmentData,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 프로젝트 할당 취소 커맨드
 */
export class CancelProjectAssignmentCommand {
  constructor(
    public readonly id: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 대량 프로젝트 할당 생성 커맨드
 */
export class BulkCreateProjectAssignmentCommand {
  constructor(
    public readonly assignments: CreateEvaluationProjectAssignmentData[],
    public readonly assignedBy: string,
  ) {}
}

/**
 * 평가기간별 프로젝트 할당 초기화 커맨드
 */
export class ResetPeriodProjectAssignmentsCommand {
  constructor(
    public readonly periodId: string,
    public readonly resetBy: string,
  ) {}
}
