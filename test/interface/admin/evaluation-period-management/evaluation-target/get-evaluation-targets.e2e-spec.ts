import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가 대상자 조회 테스트', () => {
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

    console.log('평가 대상자 조회 테스트 데이터 생성 완료:', {
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
   * 평가 대상자 제외
   */
  async function excludeEvaluationTarget(
    evaluationPeriodId: string,
    employeeId: string,
    excludeReason: string = '제외 사유',
  ): Promise<any> {
    const response = await testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/exclude`,
      )
      .send({
        excludeReason,
        // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
      })
      .expect(200);

    return response.body;
  }

  // ==================== 평가기간의 평가 대상자 조회 테스트 ====================

  describe('GET /admin/evaluation-periods/:evaluationPeriodId/targets - 평가기간의 평가 대상자 조회', () => {
    describe('성공 케이스', () => {
      it('평가기간의 모든 평가 대상자를 조회할 수 있어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 3);

        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(Array.isArray(response.body.targets)).toBe(true);
        expect(response.body.targets.length).toBe(employees.length);

        response.body.targets.forEach((target: any) => {
          expect(target.id).toBeDefined();
          expect(target.evaluationPeriodId).toBeUndefined(); // 중복 제거됨
          expect(target.employeeId).toBeUndefined(); // 중복 제거됨
          expect(target.employee).toBeDefined();
          expect(target.employee.id).toBeDefined();
          expect(target.isExcluded).toBeDefined();
        });
      });

      it('includeExcluded=false 시 제외된 대상자가 포함되지 않아야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 4);

        // 모두 등록
        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // 일부 제외
        await excludeEvaluationTarget(period.id, employees[0].id);
        await excludeEvaluationTarget(period.id, employees[1].id);

        // When - includeExcluded를 전달하지 않으면 기본값 false 적용
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then - 제외되지 않은 2명만 반환
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.targets.length).toBe(2);
        response.body.targets.forEach((target: any) => {
          expect(target.isExcluded).toBe(false);
        });
      });

      it('includeExcluded=true 시 제외된 대상자도 포함되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 4);

        // 모두 등록
        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // 일부 제외
        await excludeEvaluationTarget(period.id, employees[0].id);
        await excludeEvaluationTarget(period.id, employees[1].id);

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets`)
          .query({ includeExcluded: 'true' })
          .expect(200);

        // Then - 모든 4명 반환
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.targets.length).toBe(4);

        const excludedCount = response.body.targets.filter(
          (target: any) => target.isExcluded,
        ).length;
        expect(excludedCount).toBe(2);
      });

      it('평가 대상자가 없는 경우 빈 배열이 반환되어야 한다', async () => {
        // Given - 등록하지 않음
        const period = getActivePeriod();

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(Array.isArray(response.body.targets)).toBe(true);
        expect(response.body.targets.length).toBe(0);
      });

      it('반환된 데이터에 필수 필드가 모두 포함되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee = testData.employees[0];
        await registerEvaluationTarget(period.id, employee.id);

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.targets.length).toBe(1);
        const target = response.body.targets[0];
        expect(target.id).toBeDefined();
        expect(target.evaluationPeriodId).toBeUndefined(); // 중복 제거됨
        expect(target.employeeId).toBeUndefined(); // 중복 제거됨
        expect(target.employee).toBeDefined();
        expect(target.employee.id).toBe(employee.id);
        expect(target.isExcluded).toBeDefined();
        expect(target.createdBy).toBeDefined();
        expect(target.createdAt).toBeDefined();
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 평가기간 ID로 요청 시 빈 배열이 반환되어야 한다', async () => {
        // Given
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${nonExistentPeriodId}/targets`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(nonExistentPeriodId);
        expect(Array.isArray(response.body.targets)).toBe(true);
        expect(response.body.targets.length).toBe(0);
      });

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .get(`/admin/evaluation-periods/${invalidPeriodId}/targets`)
          .expect(400);
      });
    });
  });

  // ==================== 제외된 평가 대상자 조회 테스트 ====================

  describe('GET /admin/evaluation-periods/:evaluationPeriodId/targets/excluded - 제외된 평가 대상자 조회', () => {
    describe('성공 케이스', () => {
      it('제외된 평가 대상자만 조회할 수 있어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 5);

        // 모두 등록
        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // 일부만 제외
        await excludeEvaluationTarget(period.id, employees[0].id);
        await excludeEvaluationTarget(period.id, employees[1].id);
        await excludeEvaluationTarget(period.id, employees[2].id);

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets/excluded`)
          .expect(200);

        // Then - 제외된 3명만 반환
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(Array.isArray(response.body.targets)).toBe(true);
        expect(response.body.targets.length).toBe(3);

        response.body.targets.forEach((target: any) => {
          expect(target.isExcluded).toBe(true);
          expect(target.excludeReason).toBeDefined();
          expect(target.excludedBy).toBeDefined();
          expect(target.excludedAt).toBeDefined();
        });
      });

      it('모든 대상자가 isExcluded=true 상태여야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 3);

        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
          await excludeEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets/excluded`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.targets.length).toBe(3);
        expect(
          response.body.targets.every((target: any) => target.isExcluded),
        ).toBe(true);
      });

      it('제외된 대상자가 없는 경우 빈 배열이 반환되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employees = testData.employees.slice(0, 3);

        // 등록만 하고 제외하지 않음
        for (const employee of employees) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets/excluded`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(Array.isArray(response.body.targets)).toBe(true);
        expect(response.body.targets.length).toBe(0);
      });

      it('제외 정보가 올바르게 반환되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee = testData.employees[0];
        const testUserId = '00000000-0000-0000-0000-000000000001';
        const excludeReason = '특정 제외 사유';

        await registerEvaluationTarget(period.id, employee.id);
        await excludeEvaluationTarget(period.id, employee.id, excludeReason);

        // When
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${period.id}/targets/excluded`)
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.targets.length).toBe(1);
        expect(response.body.targets[0].excludeReason).toBe(excludeReason);
        expect(response.body.targets[0].excludedBy).toBe(testUserId); // 인증된 사용자가 제외 처리자로 설정됨
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 평가기간 ID로 요청 시 빈 배열이 반환되어야 한다', async () => {
        // Given
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/${nonExistentPeriodId}/targets/excluded`,
          )
          .expect(200);

        // Then
        expect(response.body.evaluationPeriodId).toBe(nonExistentPeriodId);
        expect(Array.isArray(response.body.targets)).toBe(true);
        expect(response.body.targets.length).toBe(0);
      });

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .get(`/admin/evaluation-periods/${invalidPeriodId}/targets/excluded`)
          .expect(400);
      });
    });
  });

  // ==================== 직원의 평가기간 맵핑 조회 테스트 ====================

  describe('GET /admin/evaluation-periods/employees/:employeeId/evaluation-periods - 직원의 평가기간 맵핑 조회', () => {
    describe('성공 케이스', () => {
      it('직원이 등록된 모든 평가기간 맵핑을 조회할 수 있어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const periods = testData.periods.slice(0, 3);

        for (const period of periods) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/employees/${employee.id}/evaluation-periods`,
          )
          .expect(200);

        // Then
        expect(response.body.employee).toBeDefined();
        expect(response.body.employee.id).toBe(employee.id);
        expect(Array.isArray(response.body.mappings)).toBe(true);
        expect(response.body.mappings.length).toBe(periods.length);

        response.body.mappings.forEach((mapping: any) => {
          expect(mapping.evaluationPeriodId).toBeDefined();
          expect(mapping.id).toBeDefined();
          expect(mapping.employeeId).toBeUndefined(); // 중복 제거됨
        });
      });

      it('여러 평가기간에 등록된 경우 모두 반환되어야 한다', async () => {
        // Given
        const employee = testData.employees[1];
        const allPeriods = testData.periods;

        for (const period of allPeriods) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/employees/${employee.id}/evaluation-periods`,
          )
          .expect(200);

        // Then
        expect(response.body.employee).toBeDefined();
        expect(response.body.employee.id).toBe(employee.id);
        expect(response.body.mappings.length).toBe(allPeriods.length);
      });

      it('등록된 평가기간이 없는 경우 빈 배열이 반환되어야 한다', async () => {
        // Given - 등록하지 않음
        const employee = testData.employees[0];

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/employees/${employee.id}/evaluation-periods`,
          )
          .expect(200);

        // Then
        expect(response.body.employee).toBeDefined();
        expect(response.body.employee.id).toBe(employee.id);
        expect(Array.isArray(response.body.mappings)).toBe(true);
        expect(response.body.mappings.length).toBe(0);
      });

      it('제외된 평가기간 맵핑도 조회되어야 한다', async () => {
        // Given
        const employee = testData.employees[2];
        const periods = testData.periods.slice(0, 2);

        for (const period of periods) {
          await registerEvaluationTarget(period.id, employee.id);
        }

        // 일부 제외
        await excludeEvaluationTarget(periods[0].id, employee.id);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/employees/${employee.id}/evaluation-periods`,
          )
          .expect(200);

        // Then - 제외된 것도 포함하여 모두 반환
        expect(response.body.employee).toBeDefined();
        expect(response.body.employee.id).toBe(employee.id);
        expect(response.body.mappings.length).toBe(periods.length);

        const excludedMapping = response.body.mappings.find(
          (m: any) => m.evaluationPeriodId === periods[0].id,
        );
        expect(excludedMapping.isExcluded).toBe(true);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 직원 ID로 요청 시 빈 배열이 반환되어야 한다', async () => {
        // Given
        const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/employees/${nonExistentEmployeeId}/evaluation-periods`,
          )
          .expect(200);

        // Then
        expect(response.body.employee).toBeDefined();
        expect(response.body.employee.id).toBe(nonExistentEmployeeId);
        expect(Array.isArray(response.body.mappings)).toBe(true);
        expect(response.body.mappings.length).toBe(0);
      });

      it('잘못된 UUID 형식의 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidEmployeeId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/employees/${invalidEmployeeId}/evaluation-periods`,
          )
          .expect(400);
      });
    });
  });

  // ==================== 평가 대상 여부 확인 테스트 ====================

  describe('GET /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId/check - 평가 대상 여부 확인', () => {
    describe('성공 케이스', () => {
      it('등록된 평가 대상자인 경우 true를 반환해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee = testData.employees[0];
        await registerEvaluationTarget(period.id, employee.id);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/check`,
          )
          .expect(200);

        // Then
        expect(response.body.isEvaluationTarget).toBe(true);
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.employeeId).toBe(employee.id);
      });

      it('제외된 대상자인 경우 false를 반환해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee = testData.employees[1];
        await registerEvaluationTarget(period.id, employee.id);
        await excludeEvaluationTarget(period.id, employee.id);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/check`,
          )
          .expect(200);

        // Then
        expect(response.body.isEvaluationTarget).toBe(false);
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.employeeId).toBe(employee.id);
      });

      it('등록되지 않은 경우 false를 반환해야 한다', async () => {
        // Given - 등록하지 않음
        const period = getActivePeriod();
        const employee = testData.employees[2];

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/check`,
          )
          .expect(200);

        // Then
        expect(response.body.isEvaluationTarget).toBe(false);
      });

      it('포함 -> 제외 -> 다시 포함 시 true를 반환해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee = testData.employees[3];

        await registerEvaluationTarget(period.id, employee.id);
        await excludeEvaluationTarget(period.id, employee.id);

        // 다시 포함
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({ updatedBy: 'admin-user-id' })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/check`,
          )
          .expect(200);

        // Then
        expect(response.body.isEvaluationTarget).toBe(true);
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/evaluation-periods/${invalidPeriodId}/targets/${employee.id}/check`,
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
          .get(
            `/admin/evaluation-periods/${period.id}/targets/${invalidEmployeeId}/check`,
          )
          .expect(400);
      });
    });
  });
});
