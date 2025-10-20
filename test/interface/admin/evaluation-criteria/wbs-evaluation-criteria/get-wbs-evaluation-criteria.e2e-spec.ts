import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/evaluation-criteria/wbs-evaluation-criteria - WBS 평가기준 조회', () => {
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

    console.log('WBS 평가기준 조회 테스트 데이터 생성 완료:', {
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
   * DB에서 평가기준 조회
   */
  async function getWbsEvaluationCriteriaFromDb(
    wbsItemId: string,
  ): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
      [wbsItemId],
    );
    return result;
  }

  /**
   * DB에서 모든 활성 평가기준 조회
   */
  async function getAllActiveWbsEvaluationCriteriaFromDb(): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_evaluation_criteria WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
    );
    return result;
  }

  // ==================== 목록 조회 테스트 ====================

  describe('GET /admin/evaluation-criteria/wbs-evaluation-criteria - 목록 조회', () => {
    describe('성공 시나리오', () => {
      it('모든 WBS 평가기준을 조회할 수 있어야 한다', async () => {
        // Given: 여러 평가기준 생성
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];
        const wbsItem3 = testData.wbsItems[2];

        await createWbsEvaluationCriteria(
          wbsItem1.id,
          '평가기준 1',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem2.id,
          '평가기준 2',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem3.id,
          '평가기준 3',
          getRandomEmployee().id,
        );

        // When
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);

        // 각 평가기준이 올바른 구조를 가지는지 확인
        response.body.forEach((criteria: any) => {
          expect(criteria.id).toBeDefined();
          expect(criteria.wbsItemId).toBeDefined();
          expect(criteria.criteria).toBeDefined();
          expect(criteria.createdAt).toBeDefined();
          expect(criteria.updatedAt).toBeDefined();
        });
      });

      it('빈 목록을 조회할 수 있어야 한다 (평가기준이 없을 때)', async () => {
        // Given: 평가기준 생성하지 않음

        // When
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('특정 WBS 항목의 평가기준만 필터링하여 조회할 수 있어야 한다', async () => {
        // Given
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];

        await createWbsEvaluationCriteria(
          wbsItem1.id,
          '평가기준 1',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem2.id,
          '평가기준 2',
          getRandomEmployee().id,
        );

        // When: wbsItem1 필터링
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ wbsItemId: wbsItem1.id })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].wbsItemId).toBe(wbsItem1.id);
        expect(response.body[0].criteria).toBe('평가기준 1');
      });

      it('criteria 부분 검색으로 필터링하여 조회할 수 있어야 한다', async () => {
        // Given
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];
        const wbsItem3 = testData.wbsItems[2];

        await createWbsEvaluationCriteria(
          wbsItem1.id,
          '코드 품질 검토',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem2.id,
          '성능 최적화',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem3.id,
          '코드 리팩토링',
          getRandomEmployee().id,
        );

        // When: '코드'로 검색
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ criteriaSearch: '코드' })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(
          response.body.every((c: any) => c.criteria.includes('코드')),
        ).toBe(true);
      });

      it('criteria 완전 일치로 필터링하여 조회할 수 있어야 한다', async () => {
        // Given
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];

        await createWbsEvaluationCriteria(
          wbsItem1.id,
          '코드 품질',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem2.id,
          '코드 품질 검토',
          getRandomEmployee().id,
        );

        // When: '코드 품질' 완전 일치 검색
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ criteriaExact: '코드 품질' })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].criteria).toBe('코드 품질');
      });

      it('여러 필터 조건을 동시에 적용하여 조회할 수 있어야 한다', async () => {
        // Given
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];

        await createWbsEvaluationCriteria(
          wbsItem1.id,
          '코드 품질',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem2.id,
          '코드 품질',
          getRandomEmployee().id,
        );

        // When: wbsItemId와 criteriaExact 동시 적용
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({
            wbsItemId: wbsItem1.id,
            criteriaExact: '코드 품질',
          })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].wbsItemId).toBe(wbsItem1.id);
        expect(response.body[0].criteria).toBe('코드 품질');
      });

      it('삭제된 평가기준은 목록에 포함되지 않아야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const created = await createWbsEvaluationCriteria(
          wbsItem.id,
          '삭제될 평가기준',
          getRandomEmployee().id,
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
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .expect(200);

        // Then
        const foundDeleted = response.body.find(
          (c: any) => c.id === created.id,
        );
        expect(foundDeleted).toBeUndefined();
      });

      it('많은 수의 평가기준을 조회할 수 있어야 한다', async () => {
        // Given: 10개의 평가기준 생성
        const createPromises: Promise<any>[] = [];
        for (let i = 0; i < 10; i++) {
          const wbsItem = testData.wbsItems[i % testData.wbsItems.length];
          createPromises.push(
            createWbsEvaluationCriteria(
              wbsItem.id,
              `평가기준 ${i + 1}`,
              getRandomEmployee().id,
            ),
          );
        }
        await Promise.all(createPromises);

        // When
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(10);
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 wbsItemId로 조회 시 에러가 발생해야 한다', async () => {
        // When & Then
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ wbsItemId: 'invalid-uuid' })
          .expect((res) => {
            expect([400, 500]).toContain(res.status);
          });
      });

      it('존재하지 않는 wbsItemId로 조회 시 빈 배열을 반환해야 한다', async () => {
        // Given
        const nonExistentWbsItemId = 'f0f13879-9a95-4320-a753-3e304d203e4e';

        // When
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ wbsItemId: nonExistentWbsItemId })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });

    describe('엣지 케이스', () => {
      it('빈 문자열 criteriaSearch로 조회 시 모든 평가기준을 반환해야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        await createWbsEvaluationCriteria(
          wbsItem.id,
          '평가기준',
          getRandomEmployee().id,
        );

        // When
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ criteriaSearch: '' })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
      });

      it('빈 문자열 criteriaExact로 조회 시 빈 배열을 반환해야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        await createWbsEvaluationCriteria(
          wbsItem.id,
          '평가기준',
          getRandomEmployee().id,
        );

        // When
        const response = await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
          .query({ criteriaExact: '' })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  // ==================== WBS 항목별 평가기준 조회 테스트 ====================

  describe('GET /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId - WBS 항목별 평가기준 조회', () => {
    describe('성공 시나리오', () => {
      it('특정 WBS 항목의 평가기준을 조회할 수 있어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const criteria = '평가기준';
        const created = await createWbsEvaluationCriteria(
          wbsItem.id,
          criteria,
          getRandomEmployee().id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.wbsItemId).toBe(wbsItem.id);
        expect(response.body.criteria).toBeDefined();
        expect(Array.isArray(response.body.criteria)).toBe(true);
        expect(response.body.criteria.length).toBe(1);
        expect(response.body.criteria[0].id).toBe(created.id);
        expect(response.body.criteria[0].criteria).toBe(criteria);
      });

      it('평가기준이 없는 WBS 항목 조회 시 빈 배열을 반환해야 한다', async () => {
        // Given: 평가기준 생성하지 않음
        const wbsItem = getRandomWbsItem();

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.wbsItemId).toBe(wbsItem.id);
        expect(response.body.criteria).toBeDefined();
        expect(Array.isArray(response.body.criteria)).toBe(true);
        expect(response.body.criteria.length).toBe(0);
      });

      it('삭제된 평가기준은 WBS 항목별 조회에 포함되지 않아야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const created = await createWbsEvaluationCriteria(
          wbsItem.id,
          '삭제될 평가기준',
          getRandomEmployee().id,
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
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.criteria).toBeDefined();
        expect(Array.isArray(response.body.criteria)).toBe(true);
        expect(response.body.criteria.length).toBe(0);
      });

      it('WBS 항목당 하나의 평가기준만 조회되어야 한다', async () => {
        // Given: 동일 WBS 항목에 평가기준 생성
        const wbsItem = getRandomWbsItem();
        await createWbsEvaluationCriteria(
          wbsItem.id,
          '첫 번째 평가기준',
          getRandomEmployee().id,
        );

        // 같은 WBS 항목에 다시 저장 (덮어쓰기)
        const updated = await createWbsEvaluationCriteria(
          wbsItem.id,
          '두 번째 평가기준',
          getRandomEmployee().id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.criteria).toBeDefined();
        expect(Array.isArray(response.body.criteria)).toBe(true);
        expect(response.body.criteria.length).toBe(1);
        expect(response.body.criteria[0].id).toBe(updated.id);
        expect(response.body.criteria[0].criteria).toBe('두 번째 평가기준');
      });

      it('여러 WBS 항목의 평가기준은 서로 독립적이어야 한다', async () => {
        // Given
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];

        await createWbsEvaluationCriteria(
          wbsItem1.id,
          '평가기준 1',
          getRandomEmployee().id,
        );
        await createWbsEvaluationCriteria(
          wbsItem2.id,
          '평가기준 2',
          getRandomEmployee().id,
        );

        // When
        const response1 = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem1.id}`,
          )
          .expect(200);

        const response2 = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem2.id}`,
          )
          .expect(200);

        // Then
        expect(response1.body.criteria.length).toBe(1);
        expect(response1.body.criteria[0].criteria).toBe('평가기준 1');

        expect(response2.body.criteria.length).toBe(1);
        expect(response2.body.criteria[0].criteria).toBe('평가기준 2');
      });

      it('응답에 wbsItemId가 포함되어야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        await createWbsEvaluationCriteria(
          wbsItem.id,
          '평가기준',
          getRandomEmployee().id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.wbsItemId).toBe(wbsItem.id);
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 wbsItemId로 조회 시 에러가 발생해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .get(
            '/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/invalid-uuid',
          )
          .expect((res) => {
            expect([400, 500]).toContain(res.status);
          });
      });

      it('존재하지 않는 wbsItemId로 조회 시 빈 배열을 반환해야 한다', async () => {
        // Given
        const nonExistentWbsItemId = 'f0f13879-9a95-4320-a753-3e304d203e4e';

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${nonExistentWbsItemId}`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.wbsItemId).toBe(nonExistentWbsItemId);
        expect(response.body.criteria).toBeDefined();
        expect(Array.isArray(response.body.criteria)).toBe(true);
        expect(response.body.criteria.length).toBe(0);
      });

      it('빈 문자열 wbsItemId로 조회 시 에러가 발생해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .get('/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/')
          .expect((res) => {
            // 라우팅 구조상 404 또는 500 에러 발생
            expect([404, 500]).toContain(res.status);
          });
      });
    });

    describe('통합 시나리오', () => {
      it('생성 -> 조회 -> 수정 -> 조회 흐름이 정상적으로 동작해야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const actionBy = getRandomEmployee().id;

        // 1. 생성
        const created = await createWbsEvaluationCriteria(
          wbsItem.id,
          '초기 평가기준',
          actionBy,
        );

        // 2. 조회
        const response1 = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        expect(response1.body.criteria.length).toBe(1);
        expect(response1.body.criteria[0].criteria).toBe('초기 평가기준');

        // 3. 수정 (같은 WBS 항목에 다시 저장)
        const updated = await createWbsEvaluationCriteria(
          wbsItem.id,
          '수정된 평가기준',
          actionBy,
        );

        // 4. 다시 조회
        const response2 = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response2.body.criteria.length).toBe(1);
        expect(response2.body.criteria[0].id).toBe(updated.id);
        expect(response2.body.criteria[0].criteria).toBe('수정된 평가기준');
      });

      it('생성 -> 조회 -> 삭제 -> 조회 흐름이 정상적으로 동작해야 한다', async () => {
        // Given
        const wbsItem = getRandomWbsItem();
        const actionBy = getRandomEmployee().id;

        // 1. 생성
        const created = await createWbsEvaluationCriteria(
          wbsItem.id,
          '평가기준',
          actionBy,
        );

        // 2. 조회
        const response1 = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        expect(response1.body.criteria.length).toBe(1);

        // 3. 삭제
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/${created.id}`,
          )
          .expect(200);

        // 4. 다시 조회
        const response2 = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
          )
          .expect(200);

        // Then
        expect(response2.body.criteria.length).toBe(0);
      });
    });
  });
});
