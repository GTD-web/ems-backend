/**
 * 평가 라인 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EvaluationLineDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationLineDomainException';
  }
}

// 중복 평가자 지정 예외
export class DuplicateEvaluatorAssignmentException extends EvaluationLineDomainException {
  constructor(employeeId: string, evaluatorId: string, evaluatorType: string) {
    super(
      `이미 지정된 평가자입니다: 직원 ${employeeId}, 평가자 ${evaluatorId} (유형: ${evaluatorType})`,
      'DUPLICATE_EVALUATOR_ASSIGNMENT',
      409,
      { employeeId, evaluatorId, evaluatorType },
    );
    this.name = 'DuplicateEvaluatorAssignmentException';
  }
}

// 자기 자신을 평가자로 지정 예외
export class SelfEvaluatorAssignmentException extends EvaluationLineDomainException {
  constructor(employeeId: string) {
    super(
      `자기 자신을 평가자로 지정할 수 없습니다: ${employeeId}`,
      'SELF_EVALUATOR_ASSIGNMENT',
      400,
      { employeeId },
    );
    this.name = 'SelfEvaluatorAssignmentException';
  }
}

// 필수 평가자 누락 예외
export class RequiredEvaluatorMissingException extends EvaluationLineDomainException {
  constructor(employeeId: string, missingEvaluatorTypes: string[]) {
    super(
      `필수 평가자가 누락되었습니다: 직원 ${employeeId} (누락 유형: ${missingEvaluatorTypes.join(', ')})`,
      'REQUIRED_EVALUATOR_MISSING',
      422,
      { employeeId, missingEvaluatorTypes },
    );
    this.name = 'RequiredEvaluatorMissingException';
  }
}

// 평가 라인 조회 실패 예외
export class EvaluationLineNotFoundException extends EvaluationLineDomainException {
  constructor(identifier: string) {
    super(
      `평가 라인을 찾을 수 없습니다: ${identifier}`,
      'EVALUATION_LINE_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EvaluationLineNotFoundException';
  }
}

// 잘못된 평가자 유형 예외
export class InvalidEvaluatorTypeException extends EvaluationLineDomainException {
  constructor(evaluatorType: string, allowedTypes: string[]) {
    super(
      `잘못된 평가자 유형입니다: ${evaluatorType} (허용 유형: ${allowedTypes.join(', ')})`,
      'INVALID_EVALUATOR_TYPE',
      400,
      { evaluatorType, allowedTypes },
    );
    this.name = 'InvalidEvaluatorTypeException';
  }
}

// 평가 라인 수정 불가 예외
export class EvaluationLineModificationNotAllowedException extends EvaluationLineDomainException {
  constructor(lineId: string, reason: string) {
    super(
      `평가 라인을 수정할 수 없습니다: ${reason}`,
      'EVALUATION_LINE_MODIFICATION_NOT_ALLOWED',
      422,
      { lineId, reason },
    );
    this.name = 'EvaluationLineModificationNotAllowedException';
  }
}
