import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('시드 데이터 품질 검증 테스트', () => {
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

  describe('Phase 1: 조직 데이터 품질 검증', () => {
    it('Department, Employee, Project, WbsItem이 정확한 개수로 생성되어야 함', async () => {
      // Given: MINIMAL 시나리오로 데이터 생성
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      // When: 시드 데이터 생성
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then: 데이터베이스에서 직접 확인
      const departments = await dataSource.query(
        'SELECT * FROM department WHERE "deletedAt" IS NULL',
      );
      const employees = await dataSource.query(
        'SELECT * FROM employee WHERE "deletedAt" IS NULL',
      );
      const projects = await dataSource.query(
        'SELECT * FROM project WHERE "deletedAt" IS NULL',
      );
      const wbsItems = await dataSource.query(
        'SELECT * FROM wbs_item WHERE "deletedAt" IS NULL',
      );

      console.log('\n=== 생성된 데이터 개수 ===');
      console.log(`Department: ${departments.length}개`);
      console.log(`Employee: ${employees.length}개`);
      console.log(`Project: ${projects.length}개`);
      console.log(`WbsItem: ${wbsItems.length}개`);

      // 최소 개수 확인 (계층 구조로 인해 정확히 일치하지 않을 수 있음)
      expect(departments.length).toBeGreaterThanOrEqual(5);
      expect(employees.length).toBe(10);
      expect(projects.length).toBe(3);
      expect(wbsItems.length).toBeGreaterThanOrEqual(15); // 3개 프로젝트 * 5개 WBS
    });

    it('Department 계층 구조가 올바르게 생성되어야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 10,
          employeeCount: 5,
          projectCount: 1,
          wbsPerProject: 1,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When: 부서 계층 구조 조회
      const departments = await dataSource.query(`
        SELECT id, name, code, "parentDepartmentId", "order"
        FROM department 
        WHERE "deletedAt" IS NULL
        ORDER BY "order"
      `);

      // Then
      console.log('\n=== Department 계층 구조 ===');
      departments.forEach((dept: any) => {
        const indent = dept.parentDepartmentId ? '  └─ ' : '';
        console.log(
          `${indent}${dept.code}: ${dept.name} (ID: ${dept.id.substring(0, 8)}...)`,
        );
      });

      // 최상위 부서가 있어야 함
      const rootDepts = departments.filter((d: any) => !d.parentDepartmentId);
      expect(rootDepts.length).toBeGreaterThan(0);

      // 하위 부서가 있어야 함 (10개 중 일부는 하위 부서여야 함)
      const childDepts = departments.filter((d: any) => d.parentDepartmentId);
      expect(childDepts.length).toBeGreaterThan(0);

      // 모든 하위 부서의 parentDepartmentId가 유효해야 함
      const allDeptIds = departments.map((d: any) => d.id);
      childDepts.forEach((child: any) => {
        expect(allDeptIds).toContain(child.parentDepartmentId);
      });
    });

    it('Employee가 Department에 올바르게 할당되어야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 10,
          projectCount: 1,
          wbsPerProject: 1,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const employees = await dataSource.query(`
        SELECT e.id, e."employeeNumber", e.name, e."departmentId", d.name as "deptName"
        FROM employee e
        LEFT JOIN department d ON e."departmentId" = d.id
        WHERE e."deletedAt" IS NULL
      `);

      // Then
      console.log('\n=== Employee → Department 할당 ===');
      employees.forEach((emp: any, idx: number) => {
        console.log(
          `${idx + 1}. ${emp.employeeNumber} ${emp.name} → ${emp.deptName || 'N/A'}`,
        );
      });

      // 모든 직원이 부서를 가져야 함
      employees.forEach((emp: any) => {
        expect(emp.departmentId).toBeTruthy();
        expect(emp.deptName).toBeTruthy();
      });

      // Employee의 departmentId가 실제 존재하는 부서여야 함
      const deptIds = await dataSource.query(
        'SELECT id FROM department WHERE "deletedAt" IS NULL',
      );
      const validDeptIds = deptIds.map((d: any) => d.id);

      employees.forEach((emp: any) => {
        expect(validDeptIds).toContain(emp.departmentId);
      });
    });

    it('Project의 manager가 실제 존재하는 Employee여야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 10,
          projectCount: 5,
          wbsPerProject: 1,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const projects = await dataSource.query(`
        SELECT p.id, p.name, p."projectCode", p."managerId", e.name as "managerName"
        FROM project p
        LEFT JOIN employee e ON p."managerId" = e.id
        WHERE p."deletedAt" IS NULL
      `);

      // Then
      console.log('\n=== Project → Manager 할당 ===');
      projects.forEach((proj: any) => {
        console.log(
          `${proj.projectCode}: ${proj.name} → PM: ${proj.managerName || '미배정'}`,
        );
      });

      // managerId가 있는 경우, 실제 존재하는 직원이어야 함
      const employeeIds = await dataSource.query(
        'SELECT id FROM employee WHERE "deletedAt" IS NULL',
      );
      const validEmpIds = employeeIds.map((e: any) => e.id);

      projects.forEach((proj: any) => {
        if (proj.managerId) {
          expect(validEmpIds).toContain(proj.managerId);
        }
      });
    });

    it('WbsItem 계층 구조가 올바르게 생성되어야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 2,
          employeeCount: 5,
          projectCount: 2,
          wbsPerProject: 10,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const wbsItems = await dataSource.query(`
        SELECT w.id, w."wbsCode", w.title, w.level, w."parentWbsId", w."projectId", p.name as "projectName"
        FROM wbs_item w
        LEFT JOIN project p ON w."projectId" = p.id
        WHERE w."deletedAt" IS NULL
        ORDER BY w."projectId", w.level, w."wbsCode"
      `);

      // Then
      console.log('\n=== WbsItem 계층 구조 (프로젝트별) ===');
      let currentProjectId = null;
      wbsItems.forEach((wbs: any) => {
        if (wbs.projectId !== currentProjectId) {
          console.log(`\n[프로젝트: ${wbs.projectName}]`);
          currentProjectId = wbs.projectId;
        }
        const indent = '  '.repeat(wbs.level - 1);
        console.log(
          `${indent}└─ Lv${wbs.level} ${wbs.wbsCode}: ${wbs.title.substring(0, 30)}...`,
        );
      });

      // 최상위 WBS (level 1)가 있어야 함
      const rootWbs = wbsItems.filter((w: any) => w.level === 1);
      expect(rootWbs.length).toBeGreaterThan(0);

      // 모든 WBS의 projectId가 유효해야 함
      const projectIds = await dataSource.query(
        'SELECT id FROM project WHERE "deletedAt" IS NULL',
      );
      const validProjIds = projectIds.map((p: any) => p.id);

      wbsItems.forEach((wbs: any) => {
        expect(validProjIds).toContain(wbs.projectId);
      });

      // 하위 WBS의 parentWbsId가 유효해야 함
      const allWbsIds = wbsItems.map((w: any) => w.id);
      const childWbs = wbsItems.filter((w: any) => w.parentWbsId);

      childWbs.forEach((child: any) => {
        expect(allWbsIds).toContain(child.parentWbsId);
      });
    });
  });

  describe('Phase 2: 평가기간 데이터 품질 검증', () => {
    it('EvaluationPeriod와 직원 매핑이 올바르게 생성되어야 함', async () => {
      // Given
      const config = {
        scenario: 'with_period',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 10,
          projectCount: 2,
          wbsPerProject: 3,
        },
        evaluationConfig: {
          periodCount: 2,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const periods = await dataSource.query(`
        SELECT id, name, "startDate", "endDate", status, phase
        FROM evaluation_period
        WHERE "deletedAt" IS NULL
      `);

      const mappings = await dataSource.query(`
        SELECT epm.id, epm."periodId", epm."employeeId", ep.name as "periodName", e.name as "employeeName"
        FROM evaluation_period_employee_mapping epm
        LEFT JOIN evaluation_period ep ON epm."periodId" = ep.id
        LEFT JOIN employee e ON epm."employeeId" = e.id
        WHERE epm."deletedAt" IS NULL
      `);

      // Then
      console.log('\n=== EvaluationPeriod ===');
      periods.forEach((period: any) => {
        console.log(
          `${period.name} (${period.status}, Phase: ${period.phase})`,
        );
        console.log(
          `  기간: ${new Date(period.startDate).toLocaleDateString()} ~ ${new Date(period.endDate).toLocaleDateString()}`,
        );
      });

      console.log('\n=== 직원 매핑 (샘플 5개) ===');
      mappings.slice(0, 5).forEach((mapping: any, idx: number) => {
        console.log(
          `${idx + 1}. ${mapping.employeeName} → ${mapping.periodName}`,
        );
      });
      console.log(`  ... 총 ${mappings.length}개`);

      expect(periods.length).toBe(2);
      expect(mappings.length).toBeGreaterThan(0);

      // 모든 매핑의 periodId와 employeeId가 유효해야 함
      const periodIds = periods.map((p: any) => p.id);
      const employeeIds = await dataSource.query(
        'SELECT id FROM employee WHERE "deletedAt" IS NULL',
      );
      const validEmpIds = employeeIds.map((e: any) => e.id);

      mappings.forEach((mapping: any) => {
        expect(periodIds).toContain(mapping.periodId);
        expect(validEmpIds).toContain(mapping.employeeId);
      });
    });
  });

  describe('Phase 3: 할당 데이터 품질 검증', () => {
    it('EvaluationProjectAssignment와 WbsAssignment가 올바르게 생성되어야 함', async () => {
      // Given
      const config = {
        scenario: 'with_assignments',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 1,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const projectAssignments = await dataSource.query(`
        SELECT 
          epa.id, 
          epa."employeeId", 
          epa."projectId", 
          e.name as "employeeName", 
          p.name as "projectName"
        FROM evaluation_project_assignment epa
        LEFT JOIN employee e ON epa."employeeId" = e.id
        LEFT JOIN project p ON epa."projectId" = p.id
        WHERE epa."deletedAt" IS NULL
      `);

      const wbsAssignments = await dataSource.query(`
        SELECT 
          ewa.id,
          ewa."employeeId",
          ewa."wbsItemId",
          e.name as "employeeName",
          w."wbsCode"
        FROM evaluation_wbs_assignment ewa
        LEFT JOIN employee e ON ewa."employeeId" = e.id
        LEFT JOIN wbs_item w ON ewa."wbsItemId" = w.id
        WHERE ewa."deletedAt" IS NULL
      `);

      // Then
      console.log('\n=== Project 할당 (샘플 5개) ===');
      projectAssignments.slice(0, 5).forEach((pa: any, idx: number) => {
        console.log(`${idx + 1}. ${pa.employeeName} → ${pa.projectName}`);
      });
      console.log(`  ... 총 ${projectAssignments.length}개`);

      console.log('\n=== WBS 할당 (샘플 5개) ===');
      wbsAssignments.slice(0, 5).forEach((wa: any, idx: number) => {
        console.log(`${idx + 1}. ${wa.employeeName} → ${wa.wbsCode}`);
      });
      console.log(`  ... 총 ${wbsAssignments.length}개`);

      expect(projectAssignments.length).toBeGreaterThan(0);
      expect(wbsAssignments.length).toBeGreaterThan(0);

      // FK 유효성 검증
      const employeeIds = await dataSource.query(
        'SELECT id FROM employee WHERE "deletedAt" IS NULL',
      );
      const projectIds = await dataSource.query(
        'SELECT id FROM project WHERE "deletedAt" IS NULL',
      );
      const wbsIds = await dataSource.query(
        'SELECT id FROM wbs_item WHERE "deletedAt" IS NULL',
      );

      const validEmpIds = employeeIds.map((e: any) => e.id);
      const validProjIds = projectIds.map((p: any) => p.id);
      const validWbsIds = wbsIds.map((w: any) => w.id);

      projectAssignments.forEach((pa: any) => {
        expect(validEmpIds).toContain(pa.employeeId);
        expect(validProjIds).toContain(pa.projectId);
      });

      wbsAssignments.forEach((wa: any) => {
        expect(validEmpIds).toContain(wa.employeeId);
        expect(validWbsIds).toContain(wa.wbsItemId);
      });
    });
  });

  describe('데이터 다양성 검증', () => {
    it('Employee 상태가 다양하게 생성되어야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 50, // 충분한 샘플 사이즈
          projectCount: 2,
          wbsPerProject: 3,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const statusCounts = await dataSource.query(`
        SELECT status, COUNT(*) as count
        FROM employee
        WHERE "deletedAt" IS NULL
        GROUP BY status
      `);

      // Then
      console.log('\n=== Employee 상태 분포 ===');
      statusCounts.forEach((sc: any) => {
        const percentage = ((sc.count / 50) * 100).toFixed(1);
        console.log(`${sc.status}: ${sc.count}명 (${percentage}%)`);
      });

      // 최소 2가지 이상의 상태가 있어야 함
      expect(statusCounts.length).toBeGreaterThanOrEqual(2);
    });

    it('Project 상태가 다양하게 생성되어야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 10,
          projectCount: 20, // 충분한 샘플 사이즈
          wbsPerProject: 3,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const statusCounts = await dataSource.query(`
        SELECT status, COUNT(*) as count
        FROM project
        WHERE "deletedAt" IS NULL
        GROUP BY status
      `);

      // Then
      console.log('\n=== Project 상태 분포 ===');
      statusCounts.forEach((sc: any) => {
        const percentage = ((sc.count / 20) * 100).toFixed(1);
        console.log(`${sc.status}: ${sc.count}개 (${percentage}%)`);
      });

      // 최소 2가지 이상의 상태가 있어야 함
      expect(statusCounts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
