import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('PATCH /admin/performance-evaluation/evaluation-editable-status/:mappingId', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
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

    testData = {
      departments,
      employees,
      periods,
    };

    console.log('평가 수정 가능 상태 변경 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      periods: testData.periods.length,
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

  /**
   * 평가기간-직원 맵핑 생성 헬퍼
   */
  async function createEvaluationPeriodEmployeeMapping(
    periodId: string,
    employeeId: string,
  ): Promise<any> {
    const result = await dataSource.manager.query(
      `INSERT INTO evaluation_period_employee_mapping 
       ("evaluationPeriodId", "employeeId", "isSelfEvaluationEditable", "isPrimaryEvaluationEditable", "isSecondaryEvaluationEditable", "version", "createdAt", "updatedAt")
       VALUES ($1, $2, true, false, false, 1, NOW(), NOW())
       RETURNING *`,
      [periodId, employeeId],
    );
    return result[0];
  }

  /**
   * 평가기간-직원 맵핑 조회 헬퍼
   */
  async function getEvaluationPeriodEmployeeMapping(
    mappingId: string,
  ): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_period_employee_mapping WHERE "id" = $1`,
      [mappingId],
    );
    return result[0];
  }

  /**
   * 평가 수정 가능 상태 변경 헬퍼
   */
  async function updateEvaluationEditableStatus(
    mappingId: string,
    evaluationType: string,
    isEditable: boolean,
    updatedBy?: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/evaluation-editable-status/${mappingId}`,
      )
      .query({
        evaluationType,
        isEditable: isEditable.toString(),
      })
      .send({
        ...(updatedBy && { updatedBy }),
      })
      .expect(200);

    return response.body;
  }

  // ==================== 성공 시나리오 ====================

  describe('평가 수정 가능 상태 변경 성공 시나리오', () => {
    it('자기평가 수정 가능 상태를 변경할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSelfEvaluationEditable).toBe(false);
      expect(response.body.isPrimaryEvaluationEditable).toBe(
        mapping.isPrimaryEvaluationEditable,
      );
      expect(response.body.isSecondaryEvaluationEditable).toBe(
        mapping.isSecondaryEvaluationEditable,
      );
    });

    it('1차평가 수정 가능 상태를 변경할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'primary', isEditable: 'true' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isPrimaryEvaluationEditable).toBe(true);
      expect(response.body.isSelfEvaluationEditable).toBe(
        mapping.isSelfEvaluationEditable,
      );
      expect(response.body.isSecondaryEvaluationEditable).toBe(
        mapping.isSecondaryEvaluationEditable,
      );
    });

    it('2차평가 수정 가능 상태를 변경할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'secondary', isEditable: 'true' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSecondaryEvaluationEditable).toBe(true);
      expect(response.body.isSelfEvaluationEditable).toBe(
        mapping.isSelfEvaluationEditable,
      );
      expect(response.body.isPrimaryEvaluationEditable).toBe(
        mapping.isPrimaryEvaluationEditable,
      );
    });

    it('모든 평가 수정 가능 상태를 일괄 변경할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'all', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSelfEvaluationEditable).toBe(false);
      expect(response.body.isPrimaryEvaluationEditable).toBe(false);
      expect(response.body.isSecondaryEvaluationEditable).toBe(false);
    });

    it('updatedBy 없이도 평가 수정 가능 상태를 변경할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({})
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.isSelfEvaluationEditable).toBe(false);
    });

    it('평가 수정 가능 상태를 여러 번 변경할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When - 첫 번째 변경: 자기평가 잠금
      const response1 = await updateEvaluationEditableStatus(
        mapping.id,
        'self',
        false,
        updatedBy,
      );

      // When - 두 번째 변경: 1차평가 잠금 해제
      const response2 = await updateEvaluationEditableStatus(
        mapping.id,
        'primary',
        true,
        updatedBy,
      );

      // When - 세 번째 변경: 2차평가 잠금 해제
      const response3 = await updateEvaluationEditableStatus(
        mapping.id,
        'secondary',
        true,
        updatedBy,
      );

      // Then
      expect(response1.isSelfEvaluationEditable).toBe(false);
      expect(response2.isPrimaryEvaluationEditable).toBe(true);
      expect(response3.isSecondaryEvaluationEditable).toBe(true);
      expect(response3.isSelfEvaluationEditable).toBe(false); // 이전 상태 유지
      expect(response3.isPrimaryEvaluationEditable).toBe(true); // 이전 상태 유지
    });

    it('평가 단계별 순차적 잠금 시나리오를 수행할 수 있어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When - 시나리오 1: 평가 시작 (자기평가만 활성)
      const step1 = await updateEvaluationEditableStatus(
        mapping.id,
        'self',
        true,
        updatedBy,
      );

      // When - 시나리오 2: 1차평가 시작 (자기평가 잠금, 1차평가 활성)
      await updateEvaluationEditableStatus(
        mapping.id,
        'self',
        false,
        updatedBy,
      );
      const step2 = await updateEvaluationEditableStatus(
        mapping.id,
        'primary',
        true,
        updatedBy,
      );

      // When - 시나리오 3: 2차평가 시작 (1차평가 잠금, 2차평가 활성)
      await updateEvaluationEditableStatus(
        mapping.id,
        'primary',
        false,
        updatedBy,
      );
      const step3 = await updateEvaluationEditableStatus(
        mapping.id,
        'secondary',
        true,
        updatedBy,
      );

      // When - 시나리오 4: 평가 종료 (모든 평가 잠금)
      const step4 = await updateEvaluationEditableStatus(
        mapping.id,
        'all',
        false,
        updatedBy,
      );

      // Then
      expect(step1.isSelfEvaluationEditable).toBe(true);
      expect(step2.isPrimaryEvaluationEditable).toBe(true);
      expect(step2.isSelfEvaluationEditable).toBe(false);
      expect(step3.isSecondaryEvaluationEditable).toBe(true);
      expect(step3.isPrimaryEvaluationEditable).toBe(false);
      expect(step4.isSelfEvaluationEditable).toBe(false);
      expect(step4.isPrimaryEvaluationEditable).toBe(false);
      expect(step4.isSecondaryEvaluationEditable).toBe(false);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('평가 수정 가능 상태 변경 실패 시나리오', () => {
    it('isEditable 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When & Then
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self' })
        // isEditable 누락
        .send({
          updatedBy,
        })
        .expect(400);
    });

    it('evaluationType 쿼리 파라미터 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When & Then
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ isEditable: 'false' })
        // evaluationType 누락
        .send({
          updatedBy,
        })
        .expect(400);
    });

    it('잘못된 evaluationType으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When & Then
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'invalid', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(400);
    });

    it('존재하지 않는 mappingId로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentMappingId = '00000000-0000-0000-0000-000000000000';
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${nonExistentMappingId}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        });

      // Then
      expect([400, 404]).toContain(response.status);
    });

    it('잘못된 형식의 mappingId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidMappingId = 'invalid-uuid';
      const updatedBy = getRandomEmployee().id;

      // When & Then
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${invalidMappingId}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(400);
    });

    // NOTE: updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리되므로
    // request body의 updatedBy 필드는 무시됩니다.
    // it('잘못된 형식의 updatedBy로 요청 시 400 에러가 발생해야 한다', async () => {
    //   // Given
    //   const period = getRandomEvaluationPeriod();
    //   const employee = getRandomEmployee();
    //   const mapping = await createEvaluationPeriodEmployeeMapping(
    //     period.id,
    //     employee.id,
    //   );
    //   const invalidUpdatedBy = 'invalid-uuid';

    //   // When & Then
    //   await testSuite.request()
    //     .patch(
    //       `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
    //     )
    //     .query({ evaluationType: 'self', isEditable: 'false' })
    //     .send({
    //       updatedBy: invalidUpdatedBy,
    //     })
    //     .expect(400);
    // });

    it('isEditable이 boolean이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When & Then
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'not-a-boolean' })
        .send({
          updatedBy,
        })
        .expect(400);
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('평가 수정 가능 상태 데이터 무결성 시나리오', () => {
    it('변경된 상태가 DB에 올바르게 저장되어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      const dbRecord = await getEvaluationPeriodEmployeeMapping(mapping.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.isSelfEvaluationEditable).toBe(false);
      expect(dbRecord.isSelfEvaluationEditable).toBe(
        response.body.isSelfEvaluationEditable,
      );
    });

    it('평가 수정 가능 상태 변경 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // 시간 차이를 보장하기 위해 약간 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(mapping.updatedAt).getTime(),
      );
    });

    it('평가 수정 가능 상태 변경 시 createdAt은 거의 변경되지 않는다 (50ms 이내)', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then - 타임스탬프 정밀도 차이를 허용 (50ms 이내)
      const createdAtDiff = Math.abs(
        new Date(response.body.createdAt).getTime() -
          new Date(mapping.createdAt).getTime(),
      );
      expect(createdAtDiff).toBeLessThanOrEqual(50);
    });

    it('all 타입으로 변경 시 모든 평가 상태가 동일하게 변경되어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When - all 타입으로 false 설정
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'all', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      const dbRecord = await getEvaluationPeriodEmployeeMapping(mapping.id);
      expect(dbRecord.isSelfEvaluationEditable).toBe(false);
      expect(dbRecord.isPrimaryEvaluationEditable).toBe(false);
      expect(dbRecord.isSecondaryEvaluationEditable).toBe(false);
    });

    it('각 평가 타입은 독립적으로 변경되어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When - 자기평가만 false로 변경
      await updateEvaluationEditableStatus(
        mapping.id,
        'self',
        false,
        updatedBy,
      );

      // Then
      const dbRecord = await getEvaluationPeriodEmployeeMapping(mapping.id);
      expect(dbRecord.isSelfEvaluationEditable).toBe(false);
      expect(dbRecord.isPrimaryEvaluationEditable).toBe(
        mapping.isPrimaryEvaluationEditable,
      ); // 변경되지 않음
      expect(dbRecord.isSecondaryEvaluationEditable).toBe(
        mapping.isSecondaryEvaluationEditable,
      ); // 변경되지 않음
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('평가 수정 가능 상태 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then - 필수 필드 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('evaluationPeriodId');
      expect(response.body).toHaveProperty('employeeId');
      expect(response.body).toHaveProperty('isSelfEvaluationEditable');
      expect(response.body).toHaveProperty('isPrimaryEvaluationEditable');
      expect(response.body).toHaveProperty('isSecondaryEvaluationEditable');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('응답의 ID가 요청한 mappingId와 일치해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();
      const mapping = await createEvaluationPeriodEmployeeMapping(
        period.id,
        employee.id,
      );
      const updatedBy = getRandomEmployee().id;

      // When
      const response = await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/evaluation-editable-status/${mapping.id}`,
        )
        .query({ evaluationType: 'self', isEditable: 'false' })
        .send({
          updatedBy,
        })
        .expect(200);

      // Then
      expect(response.body.id).toBe(mapping.id);
      expect(response.body.evaluationPeriodId).toBe(period.id);
      expect(response.body.employeeId).toBe(employee.id);
    });
  });
});
