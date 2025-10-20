import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';

describe('직원 조회 제외/포함 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
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

    // 테스트 환경 생성
    const { employees } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      employees,
    };

    console.log('직원 조회 제외/포함 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
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

  /**
   * DB에서 직원 정보 조회
   */
  async function getEmployeeFromDb(employeeId: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM employee WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [employeeId],
    );
    return result[0];
  }

  // ==================== 직원 조회 제외 테스트 ====================

  describe('PATCH /admin/employees/:id/exclude - 직원 조회 목록에서 제외', () => {
    describe('성공 시나리오', () => {
      it('정상적인 직원을 조회 목록에서 제외할 수 있어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const excludeReason = '퇴사 예정';

        // When
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason,
          })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(employee.id);
        expect(response.body.isExcludedFromList).toBe(true);
        expect(response.body.excludeReason).toBe(excludeReason);
        expect(response.body.excludedBy).toBe(
          '00000000-0000-0000-0000-000000000001',
        ); // CurrentUser에서 주입된 테스트 사용자 ID
        expect(response.body.excludedAt).toBeDefined();
      });

      it('제외 처리 시 DB에 정보가 저장되어야 한다', async () => {
        // Given
        const employee = testData.employees[1];
        const excludeReason = '휴직 중';

        // When
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason,
          })
          .expect(200);

        // Then - DB에서 확인
        const dbEmployee = await getEmployeeFromDb(employee.id);
        expect(dbEmployee).toBeDefined();
        expect(dbEmployee.isExcludedFromList).toBe(true);
        expect(dbEmployee.excludeReason).toBe(excludeReason);
        expect(dbEmployee.excludedBy).toBe(
          '00000000-0000-0000-0000-000000000001',
        ); // CurrentUser에서 주입된 테스트 사용자 ID
        expect(dbEmployee.excludedAt).toBeDefined();
      });

      it('여러 직원을 각각 제외할 수 있어야 한다', async () => {
        // Given
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];
        const employee3 = testData.employees[2];

        // When
        const response1 = await testSuite
          .request()
          .patch(`/admin/employees/${employee1.id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(200);

        const response2 = await testSuite
          .request()
          .patch(`/admin/employees/${employee2.id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(200);

        const response3 = await testSuite
          .request()
          .patch(`/admin/employees/${employee3.id}/exclude`)
          .send({
            excludeReason: '장기 출장',
          })
          .expect(200);

        // Then
        expect(response1.body.isExcludedFromList).toBe(true);
        expect(response2.body.isExcludedFromList).toBe(true);
        expect(response3.body.isExcludedFromList).toBe(true);
      });

      it('이미 제외된 직원을 다시 제외하면 정보가 업데이트되어야 한다', async () => {
        // Given - 먼저 제외
        const employee = testData.employees[3];
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '초기 사유',
          })
          .expect(200);

        // When - 다시 제외 (사유 변경)
        const newReason = '변경된 사유';
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: newReason,
          })
          .expect(200);

        // Then
        expect(response.body.isExcludedFromList).toBe(true);
        expect(response.body.excludeReason).toBe(newReason);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 직원 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .patch(`/admin/employees/${nonExistentId}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(404);
      });

      it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .patch('/admin/employees/invalid-uuid/exclude')
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(400);
      });

      it('excludeReason이 누락된 경우 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({})
          .expect(400);
      });

      it('빈 문자열 excludeReason으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '',
          })
          .expect(400);
      });
    });
  });

  // ==================== 직원 조회 포함 테스트 ====================

  describe('PATCH /admin/employees/:id/include - 직원 조회 목록에 포함', () => {
    describe('성공 시나리오', () => {
      it('제외된 직원을 다시 조회 목록에 포함할 수 있어야 한다', async () => {
        // Given - 먼저 제외
        const employee = testData.employees[0];
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(200);

        // When - 다시 포함
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/include`)
          .send({})
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(employee.id);
        expect(response.body.isExcludedFromList).toBe(false);
        expect(response.body.excludeReason).toBeNull();
        expect(response.body.excludedBy).toBeNull();
        expect(response.body.excludedAt).toBeNull();
      });

      it('포함 처리 시 DB에서 제외 정보가 초기화되어야 한다', async () => {
        // Given - 먼저 제외
        const employee = testData.employees[1];
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(200);

        // When - 다시 포함
        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/include`)
          .send({})
          .expect(200);

        // Then - DB에서 확인
        const dbEmployee = await getEmployeeFromDb(employee.id);
        expect(dbEmployee).toBeDefined();
        expect(dbEmployee.isExcludedFromList).toBe(false);
        expect(dbEmployee.excludeReason).toBeNull();
        expect(dbEmployee.excludedBy).toBeNull();
        expect(dbEmployee.excludedAt).toBeNull();
      });

      it('여러 제외된 직원을 각각 포함할 수 있어야 한다', async () => {
        // Given - 여러 직원 제외
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];
        await testSuite
          .request()
          .patch(`/admin/employees/${employee1.id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(200);

        await testSuite
          .request()
          .patch(`/admin/employees/${employee2.id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(200);

        // When - 각각 포함
        const response1 = await testSuite
          .request()
          .patch(`/admin/employees/${employee1.id}/include`)
          .send({})
          .expect(200);

        const response2 = await testSuite
          .request()
          .patch(`/admin/employees/${employee2.id}/include`)
          .send({})
          .expect(200);

        // Then
        expect(response1.body.isExcludedFromList).toBe(false);
        expect(response2.body.isExcludedFromList).toBe(false);
      });

      it('제외되지 않은 직원을 포함 처리해도 정상 동작해야 한다', async () => {
        // Given - 제외하지 않은 직원
        const employee = testData.employees[2];

        // When - 포함 처리
        const response = await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/include`)
          .send({})
          .expect(200);

        // Then
        expect(response.body.isExcludedFromList).toBe(false);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 직원 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .patch(`/admin/employees/${nonExistentId}/include`)
          .send({})
          .expect(404);
      });

      it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .patch('/admin/employees/invalid-uuid/include')
          .send({})
          .expect(400);
      });
    });
  });

  // ==================== 제외된 직원 목록 조회 테스트 ====================

  describe('GET /admin/employees/excluded - 제외된 직원 목록 조회', () => {
    describe('성공 시나리오', () => {
      it('제외된 직원 목록을 조회할 수 있어야 한다', async () => {
        // Given - 일부 직원 제외
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];

        await testSuite
          .request()
          .patch(`/admin/employees/${employee1.id}/exclude`)
          .send({
            excludeReason: '퇴사 예정',
          })
          .expect(200);

        await testSuite
          .request()
          .patch(`/admin/employees/${employee2.id}/exclude`)
          .send({
            excludeReason: '휴직 중',
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/excluded')
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(
          response.body.every((emp: any) => emp.isExcludedFromList === true),
        ).toBe(true);
      });

      it('제외된 직원이 없으면 빈 배열을 반환해야 한다', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/excluded')
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('제외 정보가 포함되어 반환되어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const excludeReason = '퇴사 예정';

        await testSuite
          .request()
          .patch(`/admin/employees/${employee.id}/exclude`)
          .send({
            excludeReason,
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/excluded')
          .expect(200);

        // Then
        const excludedEmployee = response.body[0];
        expect(excludedEmployee.id).toBe(employee.id);
        expect(excludedEmployee.isExcludedFromList).toBe(true);
        expect(excludedEmployee.excludeReason).toBe(excludeReason);
        expect(excludedEmployee.excludedBy).toBe(
          '00000000-0000-0000-0000-000000000001',
        );
        expect(excludedEmployee.excludedAt).toBeDefined();
      });
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오', () => {
    it('직원 제외 -> 제외 목록 조회 -> 다시 포함 흐름이 정상 동작해야 한다', async () => {
      // Given
      const employee = testData.employees[0];

      // 1. 직원 제외
      const excludeResponse = await testSuite
        .request()
        .patch(`/admin/employees/${employee.id}/exclude`)
        .send({
          excludeReason: '퇴사 예정',
        })
        .expect(200);
      expect(excludeResponse.body.isExcludedFromList).toBe(true);

      // 2. 제외 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(200);
      expect(listResponse.body.length).toBe(1);
      expect(listResponse.body[0].id).toBe(employee.id);

      // 3. 다시 포함
      const includeResponse = await testSuite
        .request()
        .patch(`/admin/employees/${employee.id}/include`)
        .send({})
        .expect(200);
      expect(includeResponse.body.isExcludedFromList).toBe(false);

      // 4. 제외 목록 재조회 (빈 배열이어야 함)
      const finalListResponse = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(200);
      expect(finalListResponse.body.length).toBe(0);
    });

    it('여러 직원 제외 -> 일부만 포함 흐름이 정상 동작해야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const employee3 = testData.employees[2];

      // 1. 3명 제외
      await testSuite
        .request()
        .patch(`/admin/employees/${employee1.id}/exclude`)
        .send({
          excludeReason: '퇴사 예정',
        })
        .expect(200);

      await testSuite
        .request()
        .patch(`/admin/employees/${employee2.id}/exclude`)
        .send({
          excludeReason: '휴직 중',
        })
        .expect(200);

      await testSuite
        .request()
        .patch(`/admin/employees/${employee3.id}/exclude`)
        .send({
          excludeReason: '장기 출장',
        })
        .expect(200);

      // 2. 제외 목록 조회 (3명이어야 함)
      const listResponse1 = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(200);
      expect(listResponse1.body.length).toBe(3);

      // 3. 1명만 포함
      await testSuite
        .request()
        .patch(`/admin/employees/${employee1.id}/include`)
        .send({})
        .expect(200);

      // 4. 제외 목록 재조회 (2명이어야 함)
      const listResponse2 = await testSuite
        .request()
        .get('/admin/employees/excluded')
        .expect(200);
      expect(listResponse2.body.length).toBe(2);
      expect(
        listResponse2.body.find((e: any) => e.id === employee1.id),
      ).toBeUndefined();
      expect(
        listResponse2.body.find((e: any) => e.id === employee2.id),
      ).toBeDefined();
      expect(
        listResponse2.body.find((e: any) => e.id === employee3.id),
      ).toBeDefined();
    });
  });
});
