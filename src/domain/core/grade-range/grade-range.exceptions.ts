/**
 * 등급 구간 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class GradeRangeDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'GradeRangeDomainException';
  }
}

// 등급 구간 겹침 예외
export class GradeRangeOverlapException extends GradeRangeDomainException {
  constructor(
    grade: string,
    minRange: number,
    maxRange: number,
    periodId?: string,
  ) {
    super(
      `등급 구간이 겹칩니다: ${grade} (${minRange}-${maxRange})`,
      'GRADE_RANGE_OVERLAP',
      409,
      { grade, minRange, maxRange, periodId },
    );
    this.name = 'GradeRangeOverlapException';
  }
}

// 잘못된 점수 범위 예외
export class InvalidScoreRangeException extends GradeRangeDomainException {
  constructor(minRange: number, maxRange: number, gradeId?: string) {
    super(
      `점수 범위가 올바르지 않습니다: ${minRange}-${maxRange} (최소값이 최대값보다 큽니다)`,
      'INVALID_SCORE_RANGE',
      400,
      { minRange, maxRange, gradeId },
    );
    this.name = 'InvalidScoreRangeException';
  }
}

// 등급 구간 조회 실패 예외
export class GradeRangeNotFoundException extends GradeRangeDomainException {
  constructor(identifier: string) {
    super(
      `등급 구간을 찾을 수 없습니다: ${identifier}`,
      'GRADE_RANGE_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'GradeRangeNotFoundException';
  }
}

// 중복 등급 예외
export class DuplicateGradeException extends GradeRangeDomainException {
  constructor(grade: string, periodId: string) {
    super(
      `이미 존재하는 등급입니다: ${grade} (평가기간: ${periodId})`,
      'DUPLICATE_GRADE',
      409,
      { grade, periodId },
    );
    this.name = 'DuplicateGradeException';
  }
}
