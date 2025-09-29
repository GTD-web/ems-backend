// ==================== 평가 기간 조회 쿼리 ====================

/**
 * 활성 평가 기간 조회 쿼리
 */
export class GetActiveEvaluationPeriodsQuery {
  constructor() {}
}

/**
 * 평가 기간 상세 정보 조회 쿼리
 */
export class GetEvaluationPeriodDetailQuery {
  constructor(public readonly periodId: string) {}
}

/**
 * 평가 기간 목록 조회 쿼리
 */
export class GetEvaluationPeriodListQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

/**
 * 평가 기간 목록 조회 결과 DTO
 */
export interface EvaluationPeriodListResult {
  items: any[]; // EvaluationPeriodDto[]로 변경 예정
  total: number;
  page: number;
  limit: number;
}
