import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';

describe('GET /admin/performance-evaluation/deliverables/employee/:employeeId', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
    wbsItems: WbsItemDto[];
    deliverableIds: string[];
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 테스트 데이터 생성
    const employees =
      await testContextService.직원_데이터를_확인하고_준비한다(5);
    const { wbsItems } = await testContextService.프로젝트와_WBS를_생성한다(2);

    // 산출물 생성
    const deliverableIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: `직원 ${i + 1}의 산출물`,
          type: DeliverableType.DOCUMENT,
          employeeId: employees[0].id,
          wbsItemId: wbsItems[i % wbsItems.length].id,
          description: `설명 ${i + 1}`,
        })
        .expect(201);

      deliverableIds.push(response.body.id);
    }

    // 다른 직원의 산출물도 생성
    await testSuite
      .request()
      .post('/admin/performance-evaluation/deliverables')
      .send({
        name: '다른 직원의 산출물',
        type: DeliverableType.CODE,
        employeeId: employees[1].id,
        wbsItemId: wbsItems[0].id,
      })
      .expect(201);

    testData = {
      employees,
      wbsItems,
      deliverableIds,
    };

    console.log('직원별 산출물 조회 테스트 데이터 준비 완료:', {
      employees: testData.employees.length,
      wbsItems: testData.wbsItems.length,
      deliverables: testData.deliverableIds.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 성공 시나리오 ====================

  describe('직원별 산출물 조회 성공 시나리오', () => {
    it('직원의 산출물 목록을 조회할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.deliverables).toBeInstanceOf(Array);
      expect(response.body.deliverables).toHaveLength(3);
      expect(response.body.total).toBe(3);

      // 모든 산출물이 해당 직원의 것인지 확인
      response.body.deliverables.forEach((deliverable: any) => {
        expect(deliverable.employeeId).toBe(employee.id);
      });
    });

    it('activeOnly 파라미터로 활성 산출물만 조회할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // 하나를 비활성화
      await testSuite
        .request()
        .put(
          `/admin/performance-evaluation/deliverables/${testData.deliverableIds[0]}`,
        )
        .send({ isActive: false })
        .expect(200);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .query({ activeOnly: 'true' })
        .expect(200);

      // Then
      expect(response.body.deliverables).toHaveLength(2);
      expect(response.body.total).toBe(2);
      response.body.deliverables.forEach((deliverable: any) => {
        expect(deliverable.isActive).toBe(true);
      });
    });

    it('activeOnly=false로 비활성 산출물도 조회할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // 하나를 비활성화
      await testSuite
        .request()
        .put(
          `/admin/performance-evaluation/deliverables/${testData.deliverableIds[0]}`,
        )
        .send({ isActive: false })
        .expect(200);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .query({ activeOnly: 'false' })
        .expect(200);

      // Then
      expect(response.body.deliverables.length).toBeGreaterThanOrEqual(1);
      const hasInactive = response.body.deliverables.some(
        (d: any) => !d.isActive,
      );
      expect(hasInactive).toBe(true);
    });

    it('activeOnly 생략 시 활성 산출물만 조회되어야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // 하나를 비활성화
      await testSuite
        .request()
        .put(
          `/admin/performance-evaluation/deliverables/${testData.deliverableIds[0]}`,
        )
        .send({ isActive: false })
        .expect(200);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .expect(200);

      // Then
      expect(response.body.deliverables).toHaveLength(2);
      response.body.deliverables.forEach((deliverable: any) => {
        expect(deliverable.isActive).toBe(true);
      });
    });

    it('산출물이 없는 직원도 빈 배열을 반환해야 한다', async () => {
      // Given
      const employee = testData.employees[2]; // 산출물이 없는 직원

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .expect(200);

      // Then
      expect(response.body.deliverables).toBeInstanceOf(Array);
      expect(response.body.deliverables).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('응답에 총 개수가 포함되어야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .expect(200);

      // Then
      expect(response.body.total).toBeDefined();
      expect(response.body.total).toBe(response.body.deliverables.length);
    });

    it('각 산출물에 필수 필드가 포함되어야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${employee.id}`,
        )
        .expect(200);

      // Then
      expect(response.body.deliverables.length).toBeGreaterThan(0);
      response.body.deliverables.forEach((deliverable: any) => {
        expect(deliverable).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String),
          employeeId: expect.any(String),
          wbsItemId: expect.any(String),
          isActive: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('직원별 산출물 조회 실패 시나리오', () => {
    it('잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/admin/performance-evaluation/deliverables/employee/invalid-uuid')
        .expect(400);
    });

    it('존재하지 않는 employeeId로 요청해도 200을 반환해야 한다', async () => {
      // Given
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/deliverables/employee/${nonExistentId}`,
        )
        .expect(200);

      // Then
      expect(response.body.deliverables).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });
});
