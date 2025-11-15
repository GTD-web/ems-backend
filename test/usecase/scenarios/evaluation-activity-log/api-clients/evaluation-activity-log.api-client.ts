import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 평가 활동 내역 API 클라이언트
 *
 * 평가 활동 내역 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class EvaluationActivityLogApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 평가기간 피평가자 기준 활동 내역 조회 API 호출
   *
   * @param config.periodId - 평가기간 ID
   * @param config.employeeId - 피평가자 ID
   * @param config.activityType - 활동 유형 (선택)
   * @param config.startDate - 활동 시작일 (선택)
   * @param config.endDate - 활동 종료일 (선택)
   * @param config.page - 페이지 번호 (선택, 기본값: 1)
   * @param config.limit - 페이지 크기 (선택, 기본값: 20)
   * @returns 활동 내역 목록
   */
  async getActivityLogs(config: {
    periodId: string;
    employeeId: string;
    activityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams: any = {};
    if (config.activityType) queryParams.activityType = config.activityType;
    if (config.startDate) queryParams.startDate = config.startDate;
    if (config.endDate) queryParams.endDate = config.endDate;
    if (config.page) queryParams.page = config.page;
    if (config.limit) queryParams.limit = config.limit;

    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-activity-logs/periods/${config.periodId}/employees/${config.employeeId}`,
      )
      .query(queryParams)
      .expect(200);

    return response.body;
  }
}

