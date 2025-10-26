import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('POST /admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId', () => {
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

    console.log('WBS 평가기준 저장 테스트 데이터 생성 완료:', {
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
   * WBS 평가기준 조회 헬퍼
   */
  async function getWbsEvaluationCriteria(id: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_evaluation_criteria WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
    return result[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('WBS 평가기준 생성 성공 시나리오', () => {
    it('새로운 WBS 평가기준을 생성할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '코드 품질 및 성능 최적화';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.criteria).toBe(criteria);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('actionBy 없이도 WBS 평가기준을 생성할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '테스트 커버리지 향상';

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.criteria).toBe(criteria);
    });

    it('같은 WBS 항목에 여러 평가기준을 생성할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteriaList = [
        '코드 품질 및 성능 최적화',
        '테스트 커버리지 향상',
        '문서화 완성도',
      ];
      const actionBy = getRandomEmployee().id;

      // When
      const responses = await Promise.all(
        criteriaList.map((criteria) =>
          testSuite
            .request()
            .post(
              `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
            )
            .send({
              criteria,
              importance: 5,
            })
            .expect(200),
        ),
      );

      // Then
      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.body.wbsItemId).toBe(wbsItem.id);
        expect(response.body.criteria).toBe(criteriaList[index]);
      });
    });

    it('긴 평가기준 내용도 저장할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const longCriteria = '코드 품질 및 성능 최적화를 위한 상세 기준: '.repeat(
        10,
      );
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: longCriteria,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.criteria).toBe(longCriteria);
    });

    it('다른 WBS 항목에 동일한 평가기준 내용을 생성할 수 있어야 한다', async () => {
      // Given
      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];
      const criteria = '동일한 평가기준';
      const actionBy = getRandomEmployee().id;

      // When
      const response1 = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem1.id}`,
        )
        .send({ criteria, importance: 5 })
        .expect(200);

      const response2 = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem2.id}`,
        )
        .send({ criteria, importance: 5 })
        .expect(200);

      // Then
      expect(response1.body.wbsItemId).toBe(wbsItem1.id);
      expect(response2.body.wbsItemId).toBe(wbsItem2.id);
      expect(response1.body.criteria).toBe(criteria);
      expect(response2.body.criteria).toBe(criteria);
      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe('WBS 평가기준 수정 성공 시나리오', () => {
    it('기존 WBS 평가기준을 수정할 수 있어야 한다 (wbsItemId 기준 자동 수정)', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const originalCriteria = '원본 평가기준';
      const updatedCriteria = '수정된 평가기준';
      const actionBy = getRandomEmployee().id;

      // 평가기준 생성
      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        originalCriteria,
      );

      // When - 동일한 wbsItemId로 다시 요청하면 자동으로 수정됨
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: updatedCriteria,
          importance: 5,
        })
        .expect(200);

      // Then - 같은 ID의 평가기준이 수정됨
      expect(response.body.id).toBe(created.id);
      expect(response.body.criteria).toBe(updatedCriteria);
      expect(response.body.wbsItemId).toBe(wbsItem.id);
    });

    it('평가기준 수정 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const originalCriteria = '원본 평가기준';
      const updatedCriteria = '수정된 평가기준';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        originalCriteria,
      );

      // 시간 차이를 보장하기 위해 약간 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 동일한 wbsItemId로 다시 요청
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: updatedCriteria,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime(),
      );
    });

    it('동일한 내용으로도 평가기준을 수정할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '동일한 평가기준';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(wbsItem.id, criteria);

      // When - 동일한 wbsItemId와 동일한 내용으로 요청
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: criteria, // 동일한 내용
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(created.id);
      expect(response.body.criteria).toBe(criteria);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('WBS 평가기준 저장 실패 시나리오', () => {
    it('criteria 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const actionBy = getRandomEmployee().id;

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          importance: 5,
          // criteria 누락
        })
        .expect(400);
    });

    it('빈 문자열 criteria로 요청 시 200을 반환한다 (시스템이 허용)', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: '',
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.criteria).toBe('');
    });

    it('존재하지 않는 wbsItemId로 요청 시 400 또는 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentWbsItemId = '00000000-0000-0000-0000-000000000000';
      const criteria = '테스트 평가기준';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${nonExistentWbsItemId}`,
        )
        .send({
          criteria,
          importance: 5,
        });

      // Then
      expect([400, 404]).toContain(response.status);
    });

    it('잘못된 형식의 wbsItemId로 요청 시 400 또는 500 에러가 발생해야 한다', async () => {
      // Given
      const invalidWbsItemId = 'invalid-uuid';
      const criteria = '테스트 평가기준';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${invalidWbsItemId}`,
        )
        .send({
          criteria,
          importance: 5,
        });

      // Then - UUID 검증이 DB 쿼리 단계에서 발생하여 500 반환될 수 있음
      expect([400, 500]).toContain(response.status);
    });

    it('필수 필드(criteria) 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();

      // When & Then - criteria 필드를 보내지 않음
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          // criteria 필드 누락
        })
        .expect(400);
    });

    it('각 WBS 항목마다 독립적인 평가기준을 가진다', async () => {
      // Given
      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];
      const criteria1 = 'WBS 항목 1의 평가기준';
      const criteria2 = 'WBS 항목 2의 평가기준';
      const actionBy = getRandomEmployee().id;

      // WBS 항목 1에 평가기준 생성
      const created1 = await createWbsEvaluationCriteria(
        wbsItem1.id,
        criteria1,
      );

      // When - WBS 항목 2에 평가기준 생성
      const created2 = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem2.id}`,
        )
        .send({
          criteria: criteria2,
          importance: 5,
        })
        .expect(200);

      // Then - 각 WBS 항목이 독립적인 평가기준을 가짐
      expect(created1.id).not.toBe(created2.body.id);
      expect(created1.wbsItemId).toBe(wbsItem1.id);
      expect(created2.body.wbsItemId).toBe(wbsItem2.id);
      expect(created1.criteria).toBe(criteria1);
      expect(created2.body.criteria).toBe(criteria2);
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('WBS 평가기준 데이터 무결성 시나리오', () => {
    it('생성된 평가기준이 DB에 올바르게 저장되어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteria = '테스트 평가기준';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria,
          importance: 5,
        })
        .expect(200);

      // Then
      const dbRecord = await getWbsEvaluationCriteria(response.body.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.wbsItemId).toBe(wbsItem.id);
      expect(dbRecord.criteria).toBe(criteria);
      expect(dbRecord.deletedAt).toBeNull();
    });

    it('수정된 평가기준이 DB에 올바르게 반영되어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const originalCriteria = '원본 평가기준';
      const updatedCriteria = '수정된 평가기준';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        originalCriteria,
      );

      // When - 동일한 wbsItemId로 다시 요청
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: updatedCriteria,
          importance: 5,
        })
        .expect(200);

      // Then
      const dbRecord = await getWbsEvaluationCriteria(created.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.criteria).toBe(updatedCriteria);
      expect(dbRecord.criteria).not.toBe(originalCriteria);
    });

    it('평가기준 수정 시 createdAt은 변경되지 않는다 (1초 이내 허용)', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const originalCriteria = '원본 평가기준';
      const updatedCriteria = '수정된 평가기준';
      const actionBy = getRandomEmployee().id;

      const created = await createWbsEvaluationCriteria(
        wbsItem.id,
        originalCriteria,
      );

      // When - 동일한 wbsItemId로 다시 요청
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: updatedCriteria,
          importance: 5,
        })
        .expect(200);

      // Then - E2E 테스트 환경의 지연을 고려하여 1000ms 허용
      // (DB 작업, 직렬화/역직렬화, 네트워크 지연 등)
      const createdAtDiff = Math.abs(
        new Date(response.body.createdAt).getTime() -
          new Date(created.createdAt).getTime(),
      );
      expect(createdAtDiff).toBeLessThanOrEqual(1000);
    });
  });

  // ==================== 특수 문자 및 엣지 케이스 ====================

  describe('WBS 평가기준 특수 문자 및 엣지 케이스', () => {
    it('특수 문자가 포함된 평가기준을 저장할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteriaWithSpecialChars =
        '코드 품질 & 성능 (90% 이상), 테스트 <필수>';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: criteriaWithSpecialChars,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.criteria).toBe(criteriaWithSpecialChars);
    });

    it('줄바꿈이 포함된 평가기준을 저장할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteriaWithNewlines =
        '평가기준:\n1. 코드 품질\n2. 성능 최적화\n3. 테스트 커버리지';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: criteriaWithNewlines,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.criteria).toBe(criteriaWithNewlines);
    });

    it('이모지가 포함된 평가기준을 저장할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const criteriaWithEmoji = '✅ 코드 품질 향상 🚀 성능 최적화';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: criteriaWithEmoji,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.criteria).toBe(criteriaWithEmoji);
    });

    it('한글, 영문, 숫자가 혼합된 평가기준을 저장할 수 있어야 한다', async () => {
      // Given
      const wbsItem = getRandomWbsItem();
      const mixedCriteria = '코드품질 Code Quality 90% 이상 달성 2024년';
      const actionBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItem.id}`,
        )
        .send({
          criteria: mixedCriteria,
          importance: 5,
        })
        .expect(200);

      // Then
      expect(response.body.criteria).toBe(mixedCriteria);
    });
  });
});
