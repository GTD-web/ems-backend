import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 평가기간 자동 단계 전이 시나리오 클래스
 * 
 * README.md의 자동 단계 전이 시나리오를 구현합니다.
 */
export class EvaluationPeriodAutoPhaseTransitionScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 평가기간을 생성하고 시작한다
   */
  async 평가기간을_생성하고_시작한다(config: {
    name: string;
    startDate: string;
    peerEvaluationDeadline: string;
  }): Promise<{ periodId: string }> {
    // 1. 기존 데이터 정리
    await this.testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });

    // 2. 평가기간 생성
    const createResponse = await this.testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(config)
      .expect(201);

    const periodId = createResponse.body.id;

    // 3. 평가기간 시작
    await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/start`)
      .expect(200);

    return { periodId };
  }

  /**
   * 단계별 마감일을 설정한다
   */
  async 단계별_마감일을_설정한다(config: {
    periodId: string;
    evaluationSetupDeadline?: string;
    performanceDeadline?: string;
    selfEvaluationDeadline?: string;
    peerEvaluationDeadline?: string;
  }): Promise<void> {
    const { periodId, ...deadlines } = config;

    if (deadlines.evaluationSetupDeadline) {
      await this.testSuite
        .request()
        .patch(`/admin/evaluation-periods/${periodId}/evaluation-setup-deadline`)
        .send({ evaluationSetupDeadline: deadlines.evaluationSetupDeadline })
        .expect(200);
    }

    if (deadlines.performanceDeadline) {
      await this.testSuite
        .request()
        .patch(`/admin/evaluation-periods/${periodId}/performance-deadline`)
        .send({ performanceDeadline: deadlines.performanceDeadline })
        .expect(200);
    }

    if (deadlines.selfEvaluationDeadline) {
      await this.testSuite
        .request()
        .patch(`/admin/evaluation-periods/${periodId}/self-evaluation-deadline`)
        .send({ selfEvaluationDeadline: deadlines.selfEvaluationDeadline })
        .expect(200);
    }

    if (deadlines.peerEvaluationDeadline) {
      await this.testSuite
        .request()
        .patch(`/admin/evaluation-periods/${periodId}/peer-evaluation-deadline`)
        .send({ peerEvaluationDeadline: deadlines.peerEvaluationDeadline })
        .expect(200);
    }
  }

  /**
   * 평가기간의 현재 단계를 조회한다
   */
  async 현재_단계를_조회한다(periodId: string): Promise<{
    currentPhase: string;
    status: string;
  }> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${periodId}`)
      .expect(200);

    return {
      currentPhase: response.body.currentPhase,
      status: response.body.status,
    };
  }

  /**
   * 대시보드에서 평가기간 상태를 조회한다
   */
  async 대시보드_상태를_조회한다(periodId: string): Promise<{
    evaluationPeriod: {
      status: string;
      currentPhase: string;
    };
  }> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/employees/status`)
      .expect(200);

    if (response.body.length === 0) {
      throw new Error('대시보드에 직원 데이터가 없습니다.');
    }

    return {
      evaluationPeriod: response.body[0].evaluationPeriod,
    };
  }

  /**
   * 수동으로 단계를 변경한다
   */
  async 수동으로_단계를_변경한다(periodId: string, targetPhase: string): Promise<void> {
    await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/phase-change`)
      .send({ targetPhase })
      .expect(200);
  }

  /**
   * 자동 단계 전이를 실행한다 (수동 트리거)
   */
  async 자동_단계_전이를_실행한다(): Promise<number> {
    // 자동 단계 전이 서비스를 직접 호출
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-periods/auto-phase-transition')
      .expect(200);

    return response.body.transitionedCount || 0;
  }

  /**
   * 시간을 조작한다 (테스트용)
   */
  async 시간을_조작한다(milliseconds: number): Promise<void> {
    // Jest의 시간 조작을 사용
    if (typeof jest !== 'undefined' && jest.advanceTimersByTime) {
      jest.advanceTimersByTime(milliseconds);
    } else {
      // 실제 환경에서는 대기
      await new Promise(resolve => setTimeout(resolve, Math.min(milliseconds, 1000)));
    }
  }

  /**
   * 현재 시간을 가져온다
   */
  getCurrentTime(): Date {
    return new Date();
  }

  /**
   * 미래 시간을 계산한다
   */
  getFutureTime(minutesFromNow: number): string {
    const now = this.getCurrentTime();
    const future = new Date(now.getTime() + minutesFromNow * 60 * 1000);
    return future.toISOString();
  }
}
