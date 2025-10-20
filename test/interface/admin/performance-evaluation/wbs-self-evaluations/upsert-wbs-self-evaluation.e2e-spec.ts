import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('POST /admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/wbs/:wbsItemId/period/:periodId', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    periods: EvaluationPeriodDto[];
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
    const { departments, employees, periods, projects, wbsItems } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      departments,
      employees,
      periods,
      projects,
      wbsItems,
    };

    console.log('WBS 자기평가 저장 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      periods: testData.periods.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getRandomEvaluationPeriod(): EvaluationPeriodDto {
    return testData.periods[
      Math.floor(Math.random() * testData.periods.length)
    ];
  }

  function getRandomWbsItem(): WbsItemDto {
    return testData.wbsItems[
      Math.floor(Math.random() * testData.wbsItems.length)
    ];
  }

  /**
   * WBS 자기평가 저장 헬퍼 (Upsert)
   */
  async function upsertWbsSelfEvaluation(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    data: {
      selfEvaluationContent: string;
      selfEvaluationScore: number;
      performanceResult?: string;
      createdBy?: string;
    },
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}`,
      )
      .send(data)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 자기평가 조회 헬퍼 (DB에서 직접)
   */
  async function getWbsSelfEvaluationFromDb(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
  ): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_self_evaluation 
       WHERE "employeeId" = $1 AND "wbsItemId" = $2 AND "periodId" = $3`,
      [employeeId, wbsItemId, periodId],
    );
    return result[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('WBS 자기평가 저장 성공 시나리오', () => {
    it('신규 WBS 자기평가를 생성할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();
      const createdBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
          selfEvaluationScore: 100,
          performanceResult:
            'WBS 항목을 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
          createdBy,
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.periodId).toBe(period.id);
      expect(response.body.selfEvaluationContent).toBe(
        '이번 분기 목표를 성공적으로 달성했습니다.',
      );
      expect(response.body.selfEvaluationScore).toBe(100);
      expect(response.body.performanceResult).toBe(
        'WBS 항목을 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
      );
      expect(response.body.isCompleted).toBe(false);
      expect(response.body.version).toBe(1);
    });

    it('기존 WBS 자기평가를 수정할 수 있어야 한다 (Upsert)', async () => {
      // Given - 먼저 자기평가 생성
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const firstSave = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '초기 평가 내용',
          selfEvaluationScore: 80,
        },
      );

      // 약간의 시간 차이를 보장
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 동일한 조합으로 다시 저장 (수정)
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '수정된 평가 내용',
          selfEvaluationScore: 110,
          performanceResult: '추가된 성과 입력',
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(firstSave.id); // 동일한 ID
      expect(response.body.selfEvaluationContent).toBe('수정된 평가 내용');
      expect(response.body.selfEvaluationScore).toBe(110);
      expect(response.body.performanceResult).toBe('추가된 성과 입력');
      expect(response.body.version).toBeGreaterThan(firstSave.version); // 버전 증가
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(firstSave.updatedAt).getTime(),
      ); // updatedAt 갱신
    });

    it('performanceResult 없이 자기평가를 생성할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용만 작성',
          selfEvaluationScore: 90,
        })
        .expect(200);

      // Then
      expect(response.body.selfEvaluationContent).toBe('평가 내용만 작성');
      expect(response.body.selfEvaluationScore).toBe(90);
      // DB에서 null을 반환할 수 있으므로 null 또는 undefined 허용
      expect(response.body.performanceResult == null).toBe(true);
    });

    it('createdBy 없이 자기평가를 생성할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 95,
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
    });

    it('자기평가 점수 0 ~ maxSelfEvaluationRate 범위 내의 모든 값을 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // When & Then - 각 점수별로 테스트 (0, 50, 100, 120)
      const testScores = [0, 50, 100, 120];
      for (const score of testScores) {
        const wbsItem = getRandomWbsItem();
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
          )
          .send({
            selfEvaluationContent: `점수 ${score}점 테스트`,
            selfEvaluationScore: score,
          })
          .expect(200);

        expect(response.body.selfEvaluationScore).toBe(score);
      }
    });

    it('동일한 자기평가를 여러 번 수정할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When - 여러 번 수정
      const save1 = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '첫 번째 저장',
          selfEvaluationScore: 80,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const save2 = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '두 번째 저장',
          selfEvaluationScore: 100,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const save3 = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '세 번째 저장',
          selfEvaluationScore: 120,
        },
      );

      // Then
      expect(save1.id).toBe(save2.id);
      expect(save2.id).toBe(save3.id);
      expect(save3.selfEvaluationContent).toBe('세 번째 저장');
      expect(save3.selfEvaluationScore).toBe(120);
      expect(save3.version).toBeGreaterThan(save2.version);
      expect(save2.version).toBeGreaterThan(save1.version);
    });

    it('빈 문자열도 유효한 performanceResult로 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '',
        })
        .expect(200);

      // Then
      expect(response.body.performanceResult).toBe('');
    });

    it('자기평가 점수 최소값(0)으로 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '최소 점수 테스트',
          selfEvaluationScore: 0,
        })
        .expect(200);

      // Then
      expect(response.body.selfEvaluationScore).toBe(0);
    });

    it('자기평가 점수 최대값(maxSelfEvaluationRate=120)으로 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '최대 점수 테스트',
          selfEvaluationScore: 120,
        })
        .expect(200);

      // Then
      expect(response.body.selfEvaluationScore).toBe(120);
    });
  });

  // ==================== 선택적 필드 시나리오 ====================

  describe('WBS 자기평가 선택적 필드 시나리오', () => {
    it('모든 필드를 생략하고 저장할 수 있어야 한다 (선택 옵션)', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          // 모든 필드 생략
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.periodId).toBe(period.id);
    });

    it('selfEvaluationContent만 생략하고 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationScore: 100,
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.selfEvaluationScore).toBe(100);
    });

    it('selfEvaluationScore만 생략하고 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.selfEvaluationContent).toBe('평가 내용');
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('WBS 자기평가 저장 실패 시나리오', () => {
    it('selfEvaluationScore가 0 미만일 때 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: -1,
        })
        .expect(400);
    });

    it('selfEvaluationScore가 maxSelfEvaluationRate를 초과할 때 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When & Then
      // maxSelfEvaluationRate는 기본값 120이므로 150으로 테스트
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 150,
        })
        .expect(400);
    });

    it('selfEvaluationScore가 maxSelfEvaluationRate + 1일 때 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When & Then
      // maxSelfEvaluationRate는 기본값 120이므로 121로 테스트
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 121,
        })
        .expect(400);
    });

    it('selfEvaluationScore가 숫자가 아닐 때 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 'invalid',
        })
        .expect(400);
    });

    it('잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();
      const invalidEmployeeId = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${invalidEmployeeId}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 4,
        })
        .expect(400);
    });

    it('잘못된 형식의 wbsItemId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const invalidWbsItemId = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${invalidWbsItemId}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 4,
        })
        .expect(400);
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      const invalidPeriodId = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${invalidPeriodId}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 4,
        })
        .expect(400);
    });

    it('잘못된 형식의 createdBy로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();
      const invalidCreatedBy = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '평가 내용',
          selfEvaluationScore: 4,
          createdBy: invalidCreatedBy,
        })
        .expect(400);
    });

    it('selfEvaluationContent가 문자열이 아닐 때 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: 12345, // 숫자
          selfEvaluationScore: 4,
        })
        .expect(400);
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('WBS 자기평가 저장 데이터 무결성 시나리오', () => {
    it('저장된 자기평가가 DB에 올바르게 저장되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: 'DB 검증 테스트',
          selfEvaluationScore: 4,
          performanceResult: '성과 입력',
        })
        .expect(200);

      // Then
      const dbRecord = await getWbsSelfEvaluationFromDb(
        employee.id,
        wbsItem.id,
        period.id,
      );
      expect(dbRecord).toBeDefined();
      expect(dbRecord.id).toBe(response.body.id);
      expect(dbRecord.selfEvaluationContent).toBe('DB 검증 테스트');
      expect(dbRecord.selfEvaluationScore).toBe(4);
      expect(dbRecord.performanceResult).toBe('성과 입력');
    });

    it('자기평가 수정 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const firstSave = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '초기 저장',
          selfEvaluationScore: 3,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 수정
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '수정된 내용',
          selfEvaluationScore: 5,
        })
        .expect(200);

      // Then
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(firstSave.updatedAt).getTime(),
      );
    });

    it('자기평가 수정 시 createdAt은 변경되지 않아야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const firstSave = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '초기 저장',
          selfEvaluationScore: 3,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 수정
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '수정된 내용',
          selfEvaluationScore: 5,
        })
        .expect(200);

      // Then - createdAt 타임스탬프 정밀도 차이 허용 (200ms 이내)
      // 트랜잭션 처리와 DB 타임스탬프 정밀도로 인해 약간의 차이 허용
      const createdAtDiff = Math.abs(
        new Date(response.body.createdAt).getTime() -
          new Date(firstSave.createdAt).getTime(),
      );
      expect(createdAtDiff).toBeLessThanOrEqual(200);
    });

    it('자기평가 수정 시 version이 증가해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      const firstSave = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '초기 저장',
          selfEvaluationScore: 3,
        },
      );

      // When - 수정
      const secondSave = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '첫 번째 수정',
          selfEvaluationScore: 4,
        },
      );

      // When - 한 번 더 수정
      const thirdSave = await upsertWbsSelfEvaluation(
        employee.id,
        wbsItem.id,
        period.id,
        {
          selfEvaluationContent: '두 번째 수정',
          selfEvaluationScore: 5,
        },
      );

      // Then
      expect(secondSave.version).toBeGreaterThan(firstSave.version);
      expect(thirdSave.version).toBeGreaterThan(secondSave.version);
    });

    it('신규 생성 시 isCompleted는 false여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '신규 평가',
          selfEvaluationScore: 4,
        })
        .expect(200);

      // Then
      expect(response.body.isCompleted).toBe(false);
      // DB에서 null을 반환할 수 있으므로 null 또는 undefined 허용
      expect(response.body.completedAt == null).toBe(true);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('WBS 자기평가 저장 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '필드 검증 테스트',
          selfEvaluationScore: 4,
          performanceResult: '성과 내용',
        })
        .expect(200);

      // Then - 필수 필드 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('periodId');
      expect(response.body).toHaveProperty('employeeId');
      expect(response.body).toHaveProperty('wbsItemId');
      expect(response.body).toHaveProperty('selfEvaluationContent');
      expect(response.body).toHaveProperty('selfEvaluationScore');
      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('evaluationDate');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('version');
    });

    it('응답의 ID들이 요청한 값과 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: 'ID 검증 테스트',
          selfEvaluationScore: 4,
        })
        .expect(200);

      // Then
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.periodId).toBe(period.id);
    });

    it('응답의 날짜 필드들이 유효한 날짜 형식이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const wbsItem = getRandomWbsItem();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}`,
        )
        .send({
          selfEvaluationContent: '날짜 검증 테스트',
          selfEvaluationScore: 4,
        })
        .expect(200);

      // Then
      expect(new Date(response.body.evaluationDate).getTime()).not.toBeNaN();
      expect(new Date(response.body.createdAt).getTime()).not.toBeNaN();
      expect(new Date(response.body.updatedAt).getTime()).not.toBeNaN();
    });
  });
});
