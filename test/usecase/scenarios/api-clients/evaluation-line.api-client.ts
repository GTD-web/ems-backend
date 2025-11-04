import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 평가라인 API 클라이언트
 *
 * 평가라인 관련 HTTP 요청을 캡슐화합니다.
 * - 평가자별 피평가자 조회
 * - 직원 평가설정 통합 조회
 * - 1차/2차 평가자 구성
 * - 평가기간별 평가자 목록 조회
 */
export class EvaluationLineApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 평가자별 피평가자 조회
   */
  async getEvaluatorEmployees(config: {
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/periods/${config.periodId}/evaluators/${config.evaluatorId}/employees`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 직원 평가설정 통합 조회
   */
  async getEmployeeEvaluationSettings(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/period/${config.periodId}/settings`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 1차 평가자 구성 (직원별 고정 담당자)
   */
  async configurePrimaryEvaluator(config: {
    employeeId: string;
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/period/${config.periodId}/primary-evaluator`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 2차 평가자 구성 (WBS별 평가자)
   */
  async configureSecondaryEvaluator(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/wbs/${config.wbsItemId}/period/${config.periodId}/secondary-evaluator`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 평가기간별 평가자 목록 조회
   */
  async getEvaluatorsByPeriod(config: {
    periodId: string;
    type?: 'primary' | 'secondary' | 'all';
  }): Promise<any> {
    const queryParams: any = {};

    if (config.type) {
      queryParams.type = config.type;
    }

    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/period/${config.periodId}/evaluators`,
      )
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 평가자별 피평가자 조회 (에러 예상)
   */
  async getEvaluatorEmployeesExpectError(
    config: {
      periodId: string;
      evaluatorId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/periods/${config.periodId}/evaluators/${config.evaluatorId}/employees`,
      )
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 직원 평가설정 통합 조회 (에러 예상)
   */
  async getEmployeeEvaluationSettingsExpectError(
    config: {
      employeeId: string;
      periodId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/period/${config.periodId}/settings`,
      )
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 1차 평가자 구성 (에러 예상)
   */
  async configurePrimaryEvaluatorExpectError(
    config: {
      employeeId: string;
      periodId: string;
      evaluatorId?: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};
    if (config.evaluatorId !== undefined) {
      requestBody.evaluatorId = config.evaluatorId;
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/period/${config.periodId}/primary-evaluator`,
      )
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 2차 평가자 구성 (에러 예상)
   */
  async configureSecondaryEvaluatorExpectError(
    config: {
      employeeId: string;
      wbsItemId: string;
      periodId: string;
      evaluatorId?: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};
    if (config.evaluatorId !== undefined) {
      requestBody.evaluatorId = config.evaluatorId;
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/wbs/${config.wbsItemId}/period/${config.periodId}/secondary-evaluator`,
      )
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 평가기간별 평가자 목록 조회 (에러 예상)
   */
  async getEvaluatorsByPeriodExpectError(
    config: {
      periodId: string;
      type?: 'primary' | 'secondary' | 'all' | string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const queryParams: any = {};

    if (config.type) {
      queryParams.type = config.type;
    }

    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/period/${config.periodId}/evaluators`,
      )
      .query(queryParams)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 여러 피평가자의 1차 평가자 일괄 구성
   */
  async batchConfigurePrimaryEvaluator(config: {
    periodId: string;
    assignments: Array<{
      employeeId: string;
      evaluatorId: string;
    }>;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/period/${config.periodId}/batch-primary-evaluator`,
      )
      .send({
        assignments: config.assignments,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 여러 피평가자의 2차 평가자 일괄 구성
   */
  async batchConfigureSecondaryEvaluator(config: {
    periodId: string;
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      evaluatorId: string;
    }>;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/period/${config.periodId}/batch-secondary-evaluator`,
      )
      .send({
        assignments: config.assignments,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 여러 피평가자의 1차 평가자 일괄 구성 (에러 예상)
   */
  async batchConfigurePrimaryEvaluatorExpectError(
    config: {
      periodId: string;
      assignments?: Array<{
        employeeId?: string;
        evaluatorId?: string;
      }>;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};
    if (config.assignments !== undefined) {
      requestBody.assignments = config.assignments;
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/period/${config.periodId}/batch-primary-evaluator`,
      )
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 여러 피평가자의 2차 평가자 일괄 구성 (에러 예상)
   */
  async batchConfigureSecondaryEvaluatorExpectError(
    config: {
      periodId: string;
      assignments?: Array<{
        employeeId?: string;
        wbsItemId?: string;
        evaluatorId?: string;
      }>;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};
    if (config.assignments !== undefined) {
      requestBody.assignments = config.assignments;
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/period/${config.periodId}/batch-secondary-evaluator`,
      )
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }
}
