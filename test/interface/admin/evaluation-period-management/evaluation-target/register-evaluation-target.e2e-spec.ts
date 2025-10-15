import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가 대상자 등록 테스트 - 단일 등록 및 대량 등록', () => {
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

    console.log('평가 대상자 등록 테스트 데이터 생성 완료:', {
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

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getActivePeriod(): EvaluationPeriodDto {
    return (
      testData.periods.find((p) => p.status === 'in-progress') ||
      testData.periods[0]
    );
  }

  function getWaitingPeriod(): EvaluationPeriodDto {
    return (
      testData.periods.find((p) => p.status === 'waiting') ||
      testData.periods[1]
    );
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

  /**
   * DB에서 평가기간의 모든 평가 대상자 조회
   */
  async function getAllTargetMappingsFromDb(
    evaluationPeriodId: string,
  ): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_period_employee_mapping WHERE "evaluationPeriodId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
      [evaluationPeriodId],
    );
    return result;
  }

  // ==================== 단일 평가 대상자 등록 테스트 ====================

  describe('POST /admin/evaluation-periods/:evaluationPeriodId/targets/:employeeId - 평가 대상자 등록', () => {
    describe('성공 케이스', () => {
      it('유효한 평가기간 ID와 직원 ID로 평가 대상자를 등록할 수 있어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
          .send({
            createdBy,
          });

        expect(response.status).toBe(201);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.evaluationPeriodId).toBe(period.id);
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.isExcluded).toBe(false);
        expect(response.body.excludeReason).toBeNull();
        expect(response.body.excludedBy).toBeNull();
        expect(response.body.excludedAt).toBeNull();
        expect(response.body.createdBy).toBe(createdBy);
      });

      it('등록된 평가 대상자의 상태가 올바르게 반환되어야 한다 (isExcluded: false)', async () => {
        // Given
        const employee = testData.employees[1];
        const period = getActivePeriod();
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
          .send({
            createdBy,
          })
          .expect(201);

        // Then
        expect(response.body.isExcluded).toBe(false);
        expect(response.body.excludeReason).toBeNull();
        expect(response.body.excludedBy).toBeNull();
        expect(response.body.excludedAt).toBeNull();
      });

      it('평가 대상자 등록 후 DB에 정보가 저장되어야 한다', async () => {
        // Given
        const employee = testData.employees[2];
        const period = getWaitingPeriod();
        const createdBy = 'test-admin';

        // When
        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
          .send({
            createdBy,
          })
          .expect(201);

        // Then - DB 확인
        const dbMapping = await getEvaluationTargetMappingFromDb(
          period.id,
          employee.id,
        );
        expect(dbMapping).toBeDefined();
        expect(dbMapping.evaluationPeriodId).toBe(period.id);
        expect(dbMapping.employeeId).toBe(employee.id);
        expect(dbMapping.isExcluded).toBe(false);
        expect(dbMapping.createdBy).toBe(createdBy);
      });

      it('여러 평가기간에 동일한 직원을 등록할 수 있어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period1 = testData.periods[0];
        const period2 = testData.periods[1];
        const createdBy = 'admin-user-id';

        // When
        const response1 = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${period1.id}/targets/${employee.id}`,
          )
          .send({
            createdBy,
          })
          .expect(201);

        const response2 = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${period2.id}/targets/${employee.id}`,
          )
          .send({
            createdBy,
          })
          .expect(201);

        // Then
        expect(response1.body.evaluationPeriodId).toBe(period1.id);
        expect(response2.body.evaluationPeriodId).toBe(period2.id);
        expect(response1.body.employeeId).toBe(employee.id);
        expect(response2.body.employeeId).toBe(employee.id);
        expect(response1.body.id).not.toBe(response2.body.id);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 평가기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';
        const createdBy = 'admin-user-id';

        // When & Then
        const response = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${nonExistentPeriodId}/targets/${employee.id}`,
          )
          .send({
            createdBy,
          })
          .expect(404);

        expect(response.body.message).toBeDefined();
      });

      it('존재하지 않는 직원 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';
        const createdBy = 'admin-user-id';

        // When & Then
        const response = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${period.id}/targets/${nonExistentEmployeeId}`,
          )
          .send({
            createdBy,
          })
          .expect(404);

        expect(response.body.message).toBeDefined();
      });

      it('이미 등록된 평가 대상자를 다시 등록하려고 하면 409 에러가 발생해야 한다', async () => {
        // Given - 먼저 등록
        const employee = testData.employees[3];
        const period = getActivePeriod();
        const createdBy = 'admin-user-id';

        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
          .send({
            createdBy,
          })
          .expect(201);

        // When & Then - 동일한 대상자 재등록 시도
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
          .send({
            createdBy,
          })
          .expect(409);

        expect(response.body.message).toBeDefined();
      });

      it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const invalidPeriodId = 'invalid-uuid';
        const createdBy = 'admin-user-id';

        // When & Then
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${invalidPeriodId}/targets/${employee.id}`,
          )
          .send({
            createdBy,
          })
          .expect(400);
      });

      it('잘못된 UUID 형식의 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const invalidEmployeeId = 'invalid-uuid';
        const createdBy = 'admin-user-id';

        // When & Then
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${period.id}/targets/${invalidEmployeeId}`,
          )
          .send({
            createdBy,
          })
          .expect(400);
      });

      it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();

        // When & Then - createdBy 누락
        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/${employee.id}`)
          .send({
            // createdBy 누락
          })
          .expect(400);
      });
    });
  });

  // ==================== 대량 평가 대상자 등록 테스트 ====================

  describe('POST /admin/evaluation-periods/:evaluationPeriodId/targets/bulk - 평가 대상자 대량 등록', () => {
    describe('성공 케이스', () => {
      it('여러 직원을 동시에 평가 대상자로 등록할 수 있어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employeeIds = testData.employees.slice(0, 5).map((e) => e.id);
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds,
            createdBy,
          })
          .expect(201);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(5);

        response.body.forEach((mapping: any, index: number) => {
          expect(mapping.id).toBeDefined();
          expect(mapping.evaluationPeriodId).toBe(period.id);
          expect(employeeIds).toContain(mapping.employeeId);
          expect(mapping.isExcluded).toBe(false);
          expect(mapping.createdBy).toBe(createdBy);
        });
      });

      it('이미 등록된 직원이 포함된 경우 중복을 제외하고 신규 직원만 등록해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];
        const employee3 = testData.employees[2];
        const createdBy = 'admin-user-id';

        // 먼저 employee1 등록
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-periods/${period.id}/targets/${employee1.id}`,
          )
          .send({
            createdBy,
          })
          .expect(201);

        // When - employee1, employee2, employee3 대량 등록 시도
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds: [employee1.id, employee2.id, employee3.id],
            createdBy,
          })
          .expect(201);

        // Then - 3명 모두 반환되어야 함 (기존 1명 + 신규 2명)
        expect(response.body.length).toBe(3);

        // DB 확인 - 총 3명이 등록되어 있어야 함
        const dbMappings = await getAllTargetMappingsFromDb(period.id);
        expect(dbMappings.length).toBe(3);
      });

      it('등록된 대상자 수가 올바르게 반환되어야 한다', async () => {
        // Given
        const period = getWaitingPeriod();
        const allEmployeeIds = testData.employees.map((e) => e.id);
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds: allEmployeeIds,
            createdBy,
          })
          .expect(201);

        // Then
        expect(response.body.length).toBe(allEmployeeIds.length);

        // DB 확인
        const dbMappings = await getAllTargetMappingsFromDb(period.id);
        expect(dbMappings.length).toBe(allEmployeeIds.length);
      });

      it('대량 등록된 모든 대상자가 isExcluded: false 상태여야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employeeIds = testData.employees.slice(0, 3).map((e) => e.id);
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds,
            createdBy,
          })
          .expect(201);

        // Then
        response.body.forEach((mapping: any) => {
          expect(mapping.isExcluded).toBe(false);
          expect(mapping.excludeReason).toBeNull();
          expect(mapping.excludedBy).toBeNull();
          expect(mapping.excludedAt).toBeNull();
        });
      });

      it('단일 직원만 포함된 배열로 대량 등록할 수 있어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employeeIds = [testData.employees[0].id];
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds,
            createdBy,
          })
          .expect(201);

        // Then
        expect(response.body.length).toBe(1);
        expect(response.body[0].employeeId).toBe(employeeIds[0]);
      });
    });

    describe('실패 케이스', () => {
      it('빈 배열로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const createdBy = 'admin-user-id';

        // When & Then
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds: [],
            createdBy,
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('잘못된 직원 ID가 포함된 경우 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employeeIds = [
          testData.employees[0].id,
          'invalid-uuid',
          testData.employees[1].id,
        ];
        const createdBy = 'admin-user-id';

        // When & Then
        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds,
            createdBy,
          })
          .expect(400);
      });

      it('존재하지 않는 평가기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';
        const employeeIds = testData.employees.slice(0, 3).map((e) => e.id);
        const createdBy = 'admin-user-id';

        // When & Then
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${nonExistentPeriodId}/targets/bulk`)
          .send({
            employeeIds,
            createdBy,
          })
          .expect(404);

        expect(response.body.message).toBeDefined();
      });

      it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employeeIds = testData.employees.slice(0, 3).map((e) => e.id);

        // When & Then - createdBy 누락
        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds,
            // createdBy 누락
          })
          .expect(400);

        // When & Then - employeeIds 누락
        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            // employeeIds 누락
            createdBy: 'admin-user-id',
          })
          .expect(400);
      });

      it('employeeIds가 배열이 아닌 경우 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const createdBy = 'admin-user-id';

        // When & Then
        await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds: 'not-an-array',
            createdBy,
          })
          .expect(400);
      });
    });

    describe('동시성 및 에지 케이스', () => {
      it('동일한 평가기간에 대해 동시에 대량 등록 요청 시 적절히 처리되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const batch1 = testData.employees.slice(0, 3).map((e) => e.id);
        const batch2 = testData.employees.slice(3).map((e) => e.id); // 나머지 모든 직원
        const createdBy = 'admin-user-id';

        // When - 동시 요청
        const [response1, response2] = await Promise.all([
          request(app.getHttpServer())
            .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
            .send({
              employeeIds: batch1,
              createdBy,
            }),
          request(app.getHttpServer())
            .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
            .send({
              employeeIds: batch2,
              createdBy,
            }),
        ]);

        // Then
        expect(response1.statusCode).toBe(201);
        expect(response2.statusCode).toBe(201);

        // DB 확인 - 모든 직원이 등록되어 있어야 함
        const dbMappings = await getAllTargetMappingsFromDb(period.id);
        expect(dbMappings.length).toBe(testData.employees.length);
      });

      it('최대 직원 수로 대량 등록할 수 있어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const allEmployeeIds = testData.employees.map((e) => e.id);
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds: allEmployeeIds,
            createdBy,
          })
          .expect(201);

        // Then
        expect(response.body.length).toBe(allEmployeeIds.length);
      });

      it('중복된 직원 ID가 배열에 포함된 경우 한 번만 등록되어야 한다', async () => {
        // Given
        const period = getActivePeriod();
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];
        const employeeIds = [
          employee1.id,
          employee2.id,
          employee1.id, // 중복
          employee2.id, // 중복
        ];
        const createdBy = 'admin-user-id';

        // When
        const response = await request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/targets/bulk`)
          .send({
            employeeIds,
            createdBy,
          })
          .expect(201);

        // Then - 2명만 등록되어야 함
        const dbMappings = await getAllTargetMappingsFromDb(period.id);
        expect(dbMappings.length).toBe(2);
      });
    });
  });
});
