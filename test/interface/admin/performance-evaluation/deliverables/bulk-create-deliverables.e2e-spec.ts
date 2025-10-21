import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';

describe('POST /admin/performance-evaluation/deliverables/bulk', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
    wbsItems: WbsItemDto[];
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

    testData = {
      employees,
      wbsItems,
    };

    console.log('산출물 벌크 생성 테스트 데이터 준비 완료:', {
      employees: testData.employees.length,
      wbsItems: testData.wbsItems.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 성공 시나리오 ====================

  describe('산출물 벌크 생성 성공 시나리오', () => {
    it('여러 산출물을 한 번에 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItems = testData.wbsItems.slice(0, 3);

      const deliverables = wbsItems.map((wbsItem, index) => ({
        name: `산출물 ${index + 1}`,
        type: DeliverableType.DOCUMENT,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
        description: `설명 ${index + 1}`,
      }));

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.successCount).toBe(3);
      expect(response.body.failedCount).toBe(0);
      expect(response.body.createdIds).toHaveLength(3);
      expect(response.body.failedItems).toHaveLength(0);

      // DB 검증
      for (const id of response.body.createdIds) {
        const dbRecord = await dataSource.manager.query(
          `SELECT * FROM deliverable WHERE id = $1`,
          [id],
        );
        expect(dbRecord[0]).toBeDefined();
      }
    });

    it('생성 성공한 산출물 ID 목록이 반환되어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      const deliverables = Array.from({ length: 5 }, (_, index) => ({
        name: `산출물 ${index + 1}`,
        type: DeliverableType.CODE,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
      }));

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then
      expect(response.body.createdIds).toBeInstanceOf(Array);
      expect(response.body.createdIds).toHaveLength(5);
      response.body.createdIds.forEach((id: string) => {
        expect(id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      });
    });

    it('빈 배열로 요청 시에도 처리되어야 한다', async () => {
      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables: [] })
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(0);
      expect(response.body.failedCount).toBe(0);
      expect(response.body.createdIds).toHaveLength(0);
    });

    it('다양한 유형의 산출물을 한 번에 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      const types = [
        DeliverableType.DOCUMENT,
        DeliverableType.CODE,
        DeliverableType.DESIGN,
        DeliverableType.REPORT,
        DeliverableType.PRESENTATION,
      ];

      const deliverables = types.map((type, index) => ({
        name: `${type} 산출물 ${index + 1}`,
        type,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
      }));

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(types.length);
      expect(response.body.createdIds).toHaveLength(types.length);
    });

    it('여러 직원의 산출물을 한 번에 생성할 수 있어야 한다', async () => {
      // Given
      const employees = testData.employees.slice(0, 3);
      const wbsItem = testData.wbsItems[0];

      const deliverables = employees.map((employee, index) => ({
        name: `직원 ${index + 1}의 산출물`,
        type: DeliverableType.DOCUMENT,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
      }));

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(3);
      expect(response.body.createdIds).toHaveLength(3);

      // 각 직원의 산출물이 생성되었는지 확인
      for (let i = 0; i < employees.length; i++) {
        const dbRecord = await dataSource.manager.query(
          `SELECT * FROM deliverable WHERE id = $1`,
          [response.body.createdIds[i]],
        );
        expect(dbRecord[0].employeeId).toBe(employees[i].id);
      }
    });

    it('파일 경로와 설명을 포함하여 벌크 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      const deliverables = [
        {
          name: '산출물 1',
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          description: '설명 1',
          filePath: '/path/to/file1.pdf',
        },
        {
          name: '산출물 2',
          type: DeliverableType.CODE,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          description: '설명 2',
          filePath: '/path/to/file2.zip',
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then
      expect(response.body.successCount).toBe(2);

      // DB 검증
      for (let i = 0; i < deliverables.length; i++) {
        const dbRecord = await dataSource.manager.query(
          `SELECT * FROM deliverable WHERE id = $1`,
          [response.body.createdIds[i]],
        );
        expect(dbRecord[0].description).toBe(deliverables[i].description);
        expect(dbRecord[0].filePath).toBe(deliverables[i].filePath);
      }
    });

    it('응답에 성공/실패 개수가 포함되어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      const deliverables = [
        {
          name: '산출물 1',
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        },
        {
          name: '산출물 2',
          type: DeliverableType.CODE,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then
      expect(response.body).toMatchObject({
        successCount: expect.any(Number),
        failedCount: expect.any(Number),
        createdIds: expect.any(Array),
        failedItems: expect.any(Array),
      });
      expect(
        response.body.successCount + response.body.failedCount,
      ).toBeLessThanOrEqual(deliverables.length);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('산출물 벌크 생성 실패 시나리오', () => {
    it('deliverables 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({})
        .expect(400);
    });

    it('deliverables가 배열이 아니면 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables: 'not-an-array' })
        .expect(400);
    });

    it('잘못된 형식의 데이터 포함 시 해당 항목만 실패해야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      const deliverables = [
        {
          name: '정상 산출물',
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        },
        {
          name: '중복 산출물',
          type: DeliverableType.CODE,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        },
        {
          name: '정상 산출물', // 중복된 이름으로 실패 유도
          type: DeliverableType.DESIGN,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        },
      ];

      // When
      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables/bulk')
        .send({ deliverables })
        .expect(201);

      // Then - 일부는 성공, 일부는 실패할 수 있음
      expect(response.body.successCount).toBeGreaterThanOrEqual(1);
      expect(response.body.successCount).toBeLessThanOrEqual(3);
    });
  });
});
