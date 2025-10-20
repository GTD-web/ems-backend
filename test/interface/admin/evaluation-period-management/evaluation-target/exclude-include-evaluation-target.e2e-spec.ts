import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가 대상자 제외/포함 테스트', () => {
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
    const { departments, employees, periods } =
      await testContextService.완전한_테스트환경을_생성한다();

    // 테스트용 인증 사용자 생성 (testSuite에서 사용하는 기본 사용자 ID)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const existingUser = await dataSource.manager.query(
      `SELECT id FROM employee WHERE id = $1`,
      [testUserId],
    );

    if (existingUser.length === 0) {
      await dataSource.manager.query(
        `INSERT INTO employee (id, "employeeNumber", name, email, "departmentId", status, "externalId", "externalCreatedAt", "externalUpdatedAt", version, "createdAt", "updatedAt")
         VALUES ($1, 'TEST-USER', '테스트 관리자', 'test@example.com', $2, '재직중', 'test-user-001', NOW(), NOW(), 1, NOW(), NOW())`,
        [testUserId, departments[0].id],
      );
    }

    testData = {
      employees,
      periods,
    };

    console.log('평가 대상자 제외/포함 테스트 데이터 생성 완료:', {
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
   *
   * Note: createdBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
   */
  async function registerEvaluationTarget(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .send({
        // createdBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
      })
      .expect(201);

    return response.body;
  }

  /**
   * DB에서 평가 대상자 맵핑 조회
   */
  async function getEvaluationTargetMappingFromDb(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_period_employee_mapping WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [evaluationPeriodId, employeeId],
    );
    return result[0];
  }

  // ==================== 평가 대상 제외 테스트 ====================

  describe('PATCH /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId/exclude - 평가 대상 제외', () => {
    describe('성공 케이스', () => {
      it('평가 대상자를 성공적으로 제외할 수 있어야 한다', async () => {
        // Given - 먼저 평가 대상자 등록
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const testUserId = '00000000-0000-0000-0000-000000000001';
        await registerEvaluationTarget(period.id, employee.id);

        const excludeReason = '퇴사 예정';

        // When
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason,
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.isExcluded).toBe(true);
        expect(response.body.excludeReason).toBe(excludeReason);
        expect(response.body.excludedBy).toBe(testUserId); // 인증된 사용자가 제외 처리자로 설정됨
        expect(response.body.excludedAt).toBeDefined();
      });

      it('제외 처리 후 isExcluded가 true로 변경되어야 한다', async () => {
        // Given
        const employee = testData.employees[1];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // When
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '장기 휴직',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then
        expect(response.body.isExcluded).toBe(true);
      });

      it('제외 사유와 제외 처리자 정보가 올바르게 저장되어야 한다', async () => {
        // Given
        const employee = testData.employees[2];
        const period = getActivePeriod();
        const testUserId = '00000000-0000-0000-0000-000000000001';
        await registerEvaluationTarget(period.id, employee.id);

        const excludeReason = '프로젝트 미참여';

        // When
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason,
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then - DB 확인
        const dbMapping = await getEvaluationTargetMappingFromDb(
          period.id,
          employee.id,
        );
        expect(dbMapping.isExcluded).toBe(true);
        expect(dbMapping.excludeReason).toBe(excludeReason);
        expect(dbMapping.excludedBy).toBe(testUserId); // 인증된 사용자가 제외 처리자로 설정됨
        expect(dbMapping.excludedAt).toBeDefined();
      });

      it('excludedAt 필드가 현재 시간으로 설정되어야 한다', async () => {
        // Given
        const employee = testData.employees[3];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        const beforeExclude = new Date();

        // When
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '임시 제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        const afterExclude = new Date();

        // Then
        expect(response.body.excludedAt).toBeDefined();
        const excludedAt = new Date(response.body.excludedAt);
        expect(excludedAt.getTime()).toBeGreaterThanOrEqual(
          beforeExclude.getTime(),
        );
        expect(excludedAt.getTime()).toBeLessThanOrEqual(
          afterExclude.getTime(),
        );
      });
    });

    describe('실패 케이스', () => {
      it('등록되지 않은 평가 대상자를 제외하려고 하면 404 에러가 발생해야 한다', async () => {
        // Given - 등록하지 않음
        const employee = testData.employees[0];
        const period = getActivePeriod();

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '제외 사유',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(404);
      });

      it('이미 제외된 대상자를 다시 제외하려고 하면 409 에러가 발생해야 한다', async () => {
        // Given - 등록 후 제외
        const employee = testData.employees[1];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '첫 번째 제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // When & Then - 재제외 시도
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '두 번째 제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(409);
      });

      it('제외 사유가 누락된 경우 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[2];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // When & Then - excludeReason 누락
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
            // excludeReason 누락
          })
          .expect(400);
      });

      // Note: excludedBy는 이제 @CurrentUser()를 통해 컨트롤러에서 자동으로 설정되므로
      // DTO에서 excludedBy를 전달받지 않습니다. 따라서 이 테스트는 더 이상 유효하지 않습니다.

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${invalidPeriodId}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '제외 사유',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(400);
      });

      it('잘못된 UUID 형식의 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const invalidEmployeeId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${invalidEmployeeId}/exclude`,
          )
          .send({
            excludeReason: '제외 사유',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(400);
      });
    });
  });

  // ==================== 평가 대상 포함 테스트 ====================

  describe('PATCH /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId/include - 평가 대상 포함', () => {
    describe('성공 케이스', () => {
      it('제외된 대상자를 성공적으로 다시 포함시킬 수 있어야 한다', async () => {
        // Given - 등록 후 제외
        const employee = testData.employees[0];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '임시 제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // When - 다시 포함
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.isExcluded).toBe(false);
        expect(response.body.excludeReason).toBeNull();
        expect(response.body.excludedBy).toBeNull();
        expect(response.body.excludedAt).toBeNull();
      });

      it('포함 처리 후 isExcluded가 false로 변경되어야 한다', async () => {
        // Given
        const employee = testData.employees[1];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then
        expect(response.body.isExcluded).toBe(false);
      });

      it('제외 사유 및 제외 처리자 정보가 null로 초기화되어야 한다', async () => {
        // Given
        const employee = testData.employees[2];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '프로젝트 미참여',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // When
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then - DB 확인
        const dbMapping = await getEvaluationTargetMappingFromDb(
          period.id,
          employee.id,
        );
        expect(dbMapping.isExcluded).toBe(false);
        expect(dbMapping.excludeReason).toBeNull();
        expect(dbMapping.excludedBy).toBeNull();
        expect(dbMapping.excludedAt).toBeNull();
      });

      it('제외 -> 포함 -> 다시 제외가 가능해야 한다', async () => {
        // Given
        const employee = testData.employees[3];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // 첫 번째 제외
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '첫 번째 제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // 포함
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // When - 두 번째 제외
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '두 번째 제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // Then
        expect(response.body.isExcluded).toBe(true);
        expect(response.body.excludeReason).toBe('두 번째 제외');
      });
    });

    describe('실패 케이스', () => {
      it('등록되지 않은 평가 대상자를 포함하려고 하면 404 에러가 발생해야 한다', async () => {
        // Given - 등록하지 않음
        const employee = testData.employees[0];
        const period = getActivePeriod();

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(404);
      });

      it('제외되지 않은 대상자를 포함하려고 하면 409 에러가 발생해야 한다', async () => {
        // Given - 등록만 하고 제외하지 않음
        const employee = testData.employees[1];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        // When & Then - 제외되지 않은 상태에서 포함 시도
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(409);
      });

      it('이미 포함된 대상자를 다시 포함하려고 하면 409 에러가 발생해야 한다', async () => {
        // Given - 등록 -> 제외 -> 포함
        const employee = testData.employees[2];
        const period = getActivePeriod();
        await registerEvaluationTarget(period.id, employee.id);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/exclude`,
          )
          .send({
            excludeReason: '제외',
            // excludedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(200);

        // When & Then - 재포함 시도
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(409);
      });

      // Note: updatedBy는 이제 @CurrentUser()를 통해 컨트롤러에서 자동으로 설정되므로
      // DTO에서 updatedBy를 전달받지 않습니다. 따라서 이 테스트는 더 이상 유효하지 않습니다.

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${invalidPeriodId}/targets/${employee.id}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(400);
      });

      it('잘못된 UUID 형식의 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const invalidEmployeeId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${period.id}/targets/${invalidEmployeeId}/include`,
          )
          .send({
            // updatedBy는 컨트롤러에서 @CurrentUser()를 통해 자동 설정됨
          })
          .expect(400);
      });
    });
  });
});
