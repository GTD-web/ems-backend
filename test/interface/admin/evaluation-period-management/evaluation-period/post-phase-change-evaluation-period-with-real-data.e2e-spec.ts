/**
 * 평가기간 단계 변경 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-periods/:id/phase-change - 실제 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  let evaluationPeriodId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 기존 데이터 정리
    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });

    // 테스트용 평가기간 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'with_period',
        clearExisting: false,
        evaluationConfig: {
          periodCount: 1,
        },
        stateDistribution: {
          evaluationPeriodStatus: {
            waiting: 0, // 대기 중인 평가기간 없음
            inProgress: 1.0, // 100%는 진행 중 (단계 변경 테스트용)
            completed: 0, // 완료된 평가기간 없음
          },
        },
      })
      .expect(201);

    // 생성된 평가기간 ID 조회
    const activePeriodsResponse = await testSuite
      .request()
      .get('/admin/evaluation-periods/active')
      .expect(200);

    evaluationPeriodId = activePeriodsResponse.body[0].id;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('정상적인 단계 변경', () => {
    it('evaluation-setup → performance 단계 변경', async () => {
      // Given: 기존 활성 평가기간 정리
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(
              `Failed to clear seed data: ${res.status} ${res.text}`,
            );
          }
        });

      // 새로운 평가기간 생성
      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send({
          name: '단계 변경 테스트용 평가기간',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-06-30',
        })
        .expect(201);

      const newPeriodId = createResponse.body.id;

      // 평가기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${newPeriodId}/start`)
        .expect(200);

      // evaluation-setup 단계 확인
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${newPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('evaluation-setup');

      // When: performance 단계로 변경
      const changeResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${newPeriodId}/phase-change`)
        .send({
          targetPhase: 'performance',
        })
        .expect(200);

      // Then: 단계가 성공적으로 변경됨
      expect(changeResponse.body.currentPhase).toBe('performance');
      expect(changeResponse.body.id).toBe(newPeriodId);

      // 변경 후 상태 확인
      const afterResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${newPeriodId}`)
        .expect(200);

      expect(afterResponse.body.currentPhase).toBe('performance');
    });

    it('performance → self-evaluation 단계 변경', async () => {
      // Given: performance 단계인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('performance');

      // When: self-evaluation 단계로 변경
      const changeResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'self-evaluation',
        })
        .expect(200);

      // Then: 단계가 성공적으로 변경됨
      expect(changeResponse.body.currentPhase).toBe('self-evaluation');
      expect(changeResponse.body.id).toBe(evaluationPeriodId);
    });

    it('self-evaluation → peer-evaluation 단계 변경', async () => {
      // Given: self-evaluation 단계인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('self-evaluation');

      // When: peer-evaluation 단계로 변경
      const changeResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'peer-evaluation',
        })
        .expect(200);

      // Then: 단계가 성공적으로 변경됨
      expect(changeResponse.body.currentPhase).toBe('peer-evaluation');
      expect(changeResponse.body.id).toBe(evaluationPeriodId);
    });

    it('peer-evaluation → closure 단계 변경', async () => {
      // Given: peer-evaluation 단계인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('peer-evaluation');

      // When: closure 단계로 변경
      const changeResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'closure',
        })
        .expect(200);

      // Then: 단계가 성공적으로 변경됨
      expect(changeResponse.body.currentPhase).toBe('closure');
      expect(changeResponse.body.id).toBe(evaluationPeriodId);
    });
  });

  describe('잘못된 단계 변경 요청', () => {
    it('존재하지 않는 평가기간 ID로 요청 시 404 에러', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${nonExistentId}/phase-change`)
        .send({
          targetPhase: 'performance',
        })
        .expect(404);
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러', async () => {
      await testSuite
        .request()
        .post('/admin/evaluation-periods/invalid-uuid/phase-change')
        .send({
          targetPhase: 'performance',
        })
        .expect(400);
    });

    it('지원하지 않는 단계로 변경 요청 시 422 에러', async () => {
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'invalid-phase',
        })
        .expect(422);
    });

    it('빈 targetPhase로 요청 시 400 에러', async () => {
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: '',
        })
        .expect(400);
    });

    it('targetPhase 없이 요청 시 400 에러', async () => {
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({})
        .expect(400);
    });
  });

  describe('비즈니스 규칙 위반', () => {
    beforeEach(async () => {
      // 테스트를 위해 새로운 평가기간 생성 (evaluation-setup 단계)
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(
              `Failed to clear seed data: ${res.status} ${res.text}`,
            );
          }
        });

      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_period',
          clearExisting: false,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            evaluationPeriodStatus: {
              waiting: 0,
              inProgress: 1.0,
              completed: 0,
            },
          },
        })
        .expect(201);

      const activePeriodsResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods/active')
        .expect(200);

      evaluationPeriodId = activePeriodsResponse.body[0].id;
    });

    it('건너뛰기 단계 변경 시 422 에러 (evaluation-setup → self-evaluation)', async () => {
      // Given: evaluation-setup 단계인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('evaluation-setup');

      // When: self-evaluation 단계로 건너뛰기 시도
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'self-evaluation',
        })
        .expect(422);
    });

    it('역방향 단계 변경 시 422 에러 (performance → evaluation-setup)', async () => {
      // Given: performance 단계로 먼저 변경
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'performance',
        })
        .expect(200);

      // When: evaluation-setup으로 역방향 변경 시도
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'evaluation-setup',
        })
        .expect(422);
    });

    it('동일한 단계로 변경 시도 시 422 에러', async () => {
      // Given: evaluation-setup 단계인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('evaluation-setup');

      // When: 동일한 단계로 변경 시도
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'evaluation-setup',
        })
        .expect(422);
    });
  });

  describe('대기 중인 평가기간 단계 변경', () => {
    beforeEach(async () => {
      // 대기 중인 평가기간 생성
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(
              `Failed to clear seed data: ${res.status} ${res.text}`,
            );
          }
        });

      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_period',
          clearExisting: false,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            evaluationPeriodStatus: {
              waiting: 1.0, // 100%는 대기 중
              inProgress: 0,
              completed: 0,
            },
          },
        })
        .expect(201);

      const allPeriodsResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .expect(200);

      evaluationPeriodId = allPeriodsResponse.body.items[0].id;
    });

    it('대기 중인 평가기간은 단계 변경 불가', async () => {
      // Given: 대기 중인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.status).toBe('waiting');

      // When: 단계 변경 시도
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'performance',
        })
        .expect(422);
    });
  });

  describe('완료된 평가기간 단계 변경', () => {
    beforeEach(async () => {
      // 완료된 평가기간 생성
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(
              `Failed to clear seed data: ${res.status} ${res.text}`,
            );
          }
        });

      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_period',
          clearExisting: false,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            evaluationPeriodStatus: {
              waiting: 0,
              inProgress: 0,
              completed: 1.0, // 100%는 완료
            },
          },
        })
        .expect(201);

      const allPeriodsResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .expect(200);

      evaluationPeriodId = allPeriodsResponse.body.items[0].id;
    });

    it('완료된 평가기간은 단계 변경 불가', async () => {
      // Given: 완료된 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.status).toBe('completed');

      // When: 단계 변경 시도
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'performance',
        })
        .expect(422);
    });
  });

  describe('대시보드 연동 확인', () => {
    beforeEach(async () => {
      // 진행 중인 평가기간 생성
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(
              `Failed to clear seed data: ${res.status} ${res.text}`,
            );
          }
        });

      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_period',
          clearExisting: false,
          evaluationConfig: {
            periodCount: 1,
          },
          stateDistribution: {
            evaluationPeriodStatus: {
              waiting: 0,
              inProgress: 1.0,
              completed: 0,
            },
          },
        })
        .expect(201);

      const activePeriodsResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods/active')
        .expect(200);

      evaluationPeriodId = activePeriodsResponse.body[0].id;
    });

    it('단계 변경 후 대시보드에서도 동일한 단계 확인', async () => {
      // Given: evaluation-setup 단계인 평가기간
      const beforeResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(beforeResponse.body.currentPhase).toBe('evaluation-setup');

      // When: performance 단계로 변경
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/phase-change`)
        .send({
          targetPhase: 'performance',
        })
        .expect(200);

      // Then: 대시보드에서도 동일한 단계 확인
      const dashboardResponse = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .expect(200);

      expect(dashboardResponse.body.length).toBeGreaterThan(0);
      expect(dashboardResponse.body[0].evaluationPeriod.currentPhase).toBe('performance');
    });
  });
});
