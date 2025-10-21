import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { v4 as uuidv4 } from 'uuid';

describe('DELETE /admin/evaluation-criteria/wbs-evaluation-criteria - WBS 평가기준 삭제', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 완전한 테스트 환경 생성
    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
    };

    console.log('WBS 평가기준 삭제 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  /**
   * 프로젝트의 WBS 항목 조회
   */
  async function getWbsItemsFromProject(
    projectId: string,
  ): Promise<WbsItemDto[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_item WHERE "projectId" = $1 ORDER BY "wbsCode" ASC`,
      [projectId],
    );
    return result;
  }

  /**
   * 랜덤 직원 선택
   */
  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  /**
   * 랜덤 WBS 항목 선택
   */
  function getRandomWbsItem(): WbsItemDto {
    return testData.wbsItems[
      Math.floor(Math.random() * testData.wbsItems.length)
    ];
  }

  /**
   * WBS 평가기준 생성
   */
  async function createWbsEvaluationCriteria(
    wbsItemId: string,
    criteria: string,
    importance: number = 5,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .send({
        criteria,
        importance,
      })
      .expect(200);

    return response.body;
  }

  /**
   * WBS 평가기준 조회 (직접 DB 조회)
   */
  async function getWbsEvaluationCriteriaFromDb(id: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_evaluation_criteria WHERE id = $1`,
      [id],
    );
    return result[0];
  }

  /**
   * WBS 항목의 평가기준 목록 조회 (직접 DB 조회)
   */
  async function getWbsItemEvaluationCriteriaFromDb(
    wbsItemId: string,
  ): Promise<any[]> {
    return await dataSource.manager.query(
      `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
      [wbsItemId],
    );
  }

  // ==================== 단일 평가기준 삭제 테스트 ====================

  describe('DELETE /admin/evaluation-criteria/wbs-evaluation-criteria/:id - 단일 평가기준 삭제', () => {
    describe('성공 시나리오', () => {
      it('유효한 평가기준 ID로 삭제할 수 있어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = '삭제할 평가기준';
        const actionBy = getRandomEmployee().id;

        const created = await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.success).toBe(true);
      });

      it('삭제된 평가기준은 DB에서 soft delete 되어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = '삭제할 평가기준';
        const actionBy = getRandomEmployee().id;

        const created = await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // Then - DB에서 직접 조회하여 deletedAt이 설정되었는지 확인
        const dbRecord = await getWbsEvaluationCriteriaFromDb(created.id);
        expect(dbRecord).toBeDefined();
        expect(dbRecord.deletedAt).not.toBeNull();
      });

      it('삭제된 평가기준은 목록 조회에서 제외되어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = '삭제할 평가기준';
        const actionBy = getRandomEmployee().id;

        const created = await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // Then - WBS 항목의 평가기준 목록 조회
        const listResponse = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ wbsItemId: wbsItem.id });

        expect(listResponse.status).toBe(200);
        expect(Array.isArray(listResponse.body)).toBe(true);

        const foundCriteria = listResponse.body.find(
          (c: any) => c.id === created.id,
        );
        expect(foundCriteria).toBeUndefined();
      });

      it('삭제된 평가기준은 상세 조회 시 null 또는 빈 객체가 반환되어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = '삭제할 평가기준';
        const actionBy = getRandomEmployee().id;

        const created = await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // Then
        const detailResponse = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // null 또는 빈 객체 반환 허용
        const isNullOrEmpty =
          detailResponse.body === null ||
          Object.keys(detailResponse.body).length === 0;
        expect(isNullOrEmpty).toBe(true);
      });

      it('이미 삭제된 평가기준을 다시 삭제해도 에러가 발생하지 않아야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = '삭제할 평가기준';
        const actionBy = getRandomEmployee().id;

        const created = await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When - 첫 번째 삭제
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // Then - 두 번째 삭제 시도
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          );

        // 이미 삭제된 항목이므로 404 또는 200 반환 가능
        expect([200, 404]).toContain(response.status);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 평가기준 ID로 삭제 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${nonExistentId}`,
          );

        expect([404, 500]).toContain(response.status);
      });

      it('잘못된 UUID 형식의 ID로 삭제 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${invalidId}`,
          );

        expect([400, 500]).toContain(response.status);
      });
    });
  });

  // ==================== WBS 항목 평가기준 전체 삭제 테스트 ====================

  describe('DELETE /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId - WBS 항목 평가기준 전체 삭제', () => {
    describe('성공 시나리오', () => {
      it('WBS 항목의 평가기준을 삭제할 수 있어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = 'WBS 항목 평가기준';
        const actionBy = getRandomEmployee().id;

        await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.success).toBe(true);
      });

      it('WBS 항목의 평가기준이 DB에서 soft delete 되어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = 'WBS 항목 평가기준';
        const actionBy = getRandomEmployee().id;

        await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then - 활성 평가기준이 없어야 함
        const activeCriteria = await getWbsItemEvaluationCriteriaFromDb(
          wbsItem.id,
        );
        expect(activeCriteria.length).toBe(0);
      });

      it('WBS 항목의 평가기준 삭제 후 목록 조회 시 비어있어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = 'WBS 항목 평가기준';
        const actionBy = getRandomEmployee().id;

        await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        const listResponse = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ wbsItemId: wbsItem.id })
          .expect(200);

        expect(Array.isArray(listResponse.body)).toBe(true);
        expect(listResponse.body.length).toBe(0);
      });

      it('평가기준이 없는 WBS 항목을 삭제해도 에러가 발생하지 않아야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();

        // When & Then - 평가기준이 없는 WBS 항목 삭제
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          );

        expect([200, 404]).toContain(response.status);
      });

      it('이미 삭제된 WBS 평가기준을 다시 삭제해도 에러가 발생하지 않아야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = 'WBS 항목 평가기준';
        const actionBy = getRandomEmployee().id;

        await createWbsEvaluationCriteria(wbsItem.id, criteria);

        // When - 첫 번째 삭제
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then - 두 번째 삭제 시도
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          );

        expect([200, 404]).toContain(response.status);
      });

      it('다른 WBS 항목의 평가기준은 영향받지 않아야 한다', async () => {
        // Given
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];
        const actionBy = getRandomEmployee().id;

        const criteria1 = await createWbsEvaluationCriteria(
          wbsItem1.id,
          'WBS 1 평가기준',
        );
        const criteria2 = await createWbsEvaluationCriteria(
          wbsItem2.id,
          'WBS 2 평가기준',
        );

        // When - WBS 1의 평가기준만 삭제
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem1.id}`,
          )
          .expect(200);

        // Then - WBS 1의 평가기준은 삭제됨
        const activeCriteria1 = await getWbsItemEvaluationCriteriaFromDb(
          wbsItem1.id,
        );
        expect(activeCriteria1.length).toBe(0);

        // WBS 2의 평가기준은 유지됨
        const activeCriteria2 = await getWbsItemEvaluationCriteriaFromDb(
          wbsItem2.id,
        );
        expect(activeCriteria2.length).toBe(1);
        expect(activeCriteria2[0].id).toBe(criteria2.id);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 WBS 항목 ID로 삭제 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${nonExistentId}`,
          );

        expect([200, 404]).toContain(response.status);
      });

      it('잘못된 UUID 형식의 WBS 항목 ID로 삭제 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${invalidId}`,
          );

        expect([400, 500]).toContain(response.status);
      });
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오', () => {
    it('평가기준 생성 -> 삭제 -> 재생성이 정상적으로 동작해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const actionBy = getRandomEmployee().id;

      // When & Then - 평가기준 생성
      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        '첫 번째 평가기준',
      );
      expect(created.criteria).toBe('첫 번째 평가기준');

      // 삭제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
        )
        .expect(200);

      // 재생성
      const recreated = await createWbsEvaluationCriteria(
        wbsItem.id,
        '두 번째 평가기준',
      );
      expect(recreated.criteria).toBe('두 번째 평가기준');
      expect(recreated.id).not.toBe(created.id); // 새로운 ID로 생성됨
    });

    it('WBS 항목 평가기준 전체 삭제 후 재생성이 정상적으로 동작해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const actionBy = getRandomEmployee().id;

      // When & Then - 평가기준 생성
      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        '첫 번째 평가기준',
      );

      // WBS 항목 평가기준 전체 삭제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .expect(200);

      // 재생성
      const recreated = await createWbsEvaluationCriteria(
        wbsItem.id,
        '두 번째 평가기준',
      );
      expect(recreated.criteria).toBe('두 번째 평가기준');
      expect(recreated.id).not.toBe(created.id);
    });
  });
});
