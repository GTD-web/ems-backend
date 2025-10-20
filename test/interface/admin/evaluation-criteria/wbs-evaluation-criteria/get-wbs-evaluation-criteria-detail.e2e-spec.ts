import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/evaluation-criteria/wbs-evaluation-criteria/:id - WBS 평가기준 상세 조회', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
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

  afterAll(async () => {
    await testSuite.closeApp();
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

    console.log('WBS 평가기준 상세조회 테스트 데이터 생성 완료:', {
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

  // ==================== 헬퍼 함수 ====================

  function getRandomWbsItem(): WbsItemDto {
    return testData.wbsItems[
      Math.floor(Math.random() * testData.wbsItems.length)
    ];
  }

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

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
   * WBS 평가기준 생성 헬퍼
   */
  async function createWbsEvaluationCriteria(
    wbsItemId: string,
    criteria: string,
    actionBy?: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .send({
        criteria,
        actionBy: actionBy || getRandomEmployee().id,
      })
      .expect(200);

    return response.body;
  }

  /**
   * DB에서 WBS 항목 조회
   */
  async function getWbsItemFromDb(wbsItemId: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_item WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [wbsItemId],
    );
    return result[0];
  }

  /**
   * DB에서 WBS 항목 삭제 (soft delete)
   */
  async function deleteWbsItemInDb(wbsItemId: string): Promise<void> {
    await dataSource.manager.query(
      `UPDATE wbs_item SET "deletedAt" = NOW() WHERE "id" = $1`,
      [wbsItemId],
    );
  }

  // ==================== 성공 시나리오 ====================

  describe('성공 시나리오', () => {
    it('유효한 평가기준 ID로 상세 정보를 조회할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '코드 품질 및 성능 최적화';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(created.id);
      expect(response.body.criteria).toBe(criteria);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('상세 조회 시 WBS 항목 정보가 포함되어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '테스트 평가기준';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      expect(response.body.wbsItem).toBeDefined();
      expect(response.body.wbsItem).not.toBeNull();
      expect(response.body.wbsItem.id).toBe(wbsItem.id);
      expect(response.body.wbsItem.wbsCode).toBeDefined();
      expect(response.body.wbsItem.title).toBeDefined();
      expect(response.body.wbsItem.status).toBeDefined();
      expect(response.body.wbsItem.level).toBeDefined();
      expect(response.body.wbsItem.startDate).toBeDefined();
      expect(response.body.wbsItem.endDate).toBeDefined();
      expect(response.body.wbsItem.progressPercentage).toBeDefined();
    });

    it('WBS 항목 정보의 모든 필드가 정확하게 반환되어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '상세 테스트';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      const dbWbsItem = await getWbsItemFromDb(wbsItem.id);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      const returnedWbsItem = response.body.wbsItem;
      expect(returnedWbsItem.id).toBe(dbWbsItem.id);
      expect(returnedWbsItem.wbsCode).toBe(dbWbsItem.wbsCode);
      expect(returnedWbsItem.title).toBe(dbWbsItem.title);
      expect(returnedWbsItem.status).toBe(dbWbsItem.status);
      expect(returnedWbsItem.level).toBe(dbWbsItem.level);
      expect(returnedWbsItem.progressPercentage).toBe(
        dbWbsItem.progressPercentage,
      );
    });

    it('반환 데이터의 모든 필수 필드가 존재해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '필드 검증 테스트';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then - 평가기준 필드 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('criteria');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('wbsItem');

      // Then - WBS 항목 필드 검증
      expect(response.body.wbsItem).toHaveProperty('id');
      expect(response.body.wbsItem).toHaveProperty('wbsCode');
      expect(response.body.wbsItem).toHaveProperty('title');
      expect(response.body.wbsItem).toHaveProperty('status');
      expect(response.body.wbsItem).toHaveProperty('level');
      expect(response.body.wbsItem).toHaveProperty('startDate');
      expect(response.body.wbsItem).toHaveProperty('endDate');
      expect(response.body.wbsItem).toHaveProperty('progressPercentage');
    });

    it('반환 데이터의 모든 필드가 null이 아니어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = 'Not null 검증 테스트';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then - 평가기준 필드가 null이 아닌지 검증
      expect(response.body.id).not.toBeNull();
      expect(response.body.criteria).not.toBeNull();
      expect(response.body.createdAt).not.toBeNull();
      expect(response.body.updatedAt).not.toBeNull();
      expect(response.body.wbsItem).not.toBeNull();

      // Then - WBS 항목 필드가 null이 아닌지 검증
      expect(response.body.wbsItem.id).not.toBeNull();
      expect(response.body.wbsItem.wbsCode).not.toBeNull();
      expect(response.body.wbsItem.title).not.toBeNull();
      expect(response.body.wbsItem.status).not.toBeNull();
      expect(response.body.wbsItem.level).not.toBeNull();
    });

    it('여러 평가기준을 생성하고 각각 올바르게 상세 조회할 수 있어야 한다', async () => {
      // Given
      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];
      const wbsItem3 = testData.wbsItems[2];

      const created1 = await createWbsEvaluationCriteria(
        wbsItem1.id,
        '평가기준 1',
        getRandomEmployee().id,
      );
      const created2 = await createWbsEvaluationCriteria(
        wbsItem2.id,
        '평가기준 2',
        getRandomEmployee().id,
      );
      const created3 = await createWbsEvaluationCriteria(
        wbsItem3.id,
        '평가기준 3',
        getRandomEmployee().id,
      );

      // When & Then - 첫 번째 평가기준 조회
      const response1 = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${created1.id}`,
        )
        .expect(200);

      expect(response1.body.id).toBe(created1.id);
      expect(response1.body.criteria).toBe('평가기준 1');
      expect(response1.body.wbsItem.id).toBe(wbsItem1.id);

      // When & Then - 두 번째 평가기준 조회
      const response2 = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${created2.id}`,
        )
        .expect(200);

      expect(response2.body.id).toBe(created2.id);
      expect(response2.body.criteria).toBe('평가기준 2');
      expect(response2.body.wbsItem.id).toBe(wbsItem2.id);

      // When & Then - 세 번째 평가기준 조회
      const response3 = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${created3.id}`,
        )
        .expect(200);

      expect(response3.body.id).toBe(created3.id);
      expect(response3.body.criteria).toBe('평가기준 3');
      expect(response3.body.wbsItem.id).toBe(wbsItem3.id);
    });

    it('WBS 항목이 삭제된 경우 wbsItem이 null이어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = 'WBS 삭제 테스트';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // WBS 항목 삭제
      await deleteWbsItemInDb(wbsItem.id);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      expect(response.body.id).toBe(created.id);
      expect(response.body.criteria).toBe(criteria);
      expect(response.body.wbsItem).toBeNull();
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('실패 시나리오', () => {
    it('존재하지 않는 평가기준 ID로 조회 시 null을 반환해야 한다', async () => {
      // Given
      const nonExistentId = 'f0f13879-9a95-4320-a753-3e304d203e4e';

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${nonExistentId}`,
        )
        .expect(200);

      // Then
      expect(response.body).toEqual({});
    });

    it('잘못된 UUID 형식의 ID로 조회 시 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-evaluation-criteria/invalid-uuid')
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });

    it('삭제된 평가기준을 조회 시 null을 반환해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '삭제될 평가기준';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // 평가기준 삭제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
        )
        .expect(200);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      const isNullOrEmpty =
        response.body === null || Object.keys(response.body).length === 0;
      expect(isNullOrEmpty).toBe(true);
    });

    it('빈 문자열 ID로 조회 시 목록조회 엔드포인트로 라우팅된다', async () => {
      // When & Then
      // 빈 문자열 ID는 목록 조회 엔드포인트로 라우팅됨
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-evaluation-criteria/')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오', () => {
    it('생성 -> 상세조회 -> 수정 -> 상세조회 흐름이 정상적으로 동작해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const actionBy = getRandomEmployee().id;

      // 1. 생성
      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        '초기 평가기준',
        actionBy,
      );

      // 2. 상세 조회
      const response1 = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      expect(response1.body.criteria).toBe('초기 평가기준');
      expect(response1.body.wbsItem).toBeDefined();

      // 3. 수정 (같은 WBS 항목에 다시 저장)
      await createWbsEvaluationCriteria(
        wbsItem.id,
        '수정된 평가기준',
        actionBy,
      );

      // 4. 다시 상세 조회
      const response2 = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      expect(response2.body.id).toBe(created.id);
      expect(response2.body.criteria).toBe('수정된 평가기준');
      expect(response2.body.wbsItem.id).toBe(wbsItem.id);
    });

    it('생성 -> 상세조회 -> 삭제 -> 상세조회 흐름이 정상적으로 동작해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const actionBy = getRandomEmployee().id;

      // 1. 생성
      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        '평가기준',
        actionBy,
      );

      // 2. 상세 조회
      const response1 = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      expect(response1.body.criteria).toBe('평가기준');

      // 3. 삭제
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
        )
        .expect(200);

      // 4. 다시 상세 조회
      const response2 = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      const isNullOrEmpty =
        response2.body === null || Object.keys(response2.body).length === 0;
      expect(isNullOrEmpty).toBe(true);
    });

    it('목록조회 -> 상세조회로 연결된 흐름이 정상적으로 동작해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '목록-상세 연동 테스트';
      const actionBy = getRandomEmployee().id;

      await createWbsEvaluationCriteria(wbsItem.id, criteria, actionBy);

      // 1. 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
        .query({ wbsItemId: wbsItem.id })
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThan(0);
      const firstItem = listResponse.body[0];

      // 2. 목록에서 얻은 ID로 상세 조회
      const detailResponse = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/${firstItem.id}`,
        )
        .expect(200);

      // Then
      expect(detailResponse.body.id).toBe(firstItem.id);
      expect(detailResponse.body.criteria).toBe(firstItem.criteria);
      expect(detailResponse.body.wbsItem).toBeDefined();
      expect(detailResponse.body.wbsItem.id).toBe(wbsItem.id);
    });
  });

  // ==================== 데이터 정합성 ====================

  describe('데이터 정합성', () => {
    it('상세조회 결과가 생성 시 반환된 데이터와 일치해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '정합성 검증 테스트';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      expect(response.body.id).toBe(created.id);
      expect(response.body.criteria).toBe(created.criteria);
      expect(new Date(response.body.createdAt).getTime()).toBe(
        new Date(created.createdAt).getTime(),
      );
      expect(new Date(response.body.updatedAt).getTime()).toBe(
        new Date(created.updatedAt).getTime(),
      );
    });

    it('WBS 항목 정보가 실제 DB 데이터와 일치해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = 'DB 일치 검증';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        criteria,
        actionBy,
      );

      const dbWbsItem = await getWbsItemFromDb(wbsItem.id);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`)
        .expect(200);

      // Then
      const returnedWbsItem = response.body.wbsItem;
      expect(returnedWbsItem.id).toBe(dbWbsItem.id);
      expect(returnedWbsItem.wbsCode).toBe(dbWbsItem.wbsCode);
      expect(returnedWbsItem.title).toBe(dbWbsItem.title);
      expect(returnedWbsItem.status).toBe(dbWbsItem.status);
      expect(returnedWbsItem.level).toBe(dbWbsItem.level);
    });
  });
});
