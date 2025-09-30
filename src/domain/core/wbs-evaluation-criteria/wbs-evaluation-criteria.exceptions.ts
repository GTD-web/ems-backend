/**
 * WBS 평가 기준 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class WbsEvaluationCriteriaDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'WbsEvaluationCriteriaDomainException';
  }
}

// WBS 평가 기준 조회 실패 예외
export class WbsEvaluationCriteriaNotFoundException extends WbsEvaluationCriteriaDomainException {
  constructor(identifier: string) {
    super(
      `WBS 평가 기준을 찾을 수 없습니다: ${identifier}`,
      'WBS_EVALUATION_CRITERIA_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'WbsEvaluationCriteriaNotFoundException';
  }
}

// 중복 WBS 평가 기준 예외
export class WbsEvaluationCriteriaDuplicateException extends WbsEvaluationCriteriaDomainException {
  constructor(wbsItemId: string, criteria: string) {
    super(
      `이미 존재하는 WBS 평가 기준입니다: WBS ${wbsItemId}, 기준 "${criteria}"`,
      'DUPLICATE_WBS_EVALUATION_CRITERIA',
      409,
      { wbsItemId, criteria },
    );
    this.name = 'WbsEvaluationCriteriaDuplicateException';
  }
}

// 필수 데이터 누락 예외
export class WbsEvaluationCriteriaRequiredDataMissingException extends WbsEvaluationCriteriaDomainException {
  constructor(message: string) {
    super(message, 'WBS_EVALUATION_CRITERIA_REQUIRED_DATA_MISSING', 400);
    this.name = 'WbsEvaluationCriteriaRequiredDataMissingException';
  }
}

// 잘못된 데이터 형식 예외
export class InvalidWbsEvaluationCriteriaDataFormatException extends WbsEvaluationCriteriaDomainException {
  constructor(message: string) {
    super(message, 'INVALID_WBS_EVALUATION_CRITERIA_DATA_FORMAT', 400);
    this.name = 'InvalidWbsEvaluationCriteriaDataFormatException';
  }
}

// 비즈니스 규칙 위반 예외
export class WbsEvaluationCriteriaBusinessRuleViolationException extends WbsEvaluationCriteriaDomainException {
  constructor(message: string) {
    super(message, 'WBS_EVALUATION_CRITERIA_BUSINESS_RULE_VIOLATION', 400);
    this.name = 'WbsEvaluationCriteriaBusinessRuleViolationException';
  }
}

// WBS 항목 참조 오류 예외
export class InvalidWbsItemReferenceException extends WbsEvaluationCriteriaDomainException {
  constructor(wbsItemId: string) {
    super(
      `유효하지 않은 WBS 항목 참조입니다: ${wbsItemId}`,
      'INVALID_WBS_ITEM_REFERENCE',
      400,
      { wbsItemId },
    );
    this.name = 'InvalidWbsItemReferenceException';
  }
}
