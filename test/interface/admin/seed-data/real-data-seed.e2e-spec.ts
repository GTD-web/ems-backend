import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource, IsNull } from 'typeorm';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';

describe('POST /admin/seed/generate-with-real-data - 실제 부서/직원 데이터 사용 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  // ==================== 실제 데이터 생성 헬퍼 ====================

  /**
   * 실제 부서 데이터를 생성한다
   */
  async function 실제_부서_데이터를_생성한다(
    count: number = 3,
  ): Promise<string[]> {
    const departments: Department[] = [];
    const timestamp = Date.now().toString(36).slice(-4);

    // 1. 회사 생성
    const company = new Department();
    company.name = `${timestamp} 테스트 회사`;
    company.code = `TEST-COMP-${timestamp}`;
    company.order = 0;
    company.externalId = `ext-comp-${timestamp}`;
    company.externalCreatedAt = new Date();
    company.externalUpdatedAt = new Date();
    company.createdBy = 'test-system';
    departments.push(company);

    const savedCompany = await dataSource
      .getRepository(Department)
      .save(company);

    // 2. 본부 생성
    if (count >= 2) {
      const headquarter = new Department();
      headquarter.name = `${timestamp} 테스트 본부`;
      headquarter.code = `TEST-HQ-${timestamp}`;
      headquarter.order = 1;
      headquarter.parentDepartmentId = savedCompany.externalId;
      headquarter.externalId = `ext-hq-${timestamp}`;
      headquarter.externalCreatedAt = new Date();
      headquarter.externalUpdatedAt = new Date();
      headquarter.createdBy = 'test-system';
      departments.push(headquarter);

      const savedHQ = await dataSource
        .getRepository(Department)
        .save(headquarter);

      // 3. 파트 생성
      if (count >= 3) {
        const part = new Department();
        part.name = `${timestamp} 테스트 파트`;
        part.code = `TEST-PART-${timestamp}`;
        part.order = 2;
        part.parentDepartmentId = savedHQ.externalId;
        part.externalId = `ext-part-${timestamp}`;
        part.externalCreatedAt = new Date();
        part.externalUpdatedAt = new Date();
        part.createdBy = 'test-system';
        departments.push(part);

        await dataSource.getRepository(Department).save(part);
      }
    }

    return departments.map((d) => d.id);
  }

  /**
   * 실제 직원 데이터를 생성한다
   */
  async function 실제_직원_데이터를_생성한다(
    count: number = 5,
    departmentIds?: string[],
  ): Promise<string[]> {
    const employees: Employee[] = [];
    const timestamp = Date.now().toString(36).slice(-4);

    // 부서가 없으면 먼저 생성
    if (!departmentIds || departmentIds.length === 0) {
      departmentIds = await 실제_부서_데이터를_생성한다(1);
    }

    // 부서 정보 조회
    const departments = await dataSource
      .getRepository(Department)
      .findByIds(departmentIds);
    const firstDept = departments[0];

    for (let i = 0; i < count; i++) {
      const emp = new Employee();
      emp.employeeNumber = `TEST-EMP-${timestamp}-${String(i + 1).padStart(3, '0')}`;
      emp.name = `테스트직원${i + 1}`;
      emp.email = `test${i + 1}@test.com`;
      emp.phoneNumber = `010-0000-${String(i + 1).padStart(4, '0')}`;
      emp.dateOfBirth = new Date('1990-01-01');
      emp.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
      emp.hireDate = new Date();
      emp.status = '재직중';
      emp.isExcludedFromList = false;
      emp.departmentId = firstDept?.externalId || 'test-dept';
      emp.externalId = `ext-emp-${timestamp}-${i}`;
      emp.externalCreatedAt = new Date();
      emp.externalUpdatedAt = new Date();
      emp.createdBy = 'test-system';
      employees.push(emp);
    }

    const saved = await dataSource.getRepository(Employee).save(employees);
    return saved.map((e) => e.id);
  }

  // ==================== 테스트 케이스 ====================

  describe('실제 부서+직원 데이터 사용', () => {
    it('최소 구성: 실제 부서와 직원으로 minimal 시나리오', async () => {
      // Given: 실제 부서 3개, 직원 10명 생성
      const realDepartmentIds = await 실제_부서_데이터를_생성한다(3);
      const realEmployeeIds = await 실제_직원_데이터를_생성한다(
        10,
        realDepartmentIds,
      );
      console.log(`\n생성된 실제 부서: ${realDepartmentIds.length}개`);
      console.log(`생성된 실제 직원: ${realEmployeeIds.length}개`);

      const config = {
        scenario: 'minimal',
        clearExisting: false, // 실제 데이터 보존
      };

      // When: 시드 데이터 생성
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();

      // Phase1 결과 검증
      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();
      expect(phase1Result.entityCounts.Department).toBe(3);
      expect(phase1Result.entityCounts.Employee).toBe(10);

      // 데이터베이스에서 확인
      const departments = await dataSource
        .getRepository(Department)
        .find({ where: { deletedAt: IsNull() } });
      const employees = await dataSource
        .getRepository(Employee)
        .find({ where: { deletedAt: IsNull() } });

      console.log(`\n총 부서 수: ${departments.length}개`);
      console.log(`총 직원 수: ${employees.length}개`);
      expect(departments.length).toBe(3);
      expect(employees.length).toBe(10);

      // 실제 ID 확인
      const departmentIdsInDb = departments.map((d) => d.id);
      const employeeIdsInDb = employees.map((e) => e.id);
      realDepartmentIds.forEach((id) => {
        expect(departmentIdsInDb).toContain(id);
      });
      realEmployeeIds.forEach((id) => {
        expect(employeeIdsInDb).toContain(id);
      });

      console.log('\n========== 실제 데이터 샘플 ==========');
      departments.forEach((dept, idx) => {
        console.log(`부서 ${idx + 1}. ${dept.code} - ${dept.name}`);
      });
      employees.slice(0, 3).forEach((emp, idx) => {
        console.log(`직원 ${idx + 1}. ${emp.employeeNumber} - ${emp.name}`);
      });
    });

    it('평가기간 포함: with_period 시나리오', async () => {
      // Given: 실제 부서 3개, 직원 5명 생성
      const realDepartmentIds = await 실제_부서_데이터를_생성한다(3);
      const realEmployeeIds = await 실제_직원_데이터를_생성한다(
        5,
        realDepartmentIds,
      );

      const config = {
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 2,
        wbsPerProject: 3,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);

      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      const phase2Result = response.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );

      expect(phase1Result.entityCounts.Department).toBe(3);
      expect(phase1Result.entityCounts.Employee).toBe(5);
      expect(phase2Result).toBeDefined();
      expect(phase2Result.entityCounts.EvaluationPeriod).toBe(1);

      console.log('\n✓ with_period 시나리오 완료');
    });
  });

  describe('FULL 시나리오 테스트', () => {
    it('실제 부서와 직원으로 전체 평가 사이클을 생성해야 함 (권장)', async () => {
      // Given: 실제 부서 3개, 직원 8명 생성
      const realDepartmentIds = await 실제_부서_데이터를_생성한다(3);
      const realEmployeeIds = await 실제_직원_데이터를_생성한다(
        8,
        realDepartmentIds,
      );

      console.log(`\n생성된 실제 부서: ${realDepartmentIds.length}개`);
      console.log(`생성된 실제 직원: ${realEmployeeIds.length}개`);

      const config = {
        scenario: 'full',
        clearExisting: false, // 실제 데이터 보존 (중요!)
        projectCount: 5,
        wbsPerProject: 10,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When: 시드 데이터 생성
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();

      console.log('\n========== 생성된 Phase 결과 ==========');
      response.body.results.forEach((result: any) => {
        console.log(
          `${result.phase}: ${Object.keys(result.entityCounts).join(', ')}`,
        );
      });

      // Phase1 결과 검증
      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();
      expect(phase1Result.entityCounts.Department).toBe(3);
      expect(phase1Result.entityCounts.Employee).toBe(8);
      expect(phase1Result.entityCounts.Project).toBe(5);

      // 데이터베이스에서 확인
      const departments = await dataSource
        .getRepository(Department)
        .find({ where: { deletedAt: IsNull() } });
      const employees = await dataSource
        .getRepository(Employee)
        .find({ where: { deletedAt: IsNull() } });

      expect(departments.length).toBe(3);
      expect(employees.length).toBe(8);

      // 실제 ID들이 사용되었는지 확인
      const deptIdsInDb = departments.map((d) => d.id);
      const empIdsInDb = employees.map((e) => e.id);

      realDepartmentIds.forEach((id) => {
        expect(deptIdsInDb).toContain(id);
      });
      realEmployeeIds.forEach((id) => {
        expect(empIdsInDb).toContain(id);
      });

      console.log('\n========== 실제 데이터 사용 확인 완료 ==========');
      console.log(`✓ 부서 ${departments.length}개 모두 실제 데이터`);
      console.log(`✓ 직원 ${employees.length}개 모두 실제 데이터`);

      // Phase2 이상도 생성되었는지 확인
      const phase2Result = response.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );
      expect(phase2Result).toBeDefined();
      expect(phase2Result.entityCounts.EvaluationPeriod).toBe(1);

      // 평가기간 매핑이 실제 직원 ID를 사용하는지 확인
      const mappings = await dataSource.query(`
        SELECT "employeeId", "isExcluded" 
        FROM evaluation_period_employee_mapping 
        WHERE "deletedAt" IS NULL
        LIMIT 5
      `);

      console.log('\n========== 평가대상자 매핑 샘플 ==========');
      mappings.forEach((m: any, idx: number) => {
        const isReal = realEmployeeIds.includes(m.employeeId);
        console.log(
          `${idx + 1}. Employee ID: ${m.employeeId} (실제: ${isReal ? '✓' : '✗'})`,
        );
      });

      // 매핑의 직원 ID가 실제 직원 ID인지 확인
      mappings.forEach((m: any) => {
        expect(realEmployeeIds).toContain(m.employeeId);
      });
    });

    it('대규모 직원으로 FULL 시나리오 생성', async () => {
      // Given: 실제 부서 3개, 직원 20명 생성
      const realDepartmentIds = await 실제_부서_데이터를_생성한다(3);
      const realEmployeeIds = await 실제_직원_데이터를_생성한다(
        20,
        realDepartmentIds,
      );

      const config = {
        scenario: 'full',
        clearExisting: false,
        projectCount: 5,
        wbsPerProject: 10,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: Phase 8까지 모두 생성되었는지 확인
      expect(response.body.success).toBe(true);

      const phases = response.body.results.map((r: any) => r.phase);
      console.log(`\n생성된 Phase: ${phases.join(', ')}`);

      expect(phases).toContain('Phase1');
      expect(phases).toContain('Phase2');
      expect(phases).toContain('Phase3');
      expect(phases).toContain('Phase4');
      expect(phases).toContain('Phase5');
      expect(phases).toContain('Phase6');
      expect(phases).toContain('Phase7');
      expect(phases).toContain('Phase8');

      // 각 Phase의 엔티티 수 확인
      console.log('\n========== 각 Phase별 생성 데이터 ==========');
      response.body.results.forEach((result: any) => {
        console.log(`\n[${result.phase}]`);
        Object.entries(result.entityCounts).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}개`);
        });
      });

      // Phase7 검증 (평가 실행)
      const phase7Result = response.body.results.find(
        (r: any) => r.phase === 'Phase7',
      );
      expect(phase7Result).toBeDefined();
      expect(phase7Result.entityCounts.WbsSelfEvaluation).toBeGreaterThan(0);
      expect(phase7Result.entityCounts.DownwardEvaluation).toBeGreaterThan(0);
      expect(phase7Result.entityCounts.PeerEvaluation).toBeGreaterThan(0);
      expect(phase7Result.entityCounts.FinalEvaluation).toBeGreaterThan(0);

      console.log('\n✓ FULL 시나리오 전체 평가 사이클 생성 완료');
    });
  });

  describe('실제 데이터가 없을 때 Fallback', () => {
    it('실제 데이터가 없으면 faker 데이터로 대체해야 함', async () => {
      // Given: 실제 데이터 없음 (cleanupBeforeTest로 모두 삭제됨)
      const config = {
        scenario: 'minimal',
        clearExisting: true,
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: faker로 대체되어 정상 생성됨
      expect(response.body.success).toBe(true);

      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();
      expect(phase1Result.entityCounts.Department).toBeGreaterThanOrEqual(1);
      expect(phase1Result.entityCounts.Employee).toBeGreaterThanOrEqual(1);

      console.log('\n✓ 실제 데이터가 없어도 faker로 대체되어 정상 생성됨');
      console.log(`  - 부서: ${phase1Result.entityCounts.Department}개`);
      console.log(`  - 직원: ${phase1Result.entityCounts.Employee}명`);
    });
  });

  describe('실제 데이터와 평가 라인 매핑', () => {
    it('실제 직원 간의 평가 라인이 올바르게 매핑되어야 함', async () => {
      // Given: 실제 부서와 직원 생성
      const realDepartmentIds = await 실제_부서_데이터를_생성한다(2);
      const realEmployeeIds = await 실제_직원_데이터를_생성한다(
        10,
        realDepartmentIds,
      );

      const config = {
        scenario: 'with_setup', // with_setup으로 Phase4까지 실행
        clearExisting: false,
        projectCount: 3,
        wbsPerProject: 5,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: Phase4 (평가 라인) 검증
      const phase4Result = response.body.results.find(
        (r: any) => r.phase === 'Phase4',
      );
      expect(phase4Result).toBeDefined();
      expect(phase4Result.entityCounts.EvaluationLine).toBeGreaterThan(0);
      expect(phase4Result.entityCounts.EvaluationLineMapping).toBeGreaterThan(
        0,
      );

      // 평가 라인 매핑 확인
      const lineMappings = await dataSource.query(`
        SELECT DISTINCT elm."employeeId", elm."evaluatorId", el."evaluatorType"
        FROM "evaluation_line_mappings" elm
        JOIN "evaluation_lines" el ON el.id = elm."evaluationLineId"
        WHERE elm."deletedAt" IS NULL
        LIMIT 10
      `);

      console.log('\n========== 평가 라인 매핑 샘플 ==========');
      lineMappings.forEach((mapping: any, idx: number) => {
        const empIsReal = realEmployeeIds.includes(mapping.employeeId);
        const evaluatorIsReal = realEmployeeIds.includes(mapping.evaluatorId);
        console.log(
          `${idx + 1}. ${mapping.evaluatorType}: ` +
            `Employee(${empIsReal ? '실제' : 'faker'}) ← ` +
            `Evaluator(${evaluatorIsReal ? '실제' : 'faker'})`,
        );
      });

      // 모든 매핑이 실제 직원 ID를 사용하는지 확인
      lineMappings.forEach((mapping: any) => {
        expect(realEmployeeIds).toContain(mapping.employeeId);
        expect(realEmployeeIds).toContain(mapping.evaluatorId);
      });

      console.log('\n✓ 평가 라인 매핑이 실제 직원 ID를 사용함');
    });
  });

  describe('성능 및 대용량 데이터', () => {
    it('실제 직원 100명으로 FULL 시나리오를 생성해야 함', async () => {
      // Given: 대량의 실제 데이터
      const realDepartmentIds = await 실제_부서_데이터를_생성한다(3);
      const realEmployeeIds = await 실제_직원_데이터를_생성한다(
        100,
        realDepartmentIds,
      );

      console.log(`\n실제 부서: ${realDepartmentIds.length}개`);
      console.log(`실제 직원: ${realEmployeeIds.length}개`);

      const config = {
        scenario: 'full',
        clearExisting: false,
        projectCount: 20,
        wbsPerProject: 15,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When
      const startTime = Date.now();
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);
      const endTime = Date.now();

      // Then
      expect(response.body.success).toBe(true);

      const duration = endTime - startTime;
      console.log(`\n총 소요 시간: ${duration}ms`);
      console.log(`서버 처리 시간: ${response.body.totalDuration}ms`);

      // 각 Phase별 소요 시간
      console.log('\n========== Phase별 소요 시간 ==========');
      response.body.results.forEach((result: any) => {
        console.log(`${result.phase}: ${result.duration}ms`);
      });

      // 생성된 데이터 수 확인
      const totalEntities = response.body.results.reduce(
        (sum: number, result: any) => {
          const count: number = (
            Object.values(result.entityCounts) as number[]
          ).reduce((s: number, c: number) => s + c, 0);
          return sum + count;
        },
        0,
      );

      console.log(`\n총 생성된 엔티티: ${totalEntities}개`);
      expect(totalEntities).toBeGreaterThan(100);

      console.log('\n✓ 대용량 실제 데이터로 FULL 시나리오 생성 완료');
    }, 120000); // 120초 타임아웃
  });
});
