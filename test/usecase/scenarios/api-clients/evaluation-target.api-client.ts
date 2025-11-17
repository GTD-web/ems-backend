import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 평가대상 관리 API 클라이언트
 *
 * 평가대상 관리 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class EvaluationTargetApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // ==================== POST: 생성 ====================

  /**
   * 평가대상자 대량 등록 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeIds - 직원 ID 목록
   * @returns 등록된 평가대상자 맵핑 목록
   */
  async registerBulkEvaluationTargets(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
  }): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/bulk`,
      )
      .send({
        employeeIds: config.employeeIds,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 평가대상자 단일 등록 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 등록된 평가대상자 맵핑 정보
   */
  async registerEvaluationTarget(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}`,
      )
      .expect(201);

    return response.body;
  }

  /**
   * 평가대상자 단일 등록 API 호출 (409 에러 기대)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 409 에러 응답
   */
  async registerEvaluationTargetExpectConflict(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}`,
      )
      .expect(409);

    return response.body;
  }

  // ==================== PATCH: 수정 ====================

  /**
   * 평가대상 제외 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.excludeReason - 제외 사유
   * @returns 제외된 평가대상자 맵핑 정보
   */
  async excludeEvaluationTarget(config: {
    evaluationPeriodId: string;
    employeeId: string;
    excludeReason: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}/exclude`,
      )
      .send({
        excludeReason: config.excludeReason,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 평가대상 포함 API 호출 (제외 취소)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 포함된 평가대상자 맵핑 정보
   */
  async includeEvaluationTarget(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}/include`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== GET: 조회 ====================

  /**
   * 평가대상자 목록 조회 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.includeExcluded - 제외된 대상자 포함 여부 (기본값: false)
   * @returns 평가대상자 목록
   */
  async getEvaluationTargets(config: {
    evaluationPeriodId: string;
    includeExcluded?: boolean;
  }): Promise<any> {
    const { includeExcluded = false } = config;

    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${config.evaluationPeriodId}/targets`)
      .query({ includeExcluded: includeExcluded.toString() })
      .expect(200);

    return response.body;
  }

  /**
   * 제외된 평가대상자 목록 조회 API 호출
   *
   * @param evaluationPeriodId - 평가기간 ID
   * @returns 제외된 평가대상자 목록
   */
  async getExcludedEvaluationTargets(evaluationPeriodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets/excluded`)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 평가기간 맵핑 조회 API 호출
   *
   * @param employeeId - 직원 ID
   * @returns 직원이 등록된 평가기간 맵핑 목록
   */
  async getEmployeeEvaluationPeriods(employeeId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-periods/employees/${employeeId}/evaluation-periods`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 평가대상 여부 확인 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 평가대상 여부 및 관련 정보
   */
  async checkEvaluationTarget(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}/check`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 등록되지 않은 직원 목록 조회 API 호출
   *
   * @param evaluationPeriodId - 평가기간 ID
   * @returns 등록되지 않은 직원 목록
   */
  async getUnregisteredEmployees(evaluationPeriodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/unregistered-employees`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== DELETE: 삭제 ====================

  /**
   * 평가대상자 등록 해제 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 해제 결과
   */
  async unregisterEvaluationTarget(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 모든 평가대상자 등록 해제 API 호출
   *
   * @param evaluationPeriodId - 평가기간 ID
   * @returns 해제된 대상자 수
   */
  async unregisterAllEvaluationTargets(
    evaluationPeriodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
      .expect(200);

    return response.body;
  }

  // ==================== 에러 케이스 테스트용 ====================

  /**
   * 잘못된 평가기간 ID로 대량 등록 시도 (404 에러)
   *
   * @param config.invalidEvaluationPeriodId - 잘못된 평가기간 ID
   * @param config.employeeIds - 직원 ID 목록
   * @returns 404 에러 응답
   */
  async registerBulkEvaluationTargetsWithInvalidPeriod(config: {
    invalidEvaluationPeriodId: string;
    employeeIds: string[];
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${config.invalidEvaluationPeriodId}/targets/bulk`,
      )
      .send({
        employeeIds: config.employeeIds,
      })
      .expect(404);

    return response.body;
  }

  /**
   * 잘못된 직원 ID로 단일 등록 시도 (404 에러)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.invalidEmployeeId - 잘못된 직원 ID
   * @returns 404 에러 응답
   */
  async registerEvaluationTargetWithInvalidEmployee(config: {
    evaluationPeriodId: string;
    invalidEmployeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.invalidEmployeeId}`,
      )
      .expect(404);

    return response.body;
  }

  /**
   * 제외되지 않은 대상자를 포함 시도 (409 에러)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 409 에러 응답
   */
  async includeEvaluationTargetNotExcluded(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}/include`,
      )
      .expect(409);

    return response.body;
  }

  /**
   * 등록되지 않은 대상자를 제외 시도 (404 에러)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.excludeReason - 제외 사유
   * @returns 404 에러 응답
   */
  async excludeEvaluationTargetNotRegistered(config: {
    evaluationPeriodId: string;
    employeeId: string;
    excludeReason: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${config.evaluationPeriodId}/targets/${config.employeeId}/exclude`,
      )
      .send({
        excludeReason: config.excludeReason,
      })
      .expect(404);

    return response.body;
  }

  /**
   * 잘못된 UUID 형식으로 요청 (400 에러)
   *
   * @param config.invalidUuid - 잘못된 UUID 형식
   * @param config.employeeIds - 직원 ID 목록
   * @returns 400 에러 응답
   */
  async registerBulkEvaluationTargetsWithInvalidUuid(config: {
    invalidUuid: string;
    employeeIds: string[];
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${config.invalidUuid}/targets/bulk`)
      .send({
        employeeIds: config.employeeIds,
      })
      .expect(400);

    return response.body;
  }

  /**
   * 빈 배열로 대량 등록 시도 (400 에러)
   *
   * @param evaluationPeriodId - 평가기간 ID
   * @returns 400 에러 응답
   */
  async registerBulkEvaluationTargetsWithEmptyArray(
    evaluationPeriodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`)
      .send({
        employeeIds: [],
      })
      .expect(400);

    return response.body;
  }

  /**
   * 잘못된 includeExcluded 값으로 조회 (400 에러)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.invalidIncludeExcluded - 잘못된 includeExcluded 값
   * @returns 400 에러 응답
   */
  async getEvaluationTargetsWithInvalidIncludeExcluded(config: {
    evaluationPeriodId: string;
    invalidIncludeExcluded: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${config.evaluationPeriodId}/targets`)
      .query({ includeExcluded: config.invalidIncludeExcluded })
      .expect(400);

    return response.body;
  }
}
