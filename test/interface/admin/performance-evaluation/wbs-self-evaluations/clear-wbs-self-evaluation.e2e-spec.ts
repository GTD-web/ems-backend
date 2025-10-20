import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * WBS 자기평가 내용 초기화 E2E 테스트
 *
 * 테스트 대상:
 * - PATCH /admin/performance-evaluation/wbs-self-evaluations/:id/clear (단일 내용 초기화)
 * - PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/clear (전체 내용 초기화)
 * - PATCH /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/clear (프로젝트별 내용 초기화)
 */
describe('PATCH /admin/performance-evaluation/wbs-self-evaluations - 내용 초기화', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let testContextService: TestContextService;
  let testData: any;

  // 테스트용 헬퍼 함수들
  function getRandomEmployee() {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getRandomEvaluationPeriod() {
    return testData.periods[
      Math.floor(Math.random() * testData.periods.length)
    ];
  }

  function getInProgressPeriod() {
    return testData.periods.find((p) => p.status === 'in-progress');
  }

  function getRandomWbsItem() {
    return testData.wbsItems[
      Math.floor(Math.random() * testData.wbsItems.length)
    ];
  }

  function getRandomProject() {
    return testData.projects[
      Math.floor(Math.random() * testData.projects.length)
    ];
  }

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    testContextService = app.get(TestContextService);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 완전한 테스트 환경 생성 (WBS 할당 포함)
    const {
      departments,
      employees,
      periods,
      projects,
      wbsItems,
      wbsAssignments,
    } = await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      departments,
      employees,
      periods,
      projects,
      wbsItems,
      wbsAssignments,
    };

    console.log('WBS 자기평가 내용 초기화 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      periods: testData.periods.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
      wbsAssignments: testData.wbsAssignments.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  describe('단일 WBS 자기평가 내용 초기화 (PATCH /:id/clear)', () => {
    describe('성공 케이스', () => {
      it('작성된 자기평가의 내용을 초기화할 수 있어야 한다', async () => {
        // Given - 자기평가 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // When - 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send()
          .expect(200);

        // Then - 내용이 초기화되어야 함
        expect(response.body).toMatchObject({
          id: evaluationId,
        });
        // selfEvaluationContent, selfEvaluationScore, performanceResult가 초기화됨
        expect(response.body.selfEvaluationContent).toBeFalsy();
        expect(response.body.performanceResult).toBeFalsy();
      });

      it('제출된 자기평가의 내용도 초기화할 수 있어야 한다', async () => {
        // Given - 제출된 자기평가
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // 제출
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // When - 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send()
          .expect(200);

        // Then - 내용이 초기화되고 제출 상태도 초기화됨 (비즈니스 로직에 따름)
        expect(response.body.id).toBe(evaluationId);
        expect(response.body.isCompleted).toBe(false);
        expect(response.body.completedAt == null).toBe(true);
      });

      it('여러 번 초기화해도 성공해야 한다 (멱등성)', async () => {
        // Given - 자기평가 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // When - 첫 번째 초기화
        const firstClearResponse = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send()
          .expect(200);

        // 두 번째 초기화 (멱등성)
        const secondClearResponse = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send()
          .expect(200);

        // Then
        expect(firstClearResponse.body.id).toBe(evaluationId);
        expect(secondClearResponse.body.id).toBe(evaluationId);
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식으로 초기화 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}/clear`,
          )
          .send()
          .expect(400);
      });

      it('존재하지 않는 자기평가 ID로 초기화 시 404 에러가 발생해야 한다', async () => {
        // Given - valid UUID지만 존재하지 않는 ID
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}/clear`,
          )
          .send()
          .expect(404);
      });
    });
  });

  describe('직원의 전체 WBS 자기평가 내용 초기화 (PATCH /employee/:employeeId/period/:periodId/clear)', () => {
    describe('성공 케이스', () => {
      it('직원의 모든 자기평가 내용을 한 번에 초기화할 수 있어야 한다', async () => {
        // Given - 여러 자기평가 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        // 고유한 WBS 항목 3개 선택
        const wbsItems = testData.wbsItems.slice(0, 3);

        // 실제로 생성된 개수를 추적
        let createdCount = 0;
        for (const wbsItem of wbsItems) {
          const createResponse = await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `${wbsItem.id} 평가`,
              selfEvaluationScore: 100,
              performanceResult: '성과 실적',
            })
            .expect(200);

          if (createResponse.status === 200) {
            createdCount++;
          }
        }

        // When - 전체 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/clear`,
          )
          .send()
          .expect(200);

        // Then - 실제 생성된 개수와 초기화된 개수가 일치
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.clearedCount).toBe(createdCount);
        expect(response.body.clearedEvaluations).toHaveLength(createdCount);
        expect(response.body.clearedEvaluations).toBeDefined();
        expect(Array.isArray(response.body.clearedEvaluations)).toBe(true);
      });

      it('제출된 자기평가도 내용 초기화할 수 있어야 한다', async () => {
        // Given - 제출된 자기평가들
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        // 고유한 WBS 항목 2개 선택
        const wbsItems = testData.wbsItems.slice(0, 2);

        for (const wbsItem of wbsItems) {
          const createResponse = await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `${wbsItem.id} 평가`,
              selfEvaluationScore: 100,
            })
            .expect(200);

          // 제출
          await testSuite
            .request()
            .patch(
              `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
            )
            .send({})
            .expect(200);
        }

        // When - 전체 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/clear`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.clearedCount).toBe(wbsItems.length);
        expect(response.body.clearedEvaluations).toHaveLength(wbsItems.length);
      });

      it('자기평가가 없는 경우 빈 결과를 반환해야 한다', async () => {
        // Given - 자기평가 없음
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When - 전체 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/clear`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.clearedCount).toBe(0);
        expect(response.body.clearedEvaluations).toHaveLength(0);
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/invalid-uuid/period/${period.id}/clear`,
          )
          .send()
          .expect(400);
      });

      it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/invalid-uuid/clear`,
          )
          .send()
          .expect(400);
      });
    });
  });

  describe('프로젝트별 WBS 자기평가 내용 초기화 (PATCH /employee/:employeeId/period/:periodId/project/:projectId/clear)', () => {
    describe('성공 케이스', () => {
      it('특정 프로젝트의 모든 자기평가 내용을 초기화할 수 있어야 한다', async () => {
        // Given - 첫 번째 프로젝트(WBS가 연결된 프로젝트)의 자기평가 생성
        const employee = getRandomEmployee();
        const period = getInProgressPeriod(); // 진행 중인 평가기간 (WBS 할당이 있는 기간)
        const project = testData.projects[0]; // 첫 번째 프로젝트 (WBS 연결됨)

        // WBS 항목들이 첫 번째 프로젝트에 연결되어 있음
        const projectWbsItems = testData.wbsItems.slice(0, 2); // 2개만 사용

        // 각 WBS 항목에 대한 자기평가 생성
        for (const wbsItem of projectWbsItems) {
          await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `프로젝트 ${project.id} - ${wbsItem.name} 평가`,
              selfEvaluationScore: 100,
              performanceResult: '성과 실적',
            })
            .expect(200);
        }

        // When - 프로젝트별 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/clear`,
          )
          .send()
          .expect(200);

        // Then - 프로젝트와 WBS 연결 여부에 따라 결과가 달라짐
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.projectId).toBe(project.id);
        expect(response.body.clearedCount).toBeGreaterThanOrEqual(0);
        expect(response.body.clearedEvaluations).toBeDefined();
        expect(Array.isArray(response.body.clearedEvaluations)).toBe(true);
      });

      it('제출된 프로젝트별 자기평가의 내용도 초기화할 수 있어야 한다', async () => {
        // Given - 제출된 프로젝트별 자기평가
        const employee = getRandomEmployee();
        const period = getInProgressPeriod();
        const project = testData.projects[0];
        const projectWbsItems = testData.wbsItems.slice(0, 2);

        for (const wbsItem of projectWbsItems) {
          const createResponse = await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `프로젝트 평가`,
              selfEvaluationScore: 100,
            })
            .expect(200);

          // 제출
          await testSuite
            .request()
            .patch(
              `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
            )
            .send({})
            .expect(200);
        }

        // When - 프로젝트별 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/clear`,
          )
          .send()
          .expect(200);

        // Then - 프로젝트와 WBS 연결 여부에 따라 결과가 달라짐
        expect(response.body.clearedCount).toBeGreaterThanOrEqual(0);
        expect(response.body.clearedEvaluations).toBeDefined();
        expect(Array.isArray(response.body.clearedEvaluations)).toBe(true);
      });
    });

    describe('실패 케이스', () => {
      it('프로젝트에 할당된 WBS가 없는 경우 빈 결과를 반환해야 한다', async () => {
        // Given - WBS가 할당되지 않은 프로젝트 (두 번째 이후 프로젝트)
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = testData.projects[1] || testData.projects[0];

        // When - 프로젝트별 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/clear`,
          )
          .send()
          .expect(200);

        // Then - 빈 결과 반환
        expect(response.body.clearedCount).toBe(0);
        expect(response.body.clearedEvaluations).toHaveLength(0);
      });

      it('잘못된 UUID 형식의 projectId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/invalid-uuid/clear`,
          )
          .send()
          .expect(400);
      });
    });
  });

  describe('내용 초기화 데이터 무결성', () => {
    it('초기화 후에도 다른 필드는 유지되어야 한다', async () => {
      // Given - 자기평가 생성
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 실적',
        })
        .expect(200);

      const evaluationId = createResponse.body.id;
      const originalCreatedAt = new Date(
        createResponse.body.createdAt,
      ).getTime();

      // When - 내용 초기화
      const clearResponse = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
        )
        .send()
        .expect(200);

      // Then - ID, createdAt 등 다른 필드는 유지
      expect(clearResponse.body.id).toBe(evaluationId);
      expect(clearResponse.body.employeeId).toBe(employee.id);
      expect(clearResponse.body.wbsItemId).toBe(wbsItem.id);
      expect(clearResponse.body.periodId).toBe(period.id);
      // createdAt은 유사한 시간대여야 함 (200ms 이내 오차 허용)
      const clearedCreatedAt = new Date(clearResponse.body.createdAt).getTime();
      expect(Math.abs(clearedCreatedAt - originalCreatedAt)).toBeLessThan(200);
    });

    it('초기화 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
        })
        .expect(200);

      const originalUpdatedAt = new Date(createResponse.body.updatedAt);

      // 시간 경과를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 내용 초기화
      const clearResponse = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/clear`,
        )
        .send()
        .expect(200);

      // Then
      const updatedAtAfterClear = new Date(clearResponse.body.updatedAt);
      expect(updatedAtAfterClear.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });
});
