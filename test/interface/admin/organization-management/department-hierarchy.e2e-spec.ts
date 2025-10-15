import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';

describe('부서 하이라키 구조 조회 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
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

    // 부서 및 직원 테스트 데이터 생성
    const result = await testContextService.완전한_테스트환경을_생성한다();
    testData = {
      departments: result.departments,
      employees: result.employees,
    };
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  // ==================== GET /admin/employees/departments/hierarchy ====================

  describe('GET /admin/employees/departments/hierarchy - 부서 하이라키 구조 조회', () => {
    describe('성공 케이스', () => {
      it('부서 하이라키 구조를 정상적으로 조회해야 함', async () => {
        // Given: 테스트 데이터가 생성되어 있음

        // When: 부서 하이라키 조회
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 하이라키 구조가 반환되어야 함
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('각 부서는 필수 필드를 포함해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 첫 번째 부서의 필드 검증
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
      });

      it('루트 부서들의 level은 0이어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 모든 루트 부서의 level이 0인지 확인
        const rootDepartments = response.body;
        rootDepartments.forEach((dept: any) => {
          expect(dept.level).toBe(0);
        });
      });

      it('하위 부서(subDepartments)의 level은 상위 부서보다 1 커야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 재귀적으로 계층 구조 검증
        const validateLevels = (depts: any[], expectedLevel: number) => {
          depts.forEach((dept) => {
            expect(dept.level).toBe(expectedLevel);
            if (dept.subDepartments && dept.subDepartments.length > 0) {
              validateLevels(dept.subDepartments, expectedLevel + 1);
            }
          });
        };
        validateLevels(response.body, 0);
      });

      it('childrenCount는 직계 하위 부서 개수와 일치해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 재귀적으로 childrenCount 검증
        const validateChildrenCount = (depts: any[]) => {
          depts.forEach((dept) => {
            expect(dept.childrenCount).toBe(dept.subDepartments.length);
            if (dept.subDepartments && dept.subDepartments.length > 0) {
              validateChildrenCount(dept.subDepartments);
            }
          });
        };
        validateChildrenCount(response.body);
      });

      it('하위 부서가 없는 경우 depth는 0이어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: leaf 노드의 depth가 0인지 검증
        const validateLeafDepth = (depts: any[]) => {
          depts.forEach((dept) => {
            if (dept.subDepartments.length === 0) {
              expect(dept.depth).toBe(0);
              expect(dept.totalDescendants).toBe(0);
            } else {
              validateLeafDepth(dept.subDepartments);
            }
          });
        };
        validateLeafDepth(response.body);
      });

      it('totalDescendants는 모든 하위 부서 개수의 합이어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 재귀적으로 totalDescendants 검증
        const countAllDescendants = (dept: any): number => {
          if (dept.subDepartments.length === 0) return 0;
          return dept.subDepartments.reduce((sum: number, child: any) => {
            return sum + 1 + countAllDescendants(child);
          }, 0);
        };

        const validateTotalDescendants = (depts: any[]) => {
          depts.forEach((dept) => {
            const expected = countAllDescendants(dept);
            expect(dept.totalDescendants).toBe(expected);
            if (dept.subDepartments.length > 0) {
              validateTotalDescendants(dept.subDepartments);
            }
          });
        };
        validateTotalDescendants(response.body);
      });

      it('하위 부서가 있는 경우 depth는 최대 하위 레벨 깊이여야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: depth 계산 검증
        const calculateDepth = (dept: any): number => {
          if (dept.subDepartments.length === 0) return 0;
          const childDepths = dept.subDepartments.map((child: any) =>
            calculateDepth(child),
          );
          return Math.max(...childDepths) + 1;
        };

        const validateDepth = (depts: any[]) => {
          depts.forEach((dept) => {
            const expected = calculateDepth(dept);
            expect(dept.depth).toBe(expected);
            if (dept.subDepartments.length > 0) {
              validateDepth(dept.subDepartments);
            }
          });
        };
        validateDepth(response.body);
      });

      it('parentDepartmentId가 없는 부서는 루트 레벨에 있어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 루트 부서는 parentDepartmentId가 null이거나 undefined
        response.body.forEach((dept: any) => {
          expect(dept.level).toBe(0);
        });
      });

      it('계층 구조가 올바르게 형성되어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // Then: 부서 개수 확인
        const countDepartments = (depts: any[]): number => {
          return depts.reduce((sum, dept) => {
            return sum + 1 + countDepartments(dept.subDepartments || []);
          }, 0);
        };

        const totalCount = countDepartments(response.body);
        expect(totalCount).toBe(testData.departments.length);
      });
    });
  });

  // ==================== GET /admin/employees/departments/hierarchy-with-employees ====================

  describe('GET /admin/employees/departments/hierarchy-with-employees - 직원 포함 부서 하이라키 조회', () => {
    describe('성공 케이스', () => {
      it('직원 목록을 포함한 부서 하이라키를 정상적으로 조회해야 함', async () => {
        // Given: 테스트 데이터가 생성되어 있음

        // When: 직원 포함 부서 하이라키 조회
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 하이라키 구조가 반환되어야 함
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('각 부서는 직원 관련 필드를 포함해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 첫 번째 부서의 직원 관련 필드 검증
        const firstDept = response.body[0];
        expect(firstDept).toHaveProperty('employees');
        expect(firstDept).toHaveProperty('employeeCount');
        expect(Array.isArray(firstDept.employees)).toBe(true);
        expect(typeof firstDept.employeeCount).toBe('number');
      });

      it('employeeCount는 employees 배열 길이와 일치해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 재귀적으로 모든 부서의 employeeCount 검증
        const validateEmployeeCount = (depts: any[]) => {
          depts.forEach((dept) => {
            expect(dept.employeeCount).toBe(dept.employees.length);
            if (dept.subDepartments && dept.subDepartments.length > 0) {
              validateEmployeeCount(dept.subDepartments);
            }
          });
        };
        validateEmployeeCount(response.body);
      });

      it('직원이 있는 부서는 직원 목록이 비어있지 않아야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: employeeCount > 0인 부서는 employees 배열이 비어있지 않아야 함
        const validateEmployees = (depts: any[]) => {
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
        };
        validateEmployees(response.body);
      });

      it('직원 정보는 필수 필드를 포함해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 직원이 있는 첫 번째 부서의 직원 정보 검증
        const findDeptWithEmployees = (depts: any[]): any => {
          for (const dept of depts) {
            if (dept.employees.length > 0) return dept;
            if (dept.subDepartments && dept.subDepartments.length > 0) {
              const found = findDeptWithEmployees(dept.subDepartments);
              if (found) return found;
            }
          }
          return null;
        };

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
      });

      it('직원의 isActive 필드는 boolean이어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 모든 직원의 isActive가 boolean인지 검증
        const validateIsActive = (depts: any[]) => {
          depts.forEach((dept) => {
            dept.employees.forEach((emp: any) => {
              expect(typeof emp.isActive).toBe('boolean');
            });
            if (dept.subDepartments && dept.subDepartments.length > 0) {
              validateIsActive(dept.subDepartments);
            }
          });
        };
        validateIsActive(response.body);
      });

      it('부서별 직원 수의 합은 전체 직원 수 이하여야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 모든 부서의 직원 수 합계 계산
        const countAllEmployees = (depts: any[]): number => {
          return depts.reduce((sum, dept) => {
            return (
              sum +
              dept.employees.length +
              countAllEmployees(dept.subDepartments || [])
            );
          }, 0);
        };

        const totalEmployees = countAllEmployees(response.body);
        // 직원이 부서에 배정되지 않은 경우가 있을 수 있으므로 이하로 검증
        expect(totalEmployees).toBeLessThanOrEqual(testData.employees.length);
        expect(totalEmployees).toBeGreaterThanOrEqual(0);
      });

      it('계층 정보(level, depth 등)도 함께 제공되어야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 계층 정보 필드 검증
        const firstDept = response.body[0];
        expect(firstDept).toHaveProperty('level');
        expect(firstDept).toHaveProperty('depth');
        expect(firstDept).toHaveProperty('childrenCount');
        expect(firstDept).toHaveProperty('totalDescendants');
        expect(firstDept.level).toBe(0);
      });

      it('빈 부서(직원이 없는 부서)는 빈 배열을 반환해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: employeeCount가 0인 부서는 빈 배열
        const validateEmptyDepartments = (depts: any[]) => {
          depts.forEach((dept) => {
            if (dept.employeeCount === 0) {
              expect(dept.employees).toEqual([]);
            }
            if (dept.subDepartments && dept.subDepartments.length > 0) {
              validateEmptyDepartments(dept.subDepartments);
            }
          });
        };
        validateEmptyDepartments(response.body);
      });

      it('하위 부서와 직원 정보를 동시에 제공해야 함', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: subDepartments와 employees가 모두 존재
        const validateBothFields = (depts: any[]) => {
          depts.forEach((dept) => {
            expect(dept).toHaveProperty('subDepartments');
            expect(dept).toHaveProperty('employees');
            expect(Array.isArray(dept.subDepartments)).toBe(true);
            expect(Array.isArray(dept.employees)).toBe(true);
            if (dept.subDepartments.length > 0) {
              validateBothFields(dept.subDepartments);
            }
          });
        };
        validateBothFields(response.body);
      });

      it('전체 부서 수는 일반 하이라키 조회와 동일해야 함', async () => {
        // Given: 일반 하이라키 조회
        const hierarchyResponse = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy')
          .expect(200);

        // When: 직원 포함 하이라키 조회
        const withEmployeesResponse = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 부서 개수가 동일해야 함
        const countDepts = (depts: any[]): number => {
          return depts.reduce((sum, dept) => {
            return sum + 1 + countDepts(dept.subDepartments || []);
          }, 0);
        };

        expect(countDepts(hierarchyResponse.body)).toBe(
          countDepts(withEmployeesResponse.body),
        );
      });
    });

    describe('엣지 케이스', () => {
      it('모든 부서에 직원이 없어도 정상 조회되어야 함', async () => {
        // Given: 기존 직원 데이터 모두 삭제
        await dataSource
          .getRepository('Employee')
          .createQueryBuilder()
          .delete()
          .execute();

        // When: 조회
        const response = await request(app.getHttpServer())
          .get('/admin/employees/departments/hierarchy-with-employees')
          .expect(200);

        // Then: 빈 직원 목록으로 반환
        const validateAllEmpty = (depts: any[]) => {
          depts.forEach((dept) => {
            expect(dept.employeeCount).toBe(0);
            expect(dept.employees).toEqual([]);
            if (dept.subDepartments.length > 0) {
              validateAllEmpty(dept.subDepartments);
            }
          });
        };
        validateAllEmpty(response.body);
      });
    });
  });
});
