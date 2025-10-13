/**
 * 최종평가 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class FinalEvaluationDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'FinalEvaluationDomainException';
  }
}

// 최종평가 조회 실패 예외
export class FinalEvaluationNotFoundException extends FinalEvaluationDomainException {
  constructor(identifier: string) {
    super(
      `최종평가를 찾을 수 없습니다: ${identifier}`,
      'FINAL_EVALUATION_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'FinalEvaluationNotFoundException';
  }
}

// 중복 최종평가 예외
export class DuplicateFinalEvaluationException extends FinalEvaluationDomainException {
  constructor(employeeId: string, periodId: string) {
    super(
      `이미 최종평가가 존재합니다: 직원 ${employeeId}, 평가기간 ${periodId}`,
      'DUPLICATE_FINAL_EVALUATION',
      409,
      { employeeId, periodId },
    );
    this.name = 'DuplicateFinalEvaluationException';
  }
}

// 확정된 평가 수정 불가 예외
export class ConfirmedEvaluationModificationException extends FinalEvaluationDomainException {
  constructor(evaluationId: string) {
    super(
      `확정된 평가는 수정할 수 없습니다: ${evaluationId}`,
      'CONFIRMED_EVALUATION_MODIFICATION',
      422,
      { evaluationId },
    );
    this.name = 'ConfirmedEvaluationModificationException';
  }
}

// 확정되지 않은 평가 예외
export class NotConfirmedEvaluationException extends FinalEvaluationDomainException {
  constructor(evaluationId: string, action: string) {
    super(
      `확정되지 않은 평가입니다 (${action} 불가): ${evaluationId}`,
      'NOT_CONFIRMED_EVALUATION',
      422,
      { evaluationId, action },
    );
    this.name = 'NotConfirmedEvaluationException';
  }
}

// 이미 확정된 평가 예외
export class AlreadyConfirmedEvaluationException extends FinalEvaluationDomainException {
  constructor(evaluationId: string) {
    super(
      `이미 확정된 평가입니다: ${evaluationId}`,
      'ALREADY_CONFIRMED_EVALUATION',
      409,
      { evaluationId },
    );
    this.name = 'AlreadyConfirmedEvaluationException';
  }
}

// 유효하지 않은 평가등급 예외
export class InvalidEvaluationGradeException extends FinalEvaluationDomainException {
  constructor(grade: string, allowedGrades?: string[]) {
    const message = allowedGrades
      ? `유효하지 않은 평가등급입니다: ${grade} (허용 등급: ${allowedGrades.join(', ')})`
      : `유효하지 않은 평가등급입니다: ${grade}`;

    super(message, 'INVALID_EVALUATION_GRADE', 400, {
      grade,
      allowedGrades,
    });
    this.name = 'InvalidEvaluationGradeException';
  }
}

// 유효하지 않은 직무등급 예외
export class InvalidJobGradeException extends FinalEvaluationDomainException {
  constructor(grade: string, allowedGrades: string[]) {
    super(
      `유효하지 않은 직무등급입니다: ${grade} (허용 등급: ${allowedGrades.join(', ')})`,
      'INVALID_JOB_GRADE',
      400,
      { grade, allowedGrades },
    );
    this.name = 'InvalidJobGradeException';
  }
}

// 유효하지 않은 직무 상세등급 예외
export class InvalidJobDetailedGradeException extends FinalEvaluationDomainException {
  constructor(grade: string, allowedGrades: string[]) {
    super(
      `유효하지 않은 직무 상세등급입니다: ${grade} (허용 등급: ${allowedGrades.join(', ')})`,
      'INVALID_JOB_DETAILED_GRADE',
      400,
      { grade, allowedGrades },
    );
    this.name = 'InvalidJobDetailedGradeException';
  }
}

// 최종평가 비즈니스 규칙 위반 예외
export class FinalEvaluationBusinessRuleViolationException extends FinalEvaluationDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'FINAL_EVALUATION_BUSINESS_RULE_VIOLATION', 422, context);
    this.name = 'FinalEvaluationBusinessRuleViolationException';
  }
}

// 최종평가 필수 데이터 누락 예외
export class FinalEvaluationRequiredDataMissingException extends FinalEvaluationDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'FINAL_EVALUATION_REQUIRED_DATA_MISSING', 400, context);
    this.name = 'FinalEvaluationRequiredDataMissingException';
  }
}

// 최종평가 잘못된 데이터 형식 예외
export class InvalidFinalEvaluationDataFormatException extends FinalEvaluationDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INVALID_FINAL_EVALUATION_DATA_FORMAT', 400, context);
    this.name = 'InvalidFinalEvaluationDataFormatException';
  }
}
