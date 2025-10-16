import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * WBS 자기평가 제출 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/wbs-self-evaluations/:id/submit (단일 제출)
 * - PUT /admin/performance-evaluation/wbs-self-evaluations/:id/reset (단일 미제출)
 * - POST /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/submit-all (전체 제출)
 * - PUT /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/reset-all (전체 미제출)
 * - POST /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/submit (프로젝트별 제출)
 * - PUT /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/period/:periodId/project/:projectId/reset (프로젝트별 미제출)
 */
describe('POST /admin/performance-evaluation/wbs-self-evaluations - 제출/미제출', () => {
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

    console.log('WBS 자기평가 제출 테스트 데이터 생성 완료:', {
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

  describe('단일 WBS 자기평가 제출 (PATCH /:id/submit)', () => {
    describe('성공 케이스', () => {
      it('작성된 자기평가를 제출할 수 있어야 한다', async () => {
        // Given - 자기평가 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // When - 제출
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // Then
        expect(response.body).toMatchObject({
          id: evaluationId,
          isCompleted: true,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
        });
        expect(response.body.completedAt).toBeTruthy();
      });

      it('이미 제출된 자기평가를 다시 제출해도 성공해야 한다 (멱등성)', async () => {
        // Given - 제출된 자기평가
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // 첫 번째 제출
        const firstSubmitResponse = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        const firstCompletedAt = firstSubmitResponse.body.completedAt;

        // When - 다시 제출 (멱등성 테스트)
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // Then - 제출 상태 유지 및 completedAt은 동일하거나 업데이트됨
        expect(response.body.isCompleted).toBe(true);
        expect(response.body.completedAt).toBeTruthy();
        // completedAt이 유지되는지 또는 업데이트되는지는 비즈니스 로직에 따라 결정
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식으로 제출 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}/submit`,
          )
          .send({})
          .expect(400);
      });

      it('존재하지 않는 자기평가 ID로 제출 시 400 에러가 발생해야 한다', async () => {
        // Given - valid UUID지만 존재하지 않는 ID
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}/submit`,
          )
          .send({})
          .expect(400);
      });
    });
  });

  describe('단일 WBS 자기평가 미제출 (PATCH /:id/reset)', () => {
    describe('성공 케이스', () => {
      it('제출된 자기평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
        // Given - 제출된 자기평가
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // When - 미제출로 변경
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/reset`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body).toMatchObject({
          id: evaluationId,
          isCompleted: false,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
        });
        expect(response.body.completedAt == null).toBe(true);
      });

      it('미제출 상태의 자기평가를 미제출로 변경 시도 시 400 에러가 발생해야 한다', async () => {
        // Given - 미제출 자기평가
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // When & Then - 미제출 상태를 다시 미제출로 변경 시도 (이미 미완료 상태이므로 400 에러)
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/reset`,
          )
          .send()
          .expect(400);
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식으로 미제출 변경 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}/reset`,
          )
          .send()
          .expect(400);
      });

      it('존재하지 않는 자기평가 ID로 미제출 변경 시 400 에러가 발생해야 한다', async () => {
        // Given - valid UUID지만 존재하지 않는 ID
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}/reset`,
          )
          .send()
          .expect(400);
      });
    });
  });

  describe('직원의 전체 WBS 자기평가 제출 (PATCH /employee/:employeeId/period/:periodId/submit-all)', () => {
    describe('성공 케이스', () => {
      it('직원의 모든 자기평가를 한 번에 제출할 수 있어야 한다', async () => {
        // Given - 여러 자기평가 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        // 서로 다른 WBS 항목 3개 선택
        const wbsItems = testData.wbsItems.slice(0, 3);

        for (const wbsItem of wbsItems) {
          await request(app.getHttpServer())
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `${wbsItem.id} 평가`,
              selfEvaluationScore: 100,
            })
            .expect(200);
        }

        // When - 전체 제출
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/submit-all`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.submittedCount).toBeGreaterThanOrEqual(2);
        expect(response.body.totalCount).toBeGreaterThanOrEqual(2);
        expect(response.body.completedEvaluations).toHaveLength(
          response.body.submittedCount,
        );
        expect(
          response.body.completedEvaluations.every((e) => e.evaluationId),
        ).toBe(true);
      });

      it('일부만 작성된 경우 작성된 것만 제출되고 나머지는 실패 목록에 포함되어야 한다', async () => {
        // Given - 일부만 작성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        // 서로 다른 WBS 항목 2개 선택
        const wbsItems = testData.wbsItems.slice(0, 2);

        // 하나는 작성
        await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItems[0].id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '작성 완료',
            selfEvaluationScore: 100,
          })
          .expect(200);

        // 하나는 미작성 (내용/점수 없음)
        await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItems[1].id}/period/${period.id}`,
          )
          .send({})
          .expect(200);

        // When - 전체 제출 시도
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/submit-all`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.submittedCount).toBeGreaterThanOrEqual(1);
        expect(response.body.failedCount).toBeGreaterThanOrEqual(1);
        expect(response.body.failedEvaluations.length).toBeGreaterThanOrEqual(
          1,
        );
      });
    });

    describe('실패 케이스', () => {
      it('자기평가가 하나도 없는 경우 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/submit-all`,
          )
          .send()
          .expect(400);
      });

      it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/invalid-uuid/period/${period.id}/submit-all`,
          )
          .send()
          .expect(400);
      });
    });
  });

  describe('직원의 전체 WBS 자기평가 미제출 (PATCH /employee/:employeeId/period/:periodId/reset)', () => {
    describe('성공 케이스', () => {
      it('직원의 모든 제출된 자기평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
        // Given - 여러 자기평가 생성 및 제출
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        // 서로 다른 WBS 항목 2개 선택
        const wbsItems = testData.wbsItems.slice(0, 2);

        for (const wbsItem of wbsItems) {
          const createResponse = await request(app.getHttpServer())
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `${wbsItem.id} 평가`,
              selfEvaluationScore: 100,
            })
            .expect(200);

          await request(app.getHttpServer())
            .patch(
              `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
            )
            .send({})
            .expect(200);
        }

        // When - 전체 미제출로 변경
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/reset`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.resetCount).toBeGreaterThanOrEqual(2);
        expect(response.body.totalCount).toBeGreaterThanOrEqual(2);
        expect(response.body.resetEvaluations).toHaveLength(
          response.body.resetCount,
        );
        expect(
          response.body.resetEvaluations.every((e) => e.wasCompleted === true),
        ).toBe(true);
      });
    });

    describe('실패 케이스', () => {
      it('완료된 자기평가가 없는 경우 빈 결과를 반환해야 한다', async () => {
        // Given - 미제출 자기평가만 있음
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '평가 내용',
            selfEvaluationScore: 100,
          })
          .expect(200);

        // When - 전체 미제출로 변경
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/reset`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.resetCount).toBe(0);
        expect(response.body.resetEvaluations).toHaveLength(0);
      });
    });
  });

  describe('프로젝트별 WBS 자기평가 제출 (PATCH /employee/:employeeId/period/:periodId/project/:projectId/submit)', () => {
    describe('성공 케이스', () => {
      it('특정 프로젝트의 모든 자기평가를 제출할 수 있어야 한다', async () => {
        // Given - 첫 번째 프로젝트(WBS가 연결된 프로젝트)의 자기평가 생성
        const employee = getRandomEmployee();
        const period = getInProgressPeriod(); // 진행 중인 평가기간 (WBS 할당이 있는 기간)
        const project = testData.projects[0]; // 첫 번째 프로젝트 (WBS 연결됨)

        // WBS 항목들이 첫 번째 프로젝트에 연결되어 있음
        const projectWbsItems = testData.wbsItems.slice(0, 2); // 2개만 사용

        // 각 WBS 항목에 대한 자기평가 생성
        for (const wbsItem of projectWbsItems) {
          await request(app.getHttpServer())
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `프로젝트 ${project.id} - ${wbsItem.name} 평가`,
              selfEvaluationScore: 100,
            })
            .expect(200);
        }

        // When - 프로젝트별 제출
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/submit`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.submittedCount).toBeGreaterThanOrEqual(
          projectWbsItems.length,
        );
        expect(response.body.totalCount).toBeGreaterThanOrEqual(
          projectWbsItems.length,
        );
        expect(response.body.completedEvaluations).toBeDefined();
        expect(
          response.body.completedEvaluations.length,
        ).toBeGreaterThanOrEqual(projectWbsItems.length);
      });
    });

    describe('실패 케이스', () => {
      it('프로젝트에 할당된 WBS가 없는 경우 400 에러가 발생해야 한다', async () => {
        // Given - WBS가 할당되지 않은 프로젝트 (두 번째 이후 프로젝트)
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = testData.projects[1] || testData.projects[0]; // 두 번째 프로젝트 (WBS 없음)

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/submit`,
          )
          .send()
          .expect(400);
      });
    });
  });

  describe('프로젝트별 WBS 자기평가 미제출 (PATCH /employee/:employeeId/period/:periodId/project/:projectId/reset)', () => {
    describe('성공 케이스', () => {
      it('특정 프로젝트의 모든 제출된 자기평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
        // Given - 프로젝트별 자기평가 생성 및 제출
        const employee = getRandomEmployee();
        const period = getInProgressPeriod(); // 진행 중인 평가기간 (WBS 할당이 있는 기간)
        const project = testData.projects[0]; // 첫 번째 프로젝트 (WBS 연결됨)
        const projectWbsItems = testData.wbsItems.slice(0, 2); // 2개만 사용

        // 각 WBS 항목에 대한 자기평가 생성 및 제출
        for (const wbsItem of projectWbsItems) {
          const createResponse = await request(app.getHttpServer())
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `프로젝트 ${project.id} - ${wbsItem.name} 평가`,
              selfEvaluationScore: 100,
            })
            .expect(200);

          // 제출
          await request(app.getHttpServer())
            .patch(
              `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
            )
            .send({})
            .expect(200);
        }

        // When - 프로젝트별 미제출로 변경
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/reset`,
          )
          .send()
          .expect(200);

        // Then
        expect(response.body.resetCount).toBeGreaterThanOrEqual(
          projectWbsItems.length,
        );
        expect(response.body.totalCount).toBeGreaterThanOrEqual(
          projectWbsItems.length,
        );
        expect(response.body.resetEvaluations).toBeDefined();
        expect(response.body.resetEvaluations.length).toBeGreaterThanOrEqual(
          projectWbsItems.length,
        );
      });
    });

    describe('실패 케이스', () => {
      it('프로젝트에 할당된 WBS가 없는 경우 400 에러가 발생해야 한다', async () => {
        // Given - WBS가 할당되지 않은 프로젝트
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = testData.projects[1] || testData.projects[0]; // 두 번째 프로젝트 (WBS 없음)

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/period/${period.id}/project/${project.id}/reset`,
          )
          .send()
          .expect(400);
      });
    });
  });

  describe('제출/미제출 데이터 무결성', () => {
    it('제출 시 completedAt이 설정되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 100,
        })
        .expect(200);

      // When
      const submitResponse = await request(app.getHttpServer())
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
        )
        .send({})
        .expect(200);

      // Then
      expect(submitResponse.body.completedAt).toBeTruthy();
      expect(
        new Date(submitResponse.body.completedAt).getTime(),
      ).toBeGreaterThan(0);
    });

    it('미제출로 변경 시 completedAt이 null이 되어야 한다', async () => {
      // Given - 제출된 자기평가
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 100,
        })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
        )
        .send({})
        .expect(200);

      // When - 미제출로 변경
      const resetResponse = await request(app.getHttpServer())
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/reset`,
        )
        .send()
        .expect(200);

      // Then
      expect(resetResponse.body.completedAt == null).toBe(true);
    });

    it('제출/미제출 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 100,
        })
        .expect(200);

      const originalUpdatedAt = new Date(createResponse.body.updatedAt);

      // 시간 경과를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 제출
      const submitResponse = await request(app.getHttpServer())
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/submit`,
        )
        .send({})
        .expect(200);

      // Then
      const updatedAtAfterSubmit = new Date(submitResponse.body.updatedAt);
      expect(updatedAtAfterSubmit.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      // 시간 경과를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 미제출로 변경
      const resetResponse = await request(app.getHttpServer())
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}/reset`,
        )
        .send()
        .expect(200);

      // Then
      const updatedAtAfterReset = new Date(resetResponse.body.updatedAt);
      expect(updatedAtAfterReset.getTime()).toBeGreaterThan(
        updatedAtAfterSubmit.getTime(),
      );
    });
  });
});
