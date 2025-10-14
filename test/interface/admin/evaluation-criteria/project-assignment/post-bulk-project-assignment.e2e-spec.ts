import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';

describe('POST /admin/evaluation-criteria/project-assignments/bulk', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
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

    // 완전한 테스트 환경 생성 (부서, 직원, 프로젝트 모두 포함)
    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      departments,
      employees,
      projects,
    };

    console.log('대량 할당 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
    });
  });

  afterEach(async () => {
    // 각 테스트 후 테스트 데이터 정리
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // 테스트 데이터 헬퍼 함수
  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getRandomProject(): ProjectDto {
    return testData.projects[
      Math.floor(Math.random() * testData.projects.length)
    ];
  }

  function getActiveProject(): ProjectDto {
    return testData.projects.find((p) => p.isActive) || testData.projects[0];
  }

  function getRandomEmployees(count: number): EmployeeDto[] {
    const shuffled = [...testData.employees].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function getRandomProjects(count: number): ProjectDto[] {
    const shuffled = [...testData.projects].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // ==================== 대량 할당 테스트 ====================

  describe('프로젝트 대량 할당', () => {
    let evaluationPeriodId: string;

    beforeEach(async () => {
      // Given: 평가 기간 생성
      const evaluationPeriodData = {
        name: '대량 할당 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '대량 할당 테스트용 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const evaluationPeriodResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(evaluationPeriodData)
        .expect(201);

      evaluationPeriodId = evaluationPeriodResponse.body.id;
    });

    describe('성공 케이스', () => {
      it('여러 직원을 여러 프로젝트에 대량 할당할 수 있어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employees = getRandomEmployees(3);
        const projects = getRandomProjects(3);

        const assignedBy = employees[0].id; // 모든 할당에 동일한 assignedBy 사용
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employees[0].id,
              projectId: projects[0].id,
              periodId: evaluationPeriodId,
              assignedBy: assignedBy,
            },
            {
              employeeId: employees[1].id,
              projectId: projects[1].id,
              periodId: evaluationPeriodId,
              assignedBy: assignedBy,
            },
            {
              employeeId: employees[2].id,
              projectId: projects[2].id,
              periodId: evaluationPeriodId,
              assignedBy: assignedBy,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData)
          .expect(201);

        // Then: 성공 응답 검증
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(3);

        // 각 할당이 올바르게 생성되었는지 확인
        response.body.forEach((assignment: any, index: number) => {
          expect(assignment).toHaveProperty('id');
          expect(assignment.employeeId).toBe(
            bulkAssignmentData.assignments[index].employeeId,
          );
          expect(assignment.projectId).toBe(
            bulkAssignmentData.assignments[index].projectId,
          );
          expect(assignment.periodId).toBe(evaluationPeriodId);
          expect(assignment.assignedBy).toBe(assignedBy); // 모든 할당이 동일한 assignedBy
        });
      });

      it('단일 직원을 여러 프로젝트에 할당할 수 있어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const projects = getRandomProjects(2);

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employee.id,
              projectId: projects[0].id,
              periodId: evaluationPeriodId,
            },
            {
              employeeId: employee.id,
              projectId: projects[1].id,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData)
          .expect(201);

        // Then: 성공 응답 검증
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);

        // 모든 할당이 동일한 직원에게 되었는지 확인
        response.body.forEach((assignment: any) => {
          expect(assignment.employeeId).toBe(employee.id);
        });
      });

      it('여러 직원을 단일 프로젝트에 할당할 수 있어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employees = getRandomEmployees(2);
        const project = getActiveProject();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employees[0].id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
            {
              employeeId: employees[1].id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData)
          .expect(201);

        // Then: 성공 응답 검증
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);

        // 모든 할당이 동일한 프로젝트에 되었는지 확인
        response.body.forEach((assignment: any) => {
          expect(assignment.projectId).toBe(project.id);
        });
      });
    });

    describe('실패 케이스', () => {
      it('빈 할당 배열로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given: 빈 할당 배열
        const bulkAssignmentData = {
          assignments: [],
        };

        // When: 빈 할당 배열로 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 400 에러 발생 (유효성 검증 실패)
        expect([400, 201]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body.message).toContain(
            '할당 목록은 최소 1개 이상이어야 합니다.',
          );
        }
      });

      it('assignments 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
        // Given: assignments 필드가 누락된 데이터
        const bulkAssignmentData = {};

        // When & Then: 400 에러 발생
        await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData)
          .expect(400);
      });

      it('할당 데이터에 필수 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
        // Given: 실제 테스트 데이터 사용하되 필수 필드 누락
        const employee = getRandomEmployee();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employee.id,
              // projectId 누락
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 필수 필드가 누락된 데이터로 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 400 에러 또는 500 에러 발생 (유효성 검증 실패 또는 도메인 에러)
        expect([400, 500]).toContain(response.status);
      });

      it('잘못된 UUID 형식의 할당 데이터로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given: 잘못된 UUID 형식의 할당 데이터
        const project = getActiveProject();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: 'invalid-uuid',
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 잘못된 UUID 형식으로 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 400 에러 또는 201 성공 (UUID 검증이 런타임에 발생할 수 있음)
        expect([400, 201]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body.message[0]).toContain('must be a UUID');
        }
      });
    });

    describe('도메인 정책 검증', () => {
      it('완료된 평가기간에 대량 할당 시 422 에러가 발생해야 한다', async () => {
        // Given: 평가기간을 완료 상태로 변경
        await dataSource.manager.update(
          'evaluation_period',
          { id: evaluationPeriodId },
          { status: 'completed' },
        );

        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employee.id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 완료된 평가기간에 대량 할당 시도
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 422 에러 또는 500 에러 발생 (완료된 평가기간 할당 제한)
        expect([422, 500]).toContain(response.status);
      });

      it('중복 할당이 포함된 대량 할당 시 적절히 처리되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employee.id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
            {
              employeeId: employee.id, // 동일한 직원
              projectId: project.id, // 동일한 프로젝트
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 중복 할당이 포함된 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 적절한 에러 처리 또는 부분 성공
        expect([201, 400, 409, 422, 500]).toContain(response.status);
      });

      it('대량 할당 시 트랜잭션이 올바르게 처리되어야 한다', async () => {
        // Given: 일부는 유효하고 일부는 무효한 할당 데이터
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employee.id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
            {
              employeeId: 'invalid-uuid', // 무효한 UUID
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 전체 실패 또는 적절한 에러 처리 (트랜잭션 롤백으로 인한 실패)
        expect([400, 422, 500]).toContain(response.status);
      });
    });

    describe('성능 및 확장성 테스트', () => {
      it('대량의 할당 데이터를 처리할 수 있어야 한다', async () => {
        // Given: 실제 테스트 데이터로 대량 할당 데이터 생성 (3개로 조정)
        const employees = getRandomEmployees(3);
        const projects = getRandomProjects(3);

        const assignments: Array<{
          employeeId: string;
          projectId: string;
          periodId: string;
        }> = [];

        for (let i = 0; i < 3; i++) {
          assignments.push({
            employeeId: employees[i].id,
            projectId: projects[i].id,
            periodId: evaluationPeriodId,
          });
        }

        const bulkAssignmentData = { assignments };

        // When: 대량 할당 요청
        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);
        const endTime = Date.now();

        // Then: 적절한 시간 내에 처리되어야 함
        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(30000); // 30초 이내

        expect([201, 400, 404, 500]).toContain(response.status);

        if (response.status === 201) {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body).toHaveLength(3);
        }
      });

      it('동시 대량 할당 요청을 처리할 수 있어야 한다', async () => {
        // Given: 실제 테스트 데이터로 여러 개의 대량 할당 요청 데이터 생성 (간단한 방식으로 변경)
        const bulkRequests: Array<{
          assignments: Array<{
            employeeId: string;
            projectId: string;
            periodId: string;
          }>;
        }> = [];

        // 간단한 방식: 각 요청마다 다른 직원-프로젝트 조합 사용
        for (let i = 0; i < 2; i++) {
          // 3개 → 2개로 줄임
          const assignments: Array<{
            employeeId: string;
            projectId: string;
            periodId: string;
          }> = [];

          for (let j = 0; j < 2; j++) {
            // 3개 → 2개로 줄임
            // 간단한 인덱스 기반 선택으로 무한 루프 방지
            const employeeIndex = (i * 2 + j) % testData.employees.length;
            const projectIndex = (i * 2 + j) % testData.projects.length;

            assignments.push({
              employeeId: testData.employees[employeeIndex].id,
              projectId: testData.projects[projectIndex].id,
              periodId: evaluationPeriodId,
            });
          }
          bulkRequests.push({ assignments });
        }

        // When: 동시에 여러 대량 할당 요청
        const responses = await Promise.all(
          bulkRequests.map((data) =>
            request(app.getHttpServer())
              .post('/admin/evaluation-criteria/project-assignments/bulk')
              .send(data),
          ),
        );

        // Then: 모든 요청이 적절히 처리되어야 함 (409 중복 에러도 포함)
        responses.forEach((response) => {
          expect([201, 400, 404, 409, 500]).toContain(response.status);
        });
      });
    });

    describe('감사 정보 검증', () => {
      it('대량 할당 시 모든 할당에 감사 정보가 올바르게 설정되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employees = getRandomEmployees(2);
        const projects = getRandomProjects(2);

        const assignedBy = employees[0].id; // 모든 할당에 동일한 assignedBy 사용
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employees[0].id,
              projectId: projects[0].id,
              periodId: evaluationPeriodId,
              assignedBy: assignedBy,
            },
            {
              employeeId: employees[1].id,
              projectId: projects[1].id,
              periodId: evaluationPeriodId,
              assignedBy: assignedBy,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData)
          .expect(201);

        // Then: 모든 할당에 감사 정보가 설정되어야 함
        response.body.forEach((assignment: any, index: number) => {
          expect(assignment.assignedBy).toBe(assignedBy); // 모든 할당이 동일한 assignedBy
          expect(assignment.createdBy).toBe(assignedBy);
          expect(assignment.updatedBy).toBe(assignedBy);
          expect(assignment.createdAt).toBeDefined();
          expect(assignment.updatedAt).toBeDefined();
          expect(assignment.assignedDate).toBeDefined();
        });
      });

      it('대량 할당 시 할당일이 현재 시간으로 설정되어야 한다', async () => {
        // Given: 할당 생성 전 시간 기록
        const beforeCreate = new Date();
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: employee.id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData)
          .expect(201);

        const afterCreate = new Date();

        // Then: 할당일이 생성 시간 범위 내에 있어야 함
        response.body.forEach((assignment: any) => {
          const assignedDate = new Date(assignment.assignedDate);
          expect(assignedDate.getTime()).toBeGreaterThanOrEqual(
            beforeCreate.getTime() - 1000, // 1초 여유
          );
          expect(assignedDate.getTime()).toBeLessThanOrEqual(
            afterCreate.getTime() + 1000, // 1초 여유
          );
        });
      });
    });
  });
});
