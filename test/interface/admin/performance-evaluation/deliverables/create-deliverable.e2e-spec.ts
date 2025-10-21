import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/deliverables', () => {
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

    console.log('산출물 생성 테스트 데이터 준비 완료:', {
      employees: testData.employees.length,
      wbsItems: testData.wbsItems.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

  async function createDeliverable(data: {
    name: string;
    type: DeliverableType;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
  }): Promise<any> {
    const response = await testSuite
      .request()
      .post('/admin/performance-evaluation/deliverables')
      .send(data)
      .expect(201);

    return response.body;
  }

  async function getDeliverableFromDb(id: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM deliverable WHERE id = $1`,
      [id],
    );
    return result[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('산출물 생성 성공 시나리오', () => {
    it('기본 산출물을 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      // When
      const response = await createDeliverable({
        name: 'API 설계 문서',
        type: DeliverableType.DOCUMENT,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
      });

      // Then
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe('API 설계 문서');
      expect(response.type).toBe(DeliverableType.DOCUMENT);
      expect(response.employeeId).toBe(employee.id);
      expect(response.wbsItemId).toBe(wbsItem.id);
      expect(response.isActive).toBe(true);

      // DB 검증
      const dbRecord = await getDeliverableFromDb(response.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.name).toBe('API 설계 문서');
      expect(dbRecord.type).toBe(DeliverableType.DOCUMENT);
      expect(dbRecord.employeeId).toBe(employee.id);
      expect(dbRecord.wbsItemId).toBe(wbsItem.id);
    });

    it('파일 경로를 포함하여 산출물을 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];
      const filePath = '/uploads/documents/api-design-v1.pdf';

      // When
      const response = await createDeliverable({
        name: 'API 설계 문서 v1',
        type: DeliverableType.DOCUMENT,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
        filePath,
      });

      // Then
      expect(response.filePath).toBe(filePath);

      // DB 검증
      const dbRecord = await getDeliverableFromDb(response.id);
      expect(dbRecord.filePath).toBe(filePath);
    });

    it('설명을 포함하여 산출물을 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];
      const description = 'RESTful API 설계 문서 v1.0';

      // When
      const response = await createDeliverable({
        name: 'API 설계 문서',
        type: DeliverableType.DOCUMENT,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
        description,
      });

      // Then
      expect(response.description).toBe(description);

      // DB 검증
      const dbRecord = await getDeliverableFromDb(response.id);
      expect(dbRecord.description).toBe(description);
    });

    it('다양한 산출물 유형으로 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];
      const types = [
        DeliverableType.CODE,
        DeliverableType.DESIGN,
        DeliverableType.REPORT,
        DeliverableType.PRESENTATION,
        DeliverableType.OTHER,
      ];

      // When & Then
      for (const type of types) {
        const response = await createDeliverable({
          name: `${type} 산출물`,
          type,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        });

        expect(response.type).toBe(type);

        // DB 검증
        const dbRecord = await getDeliverableFromDb(response.id);
        expect(dbRecord.type).toBe(type);
      }
    });

    it('여러 직원이 같은 WBS 항목에 산출물을 생성할 수 있어야 한다', async () => {
      // Given
      const employees = testData.employees.slice(0, 3);
      const wbsItem = testData.wbsItems[0];

      // When
      const responses = await Promise.all(
        employees.map((employee, index) =>
          createDeliverable({
            name: `산출물 ${index + 1}`,
            type: DeliverableType.DOCUMENT,
            employeeId: employee.id,
            wbsItemId: wbsItem.id,
          }),
        ),
      );

      // Then
      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.employeeId).toBe(employees[index].id);
        expect(response.wbsItemId).toBe(wbsItem.id);
      });
    });

    it('한 직원이 여러 WBS 항목에 산출물을 생성할 수 있어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItems = testData.wbsItems.slice(0, 3);

      // When
      const responses = await Promise.all(
        wbsItems.map((wbsItem, index) =>
          createDeliverable({
            name: `산출물 ${index + 1}`,
            type: DeliverableType.DOCUMENT,
            employeeId: employee.id,
            wbsItemId: wbsItem.id,
          }),
        ),
      );

      // Then
      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.employeeId).toBe(employee.id);
        expect(response.wbsItemId).toBe(wbsItems[index].id);
      });
    });

    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      // When
      const response = await createDeliverable({
        name: 'API 설계 문서',
        type: DeliverableType.DOCUMENT,
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
        description: '설명',
        filePath: '/path/to/file',
      });

      // Then
      expect(response).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        employeeId: expect.any(String),
        wbsItemId: expect.any(String),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(Number),
      });
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('산출물 생성 실패 시나리오', () => {
    it('잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: 'API 설계 문서',
          type: DeliverableType.DOCUMENT,
          employeeId: 'invalid-uuid',
          wbsItemId: wbsItem.id,
        })
        .expect(400);
    });

    it('잘못된 형식의 wbsItemId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: 'API 설계 문서',
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
          wbsItemId: 'invalid-uuid',
        })
        .expect(400);
    });

    it('name 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        })
        .expect(400);
    });

    it('type 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: 'API 설계 문서',
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        })
        .expect(400);
    });

    it('employeeId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: 'API 설계 문서',
          type: DeliverableType.DOCUMENT,
          wbsItemId: wbsItem.id,
        })
        .expect(400);
    });

    it('wbsItemId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: 'API 설계 문서',
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
        })
        .expect(400);
    });

    it('잘못된 type 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: 'API 설계 문서',
          type: 'invalid-type',
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        })
        .expect(400);
    });

    it('빈 문자열 name으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = testData.employees[0];
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await testSuite
        .request()
        .post('/admin/performance-evaluation/deliverables')
        .send({
          name: '',
          type: DeliverableType.DOCUMENT,
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
        })
        .expect(400);
    });
  });
});
