import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

/**
 * WBS 자기평가 조회 E2E 테스트
 *
 * 테스트 대상:
 * - GET /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId (직원의 자기평가 목록 조회)
 * - GET /admin/performance-evaluation/wbs-self-evaluations/:id (WBS 자기평가 상세정보 조회)
 */
describe('GET /admin/performance-evaluation/wbs-self-evaluations - 조회', () => {
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

    console.log('WBS 자기평가 조회 테스트 데이터 생성 완료:', {
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

  describe('직원의 자기평가 목록 조회 (GET /employee/:employeeId)', () => {
    describe('성공 케이스', () => {
      it('직원의 자기평가 목록을 조회할 수 있어야 한다', async () => {
        // Given - 자기평가 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem1 = getRandomWbsItem();
        const wbsItem2 = getRandomWbsItem();

        await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem1.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '첫 번째 평가',
            selfEvaluationScore: 100,
          })
          .expect(200);

        await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem2.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '두 번째 평가',
            selfEvaluationScore: 90,
          })
          .expect(200);

        // When - 목록 조회
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}`,
          )
          .expect(200);

        // Then - 응답 구조 검증
        expect(response.body).toHaveProperty('evaluations');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');

        // 목록 검증
        expect(Array.isArray(response.body.evaluations)).toBe(true);
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(2);
        expect(response.body.total).toBeGreaterThanOrEqual(2);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
      });

      it('반환된 각 자기평가 항목은 모든 필수 필드를 포함해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '테스트 평가',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          })
          .expect(200);

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}`,
          )
          .expect(200);

        // Then - 각 항목의 필드 검증
        const evaluation = response.body.evaluations[0];

        // 필수 필드 검증
        expect(evaluation).toHaveProperty('id');
        expect(evaluation).toHaveProperty('periodId');
        expect(evaluation).toHaveProperty('employeeId');
        expect(evaluation).toHaveProperty('wbsItemId');
        expect(evaluation).toHaveProperty('assignedBy');
        expect(evaluation).toHaveProperty('assignedDate');
        expect(evaluation).toHaveProperty('isCompleted');
        expect(evaluation).toHaveProperty('evaluationDate');
        expect(evaluation).toHaveProperty('createdAt');
        expect(evaluation).toHaveProperty('updatedAt');
        expect(evaluation).toHaveProperty('version');

        // 타입 검증
        expect(typeof evaluation.id).toBe('string');
        expect(typeof evaluation.periodId).toBe('string');
        expect(typeof evaluation.employeeId).toBe('string');
        expect(typeof evaluation.wbsItemId).toBe('string');
        expect(typeof evaluation.isCompleted).toBe('boolean');
        expect(typeof evaluation.version).toBe('number');

        // 날짜 형식 검증
        expect(new Date(evaluation.evaluationDate).getTime()).toBeGreaterThan(
          0,
        );
        expect(new Date(evaluation.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(evaluation.updatedAt).getTime()).toBeGreaterThan(0);
      });

      it('periodId 필터로 특정 평가기간의 자기평가만 조회할 수 있어야 한다', async () => {
        // Given
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

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}`,
          )
          .query({ periodId: period.id })
          .expect(200);

        // Then
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.periodId).toBe(period.id);
        });
      });

      it('페이지네이션이 정상적으로 작동해야 한다', async () => {
        // Given - 여러 개 생성
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItems = [
          getRandomWbsItem(),
          getRandomWbsItem(),
          getRandomWbsItem(),
        ];

        for (const wbsItem of wbsItems) {
          await request(app.getHttpServer())
            .post(
              `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
            )
            .send({
              selfEvaluationContent: `평가 ${wbsItem.id}`,
              selfEvaluationScore: 100,
            })
            .expect(200);
        }

        // When - 페이지 크기 2로 조회
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}`,
          )
          .query({ page: 1, limit: 2 })
          .expect(200);

        // Then
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(2);
        expect(response.body.evaluations.length).toBeLessThanOrEqual(2);
        expect(response.body.total).toBeGreaterThanOrEqual(1); // 최소 1개 이상 생성되었는지 확인
      });

      it('자기평가가 없는 경우 빈 배열을 반환해야 한다', async () => {
        // Given - 자기평가 없는 직원
        const employee = getRandomEmployee();

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.evaluations).toEqual([]);
        expect(response.body.total).toBe(0);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${invalidId}`,
          )
          .expect(400);
      });
    });
  });

  describe('WBS 자기평가 상세정보 조회 (GET /:id)', () => {
    describe('성공 케이스', () => {
      it('자기평가 상세정보를 조회할 수 있어야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '상세 평가 내용',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`,
          )
          .expect(200);

        // Then - 기본 필드 검증
        expect(response.body.id).toBe(evaluationId);
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.wbsItemId).toBe(wbsItem.id);
      });

      it('반환된 상세정보는 모든 필수 필드를 포함해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const wbsItem = getRandomWbsItem();

        const createResponse = await request(app.getHttpServer())
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: '상세 평가',
            selfEvaluationScore: 95,
            performanceResult: '성과 결과',
          })
          .expect(200);

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then - 모든 필수 필드 검증
        const detail = response.body;

        // 기본 필드
        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('periodId');
        expect(detail).toHaveProperty('employeeId');
        expect(detail).toHaveProperty('wbsItemId');
        expect(detail).toHaveProperty('assignedBy');
        expect(detail).toHaveProperty('assignedDate');
        expect(detail).toHaveProperty('isCompleted');
        expect(detail).toHaveProperty('evaluationDate');
        expect(detail).toHaveProperty('createdAt');
        expect(detail).toHaveProperty('updatedAt');
        expect(detail).toHaveProperty('version');

        // 내용 필드 (생성했으므로 존재해야 함)
        expect(detail).toHaveProperty('selfEvaluationContent');
        expect(detail).toHaveProperty('selfEvaluationScore');
        expect(detail).toHaveProperty('performanceResult');

        // 타입 검증
        expect(typeof detail.id).toBe('string');
        expect(typeof detail.periodId).toBe('string');
        expect(typeof detail.employeeId).toBe('string');
        expect(typeof detail.wbsItemId).toBe('string');
        expect(typeof detail.isCompleted).toBe('boolean');
        expect(typeof detail.version).toBe('number');
        expect(typeof detail.selfEvaluationContent).toBe('string');
        expect(typeof detail.selfEvaluationScore).toBe('number');
        expect(typeof detail.performanceResult).toBe('string');

        // 날짜 필드 검증
        expect(new Date(detail.evaluationDate).getTime()).toBeGreaterThan(0);
        expect(new Date(detail.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(detail.updatedAt).getTime()).toBeGreaterThan(0);
      });

      it('반환된 상세정보는 평가기간 정보를 포함할 수 있다', async () => {
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
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then - evaluationPeriod 객체 검증 (있는 경우)
        if (response.body.evaluationPeriod) {
          const periodInfo = response.body.evaluationPeriod;
          expect(periodInfo).toHaveProperty('id');
          expect(periodInfo).toHaveProperty('name');
          expect(periodInfo).toHaveProperty('startDate');
          expect(periodInfo).toHaveProperty('endDate');
          expect(periodInfo).toHaveProperty('status');

          expect(typeof periodInfo.id).toBe('string');
          expect(typeof periodInfo.name).toBe('string');
          expect(typeof periodInfo.status).toBe('string');
        }
      });

      it('반환된 상세정보는 직원 정보를 포함할 수 있다', async () => {
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
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then - employee 객체 검증 (있는 경우)
        if (response.body.employee) {
          const employeeInfo = response.body.employee;
          expect(employeeInfo).toHaveProperty('id');
          expect(employeeInfo).toHaveProperty('employeeNumber');
          expect(employeeInfo).toHaveProperty('name');
          expect(employeeInfo).toHaveProperty('email');
          expect(employeeInfo).toHaveProperty('departmentId');

          expect(typeof employeeInfo.id).toBe('string');
          expect(typeof employeeInfo.employeeNumber).toBe('string');
          expect(typeof employeeInfo.name).toBe('string');
          expect(typeof employeeInfo.email).toBe('string');
          expect(typeof employeeInfo.departmentId).toBe('string');
        }
      });

      it('반환된 상세정보는 WBS 항목 정보를 포함할 수 있다', async () => {
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
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then - wbsItem 객체 검증 (있는 경우)
        if (response.body.wbsItem) {
          const wbsItemInfo = response.body.wbsItem;
          expect(wbsItemInfo).toHaveProperty('id');
          expect(wbsItemInfo).toHaveProperty('wbsCode');
          expect(wbsItemInfo).toHaveProperty('title');
          expect(wbsItemInfo).toHaveProperty('status');
          expect(wbsItemInfo).toHaveProperty('projectId');

          expect(typeof wbsItemInfo.id).toBe('string');
          expect(typeof wbsItemInfo.wbsCode).toBe('string');
          expect(typeof wbsItemInfo.title).toBe('string');
          expect(typeof wbsItemInfo.status).toBe('string');
          expect(typeof wbsItemInfo.projectId).toBe('string');
        }
      });

      it('제출된 자기평가의 경우 completedAt이 존재해야 한다', async () => {
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

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.isCompleted).toBe(true);
        expect(response.body.completedAt).toBeTruthy();
        expect(new Date(response.body.completedAt).getTime()).toBeGreaterThan(
          0,
        );
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}`,
          )
          .expect(400);
      });

      it('존재하지 않는 자기평가 ID로 조회 시 404 에러가 발생해야 한다', async () => {
        // Given - valid UUID지만 존재하지 않는 ID
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}`,
          )
          .expect(404);
      });
    });
  });

  describe('데이터 일관성 검증', () => {
    it('목록 조회와 상세 조회의 데이터가 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '일관성 테스트',
          selfEvaluationScore: 100,
          performanceResult: '성과',
        })
        .expect(200);

      const evaluationId = createResponse.body.id;

      // When - 목록 조회와 상세 조회
      const listResponse = await request(app.getHttpServer())
        .get(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}`,
        )
        .expect(200);

      const detailResponse = await request(app.getHttpServer())
        .get(
          `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`,
        )
        .expect(200);

      // Then - 목록의 첫 항목과 상세 조회 데이터 비교
      const listItem = listResponse.body.evaluations.find(
        (e: any) => e.id === evaluationId,
      );

      if (listItem) {
        expect(listItem.id).toBe(detailResponse.body.id);
        expect(listItem.employeeId).toBe(detailResponse.body.employeeId);
        expect(listItem.periodId).toBe(detailResponse.body.periodId);
        expect(listItem.wbsItemId).toBe(detailResponse.body.wbsItemId);
        expect(listItem.isCompleted).toBe(detailResponse.body.isCompleted);
        expect(listItem.version).toBe(detailResponse.body.version);
      }
    });

    it('조회된 데이터의 날짜 필드가 유효한 ISO 8601 형식이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const createResponse = await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '날짜 테스트',
          selfEvaluationScore: 100,
        })
        .expect(200);

      // When
      const response = await request(app.getHttpServer())
        .get(
          `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
        )
        .expect(200);

      // Then - ISO 8601 형식 검증
      const dateFields = [
        'evaluationDate',
        'createdAt',
        'updatedAt',
        'assignedDate',
      ];

      dateFields.forEach((field) => {
        if (response.body[field]) {
          const date = new Date(response.body[field]);
          expect(date.toISOString()).toBe(response.body[field]);
          expect(date.getTime()).toBeGreaterThan(0);
        }
      });
    });
  });
});
