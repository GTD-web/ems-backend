import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가 대상자 등록 해제 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
    periods: EvaluationPeriodDto[];
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
    const { employees, periods } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      employees,
      periods,
    };

    console.log('평가 대상자 등록 해제 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.periods.length,
    });
  });

  afterEach(async () => {
    if (testContextService) {
      await testContextService.테스트_데이터를_정리한다();
    }
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

  function getActivePeriod(): EvaluationPeriodDto {
    return (
      testData.periods.find((p) => p.status === 'in-progress') ||
      testData.periods[0]
    );
  }

  /**
   * 평가 대상자를 먼저 등록
   */
  async function registerEvaluationTarget(
    evaluationPeriodId: string,
    employeeId: string,
    createdBy: string = 'admin-user-id',
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .send({ createdBy })
      .expect(201);

    return response.body;
  }

  /**
   * DB에서 평가 대상자 맵핑 조회 (소프트 삭제 포함)
   */
  async function getEvaluationTargetMappingFromDb(
    evaluationPeriodId: string,
    employeeId: string,
    includeDeleted: boolean = false,
  ): Promise<any> {
    const whereClause = includeDeleted
      ? `WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2`
      : `WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`;

    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_period_employee_mapping ${whereClause}`,
      [evaluationPeriodId, employeeId],
    );
    return result[0];
  }

  /**
   * DB에서 평가기간의 모든 평가 대상자 조회
   */
  async function getAllTargetMappingsFromDb(
    evaluationPeriodId: string,
    includeDeleted: boolean = false,
  ): Promise<any[]> {
    const whereClause = includeDeleted
      ? `WHERE "evaluationPeriodId" = $1`
      : `WHERE "evaluationPeriodId" = $1 AND "deletedAt" IS NULL`;

    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_period_employee_mapping ${whereClause} ORDER BY "createdAt" ASC`,
      [evaluationPeriodId],
    );
    return result;
  }

  // ==================== 단일 평가 대상자 등록 해제 테스트 ====================

  describe('DELETE /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId - 평가 대상자 등록 해제', () => {
    describe('성공 케이스', () => {
      it('등록된 평가 대상자를 성공적으로 해제할 수 있어야 한다', async () => {
        // Given - 먼저 평가 대상자 등록
        const employee = testData.employees[0];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // When
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.success).toBe(true);
      });

      it('해제 후 조회 시 해당 맵핑이 조회되지 않아야 한다', async () => {
        // Given
        const employee = testData.employees[1];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // When - 등록 해제
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(200);

        // Then - 조회 시 결과 없음
        const dbMapping = await getEvaluationTargetMappingFromDb(
          period.id,
          employee.id,
          false, // 삭제된 항목 제외
        );
        expect(dbMapping).toBeUndefined();
      });

      it('소프트 삭제로 동작하여 deletedAt이 설정되어야 한다', async () => {
        // Given
        const employee = testData.employees[2];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // When
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(200);

        // Then - deletedAt 확인 (삭제된 항목 포함하여 조회)
        const dbMapping = await getEvaluationTargetMappingFromDb(
          period.id,
          employee.id,
          true, // 삭제된 항목 포함
        );
        expect(dbMapping).toBeDefined();
        expect(dbMapping.deletedAt).not.toBeNull();
      });

      it('제외된 대상자도 등록 해제할 수 있어야 한다', async () => {
        // Given - 등록 후 제외
        const employee = testData.employees[3];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '제외',
            excludedBy: 'admin-user-id',
          })
          .expect(200);

        // When - 등록 해제
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.success).toBe(true);
      });
    });

    describe('실패 케이스', () => {
      it('등록되지 않은 평가 대상자를 해제하려고 하면 404 에러가 발생해야 한다', async () => {
        // Given - 등록하지 않음
        const employee = testData.employees[0];
        const period = getActivePeriod();

        // When & Then
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(404);
      });

      it('이미 해제된 대상자를 다시 해제하려고 하면 404 에러가 발생해야 한다', async () => {
        // Given - 등록 후 해제
        const employee = testData.employees[1];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(200);

        // When & Then - 재해제 시도
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}`,
          )
          .expect(404);
      });

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${invalidPeriodId}/targets/${employee.id}`,
          )
          .expect(400);
      });

      it('잘못된 UUID 형식의 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const invalidEmployeeId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${invalidEmployeeId}`,
          )
          .expect(400);
      });
    });
  });

  // ==================== 모든 평가 대상자 등록 해제 테스트 ====================

  describe('DELETE /admin/evaluation-periods/:evaluationPeriodId/targets - 평가기간의 모든 대상자 등록 해제', () => {
    describe('성공 케이스', () => {
      it('평가기간의 모든 대상자를 성공적으로 해제할 수 있어야 한다', async () => {
        // Given - 여러 대상자 등록
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 3);

        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.deletedCount).toBe(employees.length);
      });

      it('해제된 대상자 수가 올바르게 반환되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const allEmployees = testData.employees;

        for (const employee of allEmployees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then
        expect(response.body.deletedCount).toBe(allEmployees.length);

        // DB 확인 - 삭제되지 않은 항목이 없어야 함
        const remainingMappings = await getAllTargetMappingsFromDb(
          period.id,
          false,
        );
        expect(remainingMappings.length).toBe(0);
      });

      it('대상자가 없는 경우 0이 반환되어야 한다', async () => {
        // Given - 등록하지 않음
        const period = getActivePeriod();

        // When
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then
        expect(response.body.deletedCount).toBe(0);
      });

      it('제외된 대상자도 함께 해제되어야 한다', async () => {
        // Given - 일부는 제외 상태
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 4);

        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // 일부 제외 처리
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employees[0].id}/exclude`,
          )
          .send({
            excludeReason: '제외',
            excludedBy: 'admin-user-id',
          })
          .expect(200);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employees[1].id}/exclude`,
          )
          .send({
            excludeReason: '제외',
            excludedBy: 'admin-user-id',
          })
          .expect(200);

        // When - 모두 해제
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then - 제외된 것도 포함해서 모두 해제됨
        expect(response.body.deletedCount).toBe(employees.length);
      });

      it('일부 대상자가 이미 해제된 경우 나머지만 해제되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 5);

        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // 일부 미리 해제
        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employees[0].id}`,
          )
          .expect(200);

        await testSuite
          .request()
          .delete(
            `/admin/evaluation-periods/${period.id}/targets/${employees[1].id}`,
          )
          .expect(200);

        // When - 모두 해제
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then - 남은 3개만 해제됨
        expect(response.body.deletedCount).toBe(3);
      });

      it('다른 평가기간의 대상자는 해제되지 않아야 한다', async () => {
        // Given
        const period1 = testData.periods[0];
        const period2 = testData.periods[1];
        const employees = testData.employees.slice(0, 3);

        // 두 평가기간에 동일한 직원들 등록
        for (const employee of employees) {
          await registerEvaluationTarget(period1.id, employee.id);
          await registerEvaluationTarget(period2.id, employee.id);
        }

        // When - period1의 대상자만 해제
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period1.id}/targets`)
          .expect(200);

        // Then
        expect(response.body.deletedCount).toBe(employees.length);

        // period2의 대상자는 유지됨
        const period2Mappings = await getAllTargetMappingsFromDb(
          period2.id,
          false,
        );
        expect(period2Mappings.length).toBe(employees.length);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 평가기간 ID로 요청 시 0이 반환되어야 한다', async () => {
        // Given
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

        // When
        const response = await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${nonExistentPeriodId}/targets`)
          .expect(200);

        // Then
        expect(response.body.deletedCount).toBe(0);
      });

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${invalidPeriodId}/targets`)
          .expect(400);
      });
    });
  });
});
