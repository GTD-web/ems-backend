/**
 * 부서 하이라키 구조 조회 - 실제 데이터 기반 E2E 테스트
 *
 * minimal 시나리오를 사용하여 부서 하이라키 구조 조회 기능을 테스트합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('부서 하이라키 구조 조회 테스트 (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  let testDataCounts: {
    departmentCount: number;
    employeeCount: number;
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 시드 데이터 초기화
    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });

    // minimal 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'minimal',
        clearExisting: false,
      })
      .expect(201);

    // 생성된 데이터 개수 확인
    const deptCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM department WHERE "deletedAt" IS NULL`,
    );
    const empCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL`,
    );

    testDataCounts = {
      departmentCount: parseInt(deptCount[0].count, 10),
      employeeCount: parseInt(empCount[0].count, 10),
    };

    console.log('\n✅ 시드 데이터 생성 완료 (minimal)');
    console.log(`   - 부서: ${testDataCounts.departmentCount}개`);
    console.log(`   - 직원: ${testDataCounts.employeeCount}개\n`);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  function countDepartments(depts: any[]): number {
    return depts.reduce((sum, dept) => {
      return sum + 1 + countDepartments(dept.subDepartments || []);
    }, 0);
  }

  function countAllDescendants(dept: any): number {
    if (dept.subDepartments.length === 0) return 0;
    return dept.subDepartments.reduce((sum: number, child: any) => {
      return sum + 1 + countAllDescendants(child);
    }, 0);
  }

  function calculateDepth(dept: any): number {
    if (dept.subDepartments.length === 0) return 0;
    const childDepths = dept.subDepartments.map((child: any) =>
      calculateDepth(child),
    );
    return Math.max(...childDepths) + 1;
  }

  function validateLevels(depts: any[], expectedLevel: number) {
    depts.forEach((dept) => {
      expect(dept.level).toBe(expectedLevel);
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        validateLevels(dept.subDepartments, expectedLevel + 1);
      }
    });
  }

  function validateChildrenCount(depts: any[]) {
    depts.forEach((dept) => {
      expect(dept.childrenCount).toBe(dept.subDepartments.length);
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        validateChildrenCount(dept.subDepartments);
      }
    });
  }

  function validateLeafDepth(depts: any[]) {
    depts.forEach((dept) => {
      if (dept.subDepartments.length === 0) {
        expect(dept.depth).toBe(0);
        expect(dept.totalDescendants).toBe(0);
      } else {
        validateLeafDepth(dept.subDepartments);
      }
    });
  }

  function validateTotalDescendants(depts: any[]) {
    depts.forEach((dept) => {
      const expected = countAllDescendants(dept);
      expect(dept.totalDescendants).toBe(expected);
      if (dept.subDepartments.length > 0) {
        validateTotalDescendants(dept.subDepartments);
      }
    });
  }

  function validateDepth(depts: any[]) {
    depts.forEach((dept) => {
      const expected = calculateDepth(dept);
      expect(dept.depth).toBe(expected);
      if (dept.subDepartments.length > 0) {
        validateDepth(dept.subDepartments);
      }
    });
  }

  function validateEmployeeCount(depts: any[]) {
    depts.forEach((dept) => {
      expect(dept.employeeCount).toBe(dept.employees.length);
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        validateEmployeeCount(dept.subDepartments);
      }
    });
  }

  function validateEmployees(depts: any[]) {
    depts.forEach((dept) => {
      if (dept.employeeCount > 0) {
        expect(dept.employees.length).toBeGreaterThan(0);
      } else {
        expect(dept.employees.length).toBe(0);
      }
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        validateEmployees(dept.subDepartments);
      }
    });
  }

  function validateIsActive(depts: any[]) {
    depts.forEach((dept) => {
      dept.employees.forEach((emp: any) => {
        expect(typeof emp.isActive).toBe('boolean');
      });
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        validateIsActive(dept.subDepartments);
      }
    });
  }

  function countAllEmployees(depts: any[]): number {
    return depts.reduce((sum, dept) => {
      return (
        sum +
        dept.employees.length +
        countAllEmployees(dept.subDepartments || [])
      );
    }, 0);
  }

  function validateEmptyDepartments(depts: any[]) {
    depts.forEach((dept) => {
      if (dept.employeeCount === 0) {
        expect(dept.employees).toEqual([]);
      }
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        validateEmptyDepartments(dept.subDepartments);
      }
    });
  }

  function validateBothFields(depts: any[]) {
    depts.forEach((dept) => {
      expect(dept).toHaveProperty('subDepartments');
      expect(dept).toHaveProperty('employees');
      expect(Array.isArray(dept.subDepartments)).toBe(true);
      expect(Array.isArray(dept.employees)).toBe(true);
      if (dept.subDepartments.length > 0) {
        validateBothFields(dept.subDepartments);
      }
    });
  }

  function findDeptWithEmployees(depts: any[]): any {
    for (const dept of depts) {
      if (dept.employees && dept.employees.length > 0) return dept;
      if (dept.subDepartments && dept.subDepartments.length > 0) {
        const found = findDeptWithEmployees(dept.subDepartments);
        if (found) return found;
      }
    }
    return null;
  }

  function validateAllEmpty(depts: any[]) {
    depts.forEach((dept) => {
      expect(dept.employeeCount).toBe(0);
      expect(dept.employees).toEqual([]);
      if (dept.subDepartments.length > 0) {
        validateAllEmpty(dept.subDepartments);
      }
    });
  }

  // ==================== GET /admin/employees/departments/hierarchy ====================

  describe('GET /admin/employees/departments/hierarchy - 부서 하이라키 구조 조회', () => {
    describe('성공 케이스', () => {
      it('부서 하이라키 구조를 정상적으로 조회해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        console.log('\n✅ 부서 하이라키 구조 조회 성공');
      });

      it('각 부서는 필수 필드를 포함해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        const firstDept = response.body[0];
        expect(firstDept).toHaveProperty('id');
        expect(firstDept).toHaveProperty('name');
        expect(firstDept).toHaveProperty('code');
        expect(firstDept).toHaveProperty('order');
        expect(firstDept).toHaveProperty('parentDepartmentId');
        expect(firstDept).toHaveProperty('level');
        expect(firstDept).toHaveProperty('depth');
        expect(firstDept).toHaveProperty('childrenCount');
        expect(firstDept).toHaveProperty('totalDescendants');
        expect(firstDept).toHaveProperty('subDepartments');

        console.log('\n✅ 필수 필드 검증 성공');
      });

      it('루트 부서들의 level은 0이어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        const rootDepartments = response.body;
        rootDepartments.forEach((dept: any) => {
          expect(dept.level).toBe(0);
        });

        console.log('\n✅ 루트 부서 level 검증 성공');
      });

      it('하위 부서(subDepartments)의 level은 상위 부서보다 1 커야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        validateLevels(response.body, 0);

        console.log('\n✅ 하위 부서 level 검증 성공');
      });

      it('childrenCount는 직계 하위 부서 개수와 일치해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        validateChildrenCount(response.body);

        console.log('\n✅ childrenCount 검증 성공');
      });

      it('하위 부서가 없는 경우 depth는 0이어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        validateLeafDepth(response.body);

        console.log('\n✅ leaf 노드 depth 검증 성공');
      });

      it('totalDescendants는 모든 하위 부서 개수의 합이어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        validateTotalDescendants(response.body);

        console.log('\n✅ totalDescendants 검증 성공');
      });

      it('하위 부서가 있는 경우 depth는 최대 하위 레벨 깊이여야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        validateDepth(response.body);

        console.log('\n✅ depth 계산 검증 성공');
      });

      it('parentDepartmentId가 없는 부서는 루트 레벨에 있어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        response.body.forEach((dept: any) => {
          expect(dept.level).toBe(0);
        });

        console.log('\n✅ parentDepartmentId 검증 성공');
      });

      it('계층 구조가 올바르게 형성되어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // Then
        const totalCount = countDepartments(response.body);
        expect(totalCount).toBe(testDataCounts.departmentCount);

        console.log('\n✅ 계층 구조 검증 성공');
      });
    });
  });

  // ==================== GET /admin/employees/departments/hierarchy-with-employees ====================

  describe('GET /admin/employees/departments/hierarchy-with-employees - 직원 포함 부서 하이라키 조회', () => {
    describe('성공 케이스', () => {
      it('직원 목록을 포함한 부서 하이라키를 정상적으로 조회해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        console.log('\n✅ 직원 포함 부서 하이라키 조회 성공');
      });

      it('각 부서는 직원 관련 필드를 포함해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        const firstDept = response.body[0];
        expect(firstDept).toHaveProperty('employees');
        expect(firstDept).toHaveProperty('employeeCount');
        expect(Array.isArray(firstDept.employees)).toBe(true);
        expect(typeof firstDept.employeeCount).toBe('number');

        console.log('\n✅ 직원 관련 필드 검증 성공');
      });

      it('employeeCount는 employees 배열 길이와 일치해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        validateEmployeeCount(response.body);

        console.log('\n✅ employeeCount 검증 성공');
      });

      it('직원이 있는 부서는 직원 목록이 비어있지 않아야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        validateEmployees(response.body);

        console.log('\n✅ 직원 목록 검증 성공');
      });

      it('직원 정보는 필수 필드를 포함해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        const deptWithEmployees = findDeptWithEmployees(response.body);
        if (deptWithEmployees) {
          const employee = deptWithEmployees.employees[0];
          expect(employee).toHaveProperty('id');
          expect(employee).toHaveProperty('employeeNumber');
          expect(employee).toHaveProperty('name');
          expect(employee).toHaveProperty('email');
          expect(employee).toHaveProperty('rankName');
          expect(employee).toHaveProperty('rankCode');
          expect(employee).toHaveProperty('rankLevel');
          expect(employee).toHaveProperty('isActive');
        }

        console.log('\n✅ 직원 정보 필수 필드 검증 성공');
      });

      it('직원의 isActive 필드는 boolean이어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        validateIsActive(response.body);

        console.log('\n✅ isActive 필드 타입 검증 성공');
      });

      it('부서별 직원 수의 합은 전체 직원 수 이하여야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        const totalEmployees = countAllEmployees(response.body);
        expect(totalEmployees).toBeLessThanOrEqual(
          testDataCounts.employeeCount,
        );
        expect(totalEmployees).toBeGreaterThanOrEqual(0);

        console.log('\n✅ 직원 수 합계 검증 성공');
      });

      it('계층 정보(level, depth 등)도 함께 제공되어야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        const firstDept = response.body[0];
        expect(firstDept).toHaveProperty('level');
        expect(firstDept).toHaveProperty('depth');
        expect(firstDept).toHaveProperty('childrenCount');
        expect(firstDept).toHaveProperty('totalDescendants');
        expect(firstDept.level).toBe(0);

        console.log('\n✅ 계층 정보 검증 성공');
      });

      it('빈 부서(직원이 없는 부서)는 빈 배열을 반환해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        validateEmptyDepartments(response.body);

        console.log('\n✅ 빈 부서 검증 성공');
      });

      it('하위 부서와 직원 정보를 동시에 제공해야 함', async () => {
        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        validateBothFields(response.body);

        console.log('\n✅ 하위 부서와 직원 정보 동시 제공 검증 성공');
      });

      it('전체 부서 수는 일반 하이라키 조회와 동일해야 함', async () => {
        // Given
        const hierarchyResponse = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy')
          .expect(HttpStatus.OK);

        // When
        const withEmployeesResponse = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        expect(countDepartments(hierarchyResponse.body)).toBe(
          countDepartments(withEmployeesResponse.body),
        );

        console.log('\n✅ 전체 부서 수 일치 검증 성공');
      });
    });

    describe('엣지 케이스', () => {
      it('모든 부서에 직원이 없어도 정상 조회되어야 함', async () => {
        // Given: 기존 직원 데이터 모두 삭제
        await dataSource.query(`DELETE FROM employee`);

        // When
        const response = await testSuite
          .request()
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(HttpStatus.OK);

        // Then
        validateAllEmpty(response.body);

        console.log('\n✅ 직원 없는 부서 조회 검증 성공');
      });
    });
  });
});
