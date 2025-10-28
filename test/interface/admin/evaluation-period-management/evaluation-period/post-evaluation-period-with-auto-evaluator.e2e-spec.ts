import { BaseE2ETest } from '../../../../base-e2e.spec';
import { HttpStatus } from '@nestjs/common';

describe('EvaluationPeriodManagement POST /evaluation-periods with Auto Evaluator Assignment (e2e)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터베이스 정리
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    // 각 테스트 후 데이터베이스 정리 (선택적)
    // await testSuite.cleanupAfterTest();
  });

  describe('POST /admin/evaluation-periods with Auto Evaluator Assignment', () => {
    it('평가기간 생성 시 모든 활성 직원이 평가 대상자로 등록되고 1차 평가자가 자동 할당되어야 한다', async () => {
      // Given: 테스트 데이터 생성
      const departments = [];
      const employees = [];
      
      // 부서 생성
      for (let i = 0; i < 3; i++) {
        const dept = await testSuite.dataSource
          .getRepository('Department')
          .save({
            name: `테스트부서${i + 1}`,
            code: `DEPT${i + 1}`,
            externalId: `ext_dept_${i + 1}`,
            parentDepartmentId: null,
            managerId: null, // 나중에 설정
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
          });
        departments.push(dept);
      }

      // 직원 생성
      for (let i = 0; i < 10; i++) {
        const deptIndex = Math.floor(i / 4); // 4명씩 부서에 배치
        const emp = await testSuite.dataSource
          .getRepository('Employee')
          .save({
            name: `테스트직원${i + 1}`,
            employeeNumber: `EMP${String(i + 1).padStart(3, '0')}`,
            email: `emp${i + 1}@test.com`,
            externalId: `ext_emp_${i + 1}`,
            departmentId: departments[deptIndex].id,
            status: '재직중',
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
          });
        employees.push(emp);
      }

      // 부서장 설정 (각 부서의 첫 번째 직원을 부서장으로 설정)
      for (let i = 0; i < departments.length; i++) {
        const department = departments[i];
        const manager = employees[i * 4]; // 각 부서의 첫 번째 직원을 부서장으로
        
        await testSuite.dataSource
          .getRepository('Department')
          .update(department.id, { managerId: manager.id });
        
      }


      // 유효한 평가 기간 생성 데이터
      const createData = {
        name: '2024년 하반기 평가 (자동 평가자 할당)',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '2024년 하반기 성과 평가 - 자동 평가자 할당 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      };

      // When: 평가기간 생성 (자동 평가자 할당 포함)
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);


      // Then: 응답 데이터 검증
      expect(response.body).toMatchObject({
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
        status: 'waiting',
      });

      // 평가 대상자 등록 확인
      const evaluationTargetsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${response.body.id}/targets`)
        .expect(HttpStatus.OK);


      // 모든 활성 직원이 평가 대상자로 등록되었는지 확인
      expect(evaluationTargetsResponse.body).toBeDefined();
      expect(evaluationTargetsResponse.body.targets).toBeDefined();
      expect(Array.isArray(evaluationTargetsResponse.body.targets)).toBe(true);
      expect(evaluationTargetsResponse.body.targets.length).toBe(employees.length);

             // 1차 평가자 자동 할당 확인
             let autoAssignedCount = 0;
             let noManagerCount = 0;

             for (const target of evaluationTargetsResponse.body.targets) {
               // 각 직원의 1차 평가자 매핑 확인
               const evaluationLineResponse = await testSuite
                 .request()
                 .get(`/admin/evaluation-criteria/evaluation-lines/employee/${target.employee.id}/period/${response.body.id}/settings`)
                 .expect(HttpStatus.OK);


               // evaluationLineMappings에 매핑이 있으면 1차 평가자가 할당된 것으로 간주
               // (wbsItemId가 null인 매핑은 직원별 고정 담당자, 즉 1차 평가자)
               const primaryEvaluator = evaluationLineResponse.body.evaluationLineMappings.find(
                 (line: any) => line.wbsItemId === null
               );

               if (primaryEvaluator) {
                 autoAssignedCount++;
               } else {
                 noManagerCount++;
               }
             }


      // 최소한 일부 직원은 1차 평가자가 할당되어야 함
      expect(autoAssignedCount).toBeGreaterThan(0);
      expect(autoAssignedCount + noManagerCount).toBe(employees.length);
    });

    it('부서장이 없는 직원은 1차 평가자가 할당되지 않아야 한다', async () => {
      // Given: 부서장이 없는 상황 설정
      const departments = [];
      const employees = [];
      
      // 부서 생성 (부서장 없음)
      for (let i = 0; i < 2; i++) {
        const dept = await testSuite.dataSource
          .getRepository('Department')
          .save({
            name: `부서장없는부서${i + 1}`,
            code: `NO_MGR${i + 1}`,
            externalId: `ext_no_mgr_${i + 1}`,
            parentDepartmentId: null,
            managerId: null, // 부서장 없음
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
          });
        departments.push(dept);
      }

      // 직원 생성
      for (let i = 0; i < 5; i++) {
        const deptIndex = Math.floor(i / 3); // 3명씩 부서에 배치
        const emp = await testSuite.dataSource
          .getRepository('Employee')
          .save({
            name: `부서장없는직원${i + 1}`,
            employeeNumber: `NO_MGR_EMP${String(i + 1).padStart(3, '0')}`,
            email: `no_mgr_emp${i + 1}@test.com`,
            externalId: `ext_no_mgr_emp_${i + 1}`,
            departmentId: departments[deptIndex].id,
            status: '재직중',
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
          });
        employees.push(emp);
      }


      const createData = {
        name: '부서장 없는 평가기간 테스트',
        startDate: '2024-08-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '부서장이 없는 상황에서의 평가기간 생성 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
        ],
      };

      // When: 평가기간 생성
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      // Then: 평가 대상자는 등록되지만 1차 평가자는 할당되지 않아야 함
      const evaluationTargetsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${response.body.id}/targets`)
        .expect(HttpStatus.OK);

      expect(evaluationTargetsResponse.body).toBeDefined();
      expect(evaluationTargetsResponse.body.targets).toBeDefined();
      expect(Array.isArray(evaluationTargetsResponse.body.targets)).toBe(true);
      expect(evaluationTargetsResponse.body.targets.length).toBe(employees.length);

      // 1차 평가자 할당 확인
      let autoAssignedCount = 0;
      for (const target of evaluationTargetsResponse.body.targets) {
        const evaluationLineResponse = await testSuite
          .request()
          .get(`/admin/evaluation-criteria/evaluation-lines/employee/${target.employee.id}/period/${response.body.id}/settings`)
          .expect(HttpStatus.OK);

        const primaryEvaluator = evaluationLineResponse.body.evaluationLineMappings.find(
          (line: any) => line.evaluatorType === 'PRIMARY'
        );

        if (primaryEvaluator) {
          autoAssignedCount++;
        }
      }


      // 부서장이 없으므로 1차 평가자가 할당되지 않아야 함
      expect(autoAssignedCount).toBe(0);
    });

    it('본인이 부서장인 경우 상위 부서의 부서장이 1차 평가자로 할당되어야 한다', async () => {
      // Given: 계층적 부서 구조 설정
      const departments = [];
      const employees = [];
      
      // 상위 부서 생성
      const parentDept = await testSuite.dataSource
        .getRepository('Department')
        .save({
          name: '상위부서',
          code: 'PARENT',
          externalId: 'ext_parent_dept',
          parentDepartmentId: null,
          managerId: null, // 나중에 설정
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
      departments.push(parentDept);

      // 하위 부서들 생성
      for (let i = 0; i < 2; i++) {
        const childDept = await testSuite.dataSource
          .getRepository('Department')
          .save({
            name: `하위부서${i + 1}`,
            code: `CHILD${i + 1}`,
            externalId: `ext_child_dept_${i + 1}`,
            parentDepartmentId: parentDept.id,
            managerId: null, // 나중에 설정
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
          });
        departments.push(childDept);
      }

      // 직원들 생성
      const parentManager = await testSuite.dataSource
        .getRepository('Employee')
        .save({
          name: '상위부서장',
          employeeNumber: 'PARENT_MGR',
          email: 'parent_mgr@test.com',
          externalId: 'ext_parent_mgr',
          departmentId: parentDept.id,
          status: '재직중',
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
      employees.push(parentManager);

      const child1Manager = await testSuite.dataSource
        .getRepository('Employee')
        .save({
          name: '하위부서1장',
          employeeNumber: 'CHILD1_MGR',
          email: 'child1_mgr@test.com',
          externalId: 'ext_child1_mgr',
          departmentId: departments[1].id,
          status: '재직중',
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
      employees.push(child1Manager);

      const child2Manager = await testSuite.dataSource
        .getRepository('Employee')
        .save({
          name: '하위부서2장',
          employeeNumber: 'CHILD2_MGR',
          email: 'child2_mgr@test.com',
          externalId: 'ext_child2_mgr',
          departmentId: departments[2].id,
          status: '재직중',
          externalCreatedAt: new Date(),
          externalUpdatedAt: new Date(),
        });
      employees.push(child2Manager);

      // 일반 직원들 생성
      for (let i = 0; i < 3; i++) {
        const deptIndex = i < 2 ? 1 : 2; // 하위부서1에 2명, 하위부서2에 1명
        const emp = await testSuite.dataSource
          .getRepository('Employee')
          .save({
            name: `일반직원${i + 1}`,
            employeeNumber: `EMP${i + 1}`,
            email: `emp${i + 1}@test.com`,
            externalId: `ext_emp_${i + 1}`,
            departmentId: departments[deptIndex].id,
            status: '재직중',
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
          });
        employees.push(emp);
      }

      // 부서장 설정
      await testSuite.dataSource
        .getRepository('Department')
        .update(parentDept.id, { managerId: parentManager.id });
      
      await testSuite.dataSource
        .getRepository('Department')
        .update(departments[1].id, { managerId: child1Manager.id });
      
      await testSuite.dataSource
        .getRepository('Department')
        .update(departments[2].id, { managerId: child2Manager.id });


      const createData = {
        name: '계층적 부서 구조 평가기간',
        startDate: '2024-09-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '계층적 부서 구조에서의 평가기간 생성 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
        ],
      };

      // When: 평가기간 생성
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      // Then: 각 직원의 1차 평가자 확인
      const evaluationTargetsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${response.body.id}/targets`)
        .expect(HttpStatus.OK);


      expect(evaluationTargetsResponse.body).toBeDefined();
      expect(evaluationTargetsResponse.body.targets).toBeDefined();
      expect(Array.isArray(evaluationTargetsResponse.body.targets)).toBe(true);

      // 최소한 일부 직원은 1차 평가자가 할당되어야 함
      let autoAssignedCount = 0;
      for (const target of evaluationTargetsResponse.body.targets) {
        const evaluationLineResponse = await testSuite
          .request()
          .get(`/admin/evaluation-criteria/evaluation-lines/employee/${target.employee.id}/period/${response.body.id}/settings`)
          .expect(HttpStatus.OK);

        const primaryEvaluator = evaluationLineResponse.body.evaluationLineMappings.find(
          (line: any) => line.wbsItemId === null
        );

        if (primaryEvaluator) {
          autoAssignedCount++;
        }
      }

      expect(autoAssignedCount).toBeGreaterThan(0);
    });

    it('잘못된 데이터로 평가기간 생성 시 적절한 에러가 발생해야 한다', async () => {
      // Given: 잘못된 평가기간 생성 데이터
      const invalidCreateData = {
        name: '', // 빈 이름
        startDate: 'invalid-date', // 잘못된 날짜 형식
        peerEvaluationDeadline: '2024-01-01', // 시작일보다 이른 마감일
        description: '잘못된 데이터 테스트',
        maxSelfEvaluationRate: -10, // 음수 값
        gradeRanges: [
          { grade: 'A', minRange: 100, maxRange: 80 }, // 잘못된 범위
        ],
      };

      // When & Then: 400 에러 발생 확인
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(invalidCreateData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('중복된 평가기간 이름으로 생성 시 409 에러가 발생해야 한다', async () => {
      // Given: 기존 평가기간 생성
      const existingPeriod = await testSuite.dataSource
        .getRepository('EvaluationPeriod')
        .save({
          name: '중복테스트평가기간',
          startDate: new Date('2024-01-01'),
          peerEvaluationDeadline: new Date('2024-06-30'),
          description: '중복 테스트용 기존 평가기간',
          maxSelfEvaluationRate: 120,
          status: 'waiting',
          currentPhase: 'waiting',
        });

      // 기존 평가기간이 생성되었는지 확인

      const duplicateCreateData = {
        name: existingPeriod.name, // 중복된 이름
        startDate: '2024-10-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '중복 이름 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
        ],
      };

      // When & Then: 409 에러 발생 확인
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(duplicateCreateData)
        .expect(HttpStatus.CONFLICT);
    });
  });
});
