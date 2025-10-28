import { BaseE2ETest } from '../../../base-e2e.spec';
import { HttpStatus } from '@nestjs/common';

describe('대시보드 API 검증 (1차 평가자 자동 할당)', () => {
  let testSuite: BaseE2ETest;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('평가기간 생성 후 대시보드 API 검증', () => {
    it('평가기간 생성 후 모든 직원 현황 조회가 정상 작동해야 한다', async () => {
      // Given: 테스트 데이터 생성 (부서장이 있는 구조)
      const departments: any[] = [];
      const employees: any[] = [];

      // 상위 부서 생성
      const parentDept = await testSuite.getRepository('Department').save({
        name: '개발팀',
        code: 'DEV',
        order: 1,
        managerId: null,
        parentDepartmentId: null,
        externalId: 'dept-parent-001',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
      });

      // 하위 부서들 생성
      for (let i = 0; i < 3; i++) {
        const dept = await testSuite.getRepository('Department').save({
          name: `개발팀-${i + 1}파트`,
          code: `DEV-${i + 1}`,
          order: i + 1,
          managerId: null,
          parentDepartmentId: parentDept.id,
          externalId: `dept-child-${i + 1}`,
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
        departments.push(dept);
      }

      // 직원들 생성
      for (let i = 0; i < 5; i++) {
        const emp = await testSuite.getRepository('Employee').save({
          name: `직원${i + 1}`,
          employeeNumber: `EMP${String(i + 1).padStart(3, '0')}`,
          email: `emp${i + 1}@company.com`,
          departmentId: departments[i % departments.length].id,
          isActive: true,
          externalId: `emp-${i + 1}`,
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
        employees.push(emp);
      }

      // 부서장 설정 (첫 번째 직원을 부서장으로)
      for (let i = 0; i < departments.length; i++) {
        await testSuite
          .getRepository('Department')
          .update(departments[i].id, { managerId: employees[i].id });
      }

      // 평가기간 생성
      const createData = {
        name: '2024년 하반기 평가 (대시보드 검증)',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '대시보드 API 검증용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      };

      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = response.body.id;

      // When: 모든 직원 현황 조회
      const employeesStatusResponse = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .expect(HttpStatus.OK);

      // Then: 검증
      expect(employeesStatusResponse.body).toBeDefined();
      expect(Array.isArray(employeesStatusResponse.body)).toBe(true);
      expect(employeesStatusResponse.body.length).toBe(employees.length);

      // 각 직원의 현황 검증
      for (const status of employeesStatusResponse.body) {
        expect(status).toHaveProperty('evaluationPeriod');
        expect(status).toHaveProperty('employee');
        expect(status).toHaveProperty('isEvaluationTarget');
        expect(status).toHaveProperty('exclusionInfo');
        expect(status).toHaveProperty('evaluationCriteria');
        expect(status).toHaveProperty('wbsCriteria');
        expect(status).toHaveProperty('evaluationLine');

        // 평가기간 정보 검증
        expect(status.evaluationPeriod.id).toBe(evaluationPeriodId);
        expect(status.evaluationPeriod.name).toBe(createData.name);

        // 직원 정보 검증
        expect(status.employee).toHaveProperty('id');
        expect(status.employee).toHaveProperty('name');
        expect(status.employee).toHaveProperty('employeeNumber');

        // 평가 대상자 여부 검증
        expect(status.isEvaluationTarget).toBe(true);

        // 제외 정보 검증
        expect(status.exclusionInfo).toHaveProperty('isExcluded');
        expect(status.exclusionInfo.isExcluded).toBe(false);

        // 상태 값 검증
        expect(['complete', 'in_progress', 'none']).toContain(status.evaluationCriteria.status);
        expect(['complete', 'in_progress', 'none']).toContain(status.wbsCriteria.status);
        expect(['complete', 'in_progress', 'none']).toContain(status.evaluationLine.status);
      }

      console.log(`✅ 모든 직원 현황 조회 성공: ${employeesStatusResponse.body.length}명`);
    });

    it('평가기간 생성 후 평가자별 담당 대상자 조회가 정상 작동해야 한다', async () => {
      // Given: 테스트 데이터 생성 (부서장이 있는 구조)
      const departments: any[] = [];
      const employees: any[] = [];

      // 상위 부서 생성
      const parentDept = await testSuite.getRepository('Department').save({
        name: '개발팀',
        code: 'DEV',
        order: 1,
        managerId: null,
        parentDepartmentId: null,
        externalId: 'dept-parent-002',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
      });

      // 하위 부서들 생성
      for (let i = 0; i < 2; i++) {
        const dept = await testSuite.getRepository('Department').save({
          name: `개발팀-${i + 1}파트`,
          code: `DEV-${i + 1}`,
          order: i + 1,
          managerId: null,
          parentDepartmentId: parentDept.id,
          externalId: `dept-child-${i + 1}`,
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
        departments.push(dept);
      }

      // 직원들 생성
      for (let i = 0; i < 4; i++) {
        const emp = await testSuite.getRepository('Employee').save({
          name: `직원${i + 1}`,
          employeeNumber: `EMP${String(i + 1).padStart(3, '0')}`,
          email: `emp${i + 1}@company.com`,
          departmentId: departments[i % departments.length].id,
          isActive: true,
          externalId: `emp-${i + 1}`,
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
        employees.push(emp);
      }

      // 부서장 설정 (첫 번째와 두 번째 직원을 부서장으로)
      await testSuite
        .getRepository('Department')
        .update(departments[0].id, { managerId: employees[0].id });
      await testSuite
        .getRepository('Department')
        .update(departments[1].id, { managerId: employees[1].id });

      // 평가기간 생성
      const createData = {
        name: '2024년 하반기 평가 (평가자 검증)',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '평가자별 담당 대상자 조회 검증용 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      };

      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = response.body.id;

      // When: 각 평가자별 담당 대상자 조회
      for (const evaluator of employees) {
        const myTargetsResponse = await testSuite
          .request()
          .get(`/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluator.id}/status`)
          .expect(HttpStatus.OK);

        // Then: 검증
        expect(myTargetsResponse.body).toBeDefined();
        expect(Array.isArray(myTargetsResponse.body)).toBe(true);

        // 평가자 본인은 담당 대상자에 포함되지 않아야 함
        if (myTargetsResponse.body.length > 0) {
          const selfTarget = myTargetsResponse.body.find(
            (target: any) => target.employee && target.employee.id === evaluator.id
          );
          expect(selfTarget).toBeUndefined();
        }

        // 담당 대상자들의 정보 검증
        for (const target of myTargetsResponse.body) {
          expect(target).toHaveProperty('employeeId');
          expect(target).toHaveProperty('isEvaluationTarget');
          expect(target).toHaveProperty('exclusionInfo');
          expect(target).toHaveProperty('evaluationCriteria');
          expect(target).toHaveProperty('wbsCriteria');
          expect(target).toHaveProperty('evaluationLine');
          expect(target).toHaveProperty('myEvaluatorTypes');
          expect(target).toHaveProperty('downwardEvaluation');

          // 평가 대상자 여부 검증
          expect(target.isEvaluationTarget).toBe(true);

          // 제외 정보 검증
          expect(target.exclusionInfo).toHaveProperty('isExcluded');
          expect(target.exclusionInfo.isExcluded).toBe(false);

          // 평가자 유형 검증 (배열이 비어있을 수 있음)
          expect(Array.isArray(target.myEvaluatorTypes)).toBe(true);
        }

        console.log(`✅ 평가자 ${evaluator.name}의 담당 대상자 조회 성공: ${myTargetsResponse.body.length}명`);
      }
    });

    it('부서장이 없는 경우에도 대시보드 API가 정상 작동해야 한다', async () => {
      // Given: 부서장이 없는 테스트 데이터 생성
      const departments: any[] = [];
      const employees: any[] = [];

      // 부서 생성 (부서장 없음)
      for (let i = 0; i < 2; i++) {
        const dept = await testSuite.getRepository('Department').save({
          name: `부서${i + 1}`,
          code: `DEPT-${i + 1}`,
          order: i + 1,
          managerId: null, // 부서장 없음
          parentDepartmentId: null,
          externalId: `dept-${i + 1}`,
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
        departments.push(dept);
      }

      // 직원들 생성
      for (let i = 0; i < 3; i++) {
        const emp = await testSuite.getRepository('Employee').save({
          name: `직원${i + 1}`,
          employeeNumber: `EMP${String(i + 1).padStart(3, '0')}`,
          email: `emp${i + 1}@company.com`,
          departmentId: departments[i % departments.length].id,
          isActive: true,
          externalId: `emp-${i + 1}`,
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
        employees.push(emp);
      }

      // 평가기간 생성
      const createData = {
        name: '2024년 하반기 평가 (부서장 없음)',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '부서장이 없는 경우 대시보드 API 검증',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      };

      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = response.body.id;

      // When: 모든 직원 현황 조회
      const employeesStatusResponse = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .expect(HttpStatus.OK);

      // Then: 검증
      expect(employeesStatusResponse.body).toBeDefined();
      expect(Array.isArray(employeesStatusResponse.body)).toBe(true);
      expect(employeesStatusResponse.body.length).toBe(employees.length);

      // When: 각 평가자별 담당 대상자 조회 (1차 평가자가 할당되지 않았으므로 빈 배열이어야 함)
      for (const evaluator of employees) {
        const myTargetsResponse = await testSuite
          .request()
          .get(`/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluator.id}/status`)
          .expect(HttpStatus.OK);

        // Then: 검증 (부서장이 없으므로 담당 대상자가 없어야 함)
        expect(myTargetsResponse.body).toBeDefined();
        expect(Array.isArray(myTargetsResponse.body)).toBe(true);
        expect(myTargetsResponse.body.length).toBe(0);

        console.log(`✅ 평가자 ${evaluator.name}의 담당 대상자 조회 성공: ${myTargetsResponse.body.length}명 (부서장 없음)`);
      }

      console.log(`✅ 부서장 없는 경우 대시보드 API 정상 작동: ${employeesStatusResponse.body.length}명`);
    });
  });
});
