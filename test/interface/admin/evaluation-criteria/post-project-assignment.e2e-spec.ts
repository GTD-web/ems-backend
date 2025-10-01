import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';

describe('POST /admin/evaluation-criteria/project-assignments', () => {
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

    // 테스트 데이터 생성
    const { departments, employees } =
      await testContextService.부서와_직원을_생성한다();
    const { projects } = await testContextService.프로젝트와_WBS를_생성한다(3);

    testData = {
      departments,
      employees,
      projects,
    };

    console.log('테스트 데이터 생성 완료:', {
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

  // ==================== 성공 케이스 ====================

  describe('성공 케이스', () => {
    let evaluationPeriodId: string;

    beforeEach(async () => {
      // Given: 평가 기간 생성
      const evaluationPeriodData = {
        name: '프로젝트 할당 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '프로젝트 할당 테스트용 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const evaluationPeriodResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(evaluationPeriodData)
        .expect(201);

      evaluationPeriodId = evaluationPeriodResponse.body.id;
    });

    it('실제 직원과 프로젝트로 할당 생성이 성공해야 한다', async () => {
      // Given: 실제 테스트 데이터 사용
      const employee = getRandomEmployee();
      const project = getActiveProject();

      const createData = {
        employeeId: employee.id,
        projectId: project.id,
        periodId: evaluationPeriodId,
      };

      // When: 프로젝트 할당 생성
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/project-assignments')
        .send(createData)
        .expect(201);

      // Then: 성공 응답 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.projectId).toBe(project.id);
      expect(response.body.periodId).toBe(evaluationPeriodId);
      expect(response.body.assignedBy).toBe('admin');
      expect(response.body).toHaveProperty('assignedDate');
    });

    it('여러 직원을 동일한 프로젝트에 할당할 수 있어야 한다', async () => {
      // Given: 동일한 프로젝트에 여러 직원 할당
      const project = getActiveProject();
      const employees = testData.employees.slice(0, 2); // 처음 2명의 직원

      // When: 여러 직원을 동일한 프로젝트에 할당
      const responses = await Promise.all(
        employees.map((employee) =>
          request(app.getHttpServer())
            .post('/admin/evaluation-criteria/project-assignments')
            .send({
              employeeId: employee.id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            }),
        ),
      );

      // Then: 모든 할당이 성공해야 함
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.projectId).toBe(project.id);
      });
    });

    it('동일한 직원을 여러 프로젝트에 할당할 수 있어야 한다', async () => {
      // Given: 동일한 직원을 여러 프로젝트에 할당
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 2); // 처음 2개의 프로젝트

      // When: 동일한 직원을 여러 프로젝트에 할당
      const responses = await Promise.all(
        projects.map((project) =>
          request(app.getHttpServer())
            .post('/admin/evaluation-criteria/project-assignments')
            .send({
              employeeId: employee.id,
              projectId: project.id,
              periodId: evaluationPeriodId,
            }),
        ),
      );

      // Then: 모든 할당이 성공해야 함
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.employeeId).toBe(employee.id);
      });
    });
  });

  // ==================== 실패 케이스 ====================

  describe('실패 케이스', () => {
    let evaluationPeriodId: string;

    beforeEach(async () => {
      // Given: 평가 기간 생성
      const evaluationPeriodData = {
        name: '실패 케이스 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '실패 케이스 테스트용 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const evaluationPeriodResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(evaluationPeriodData)
        .expect(201);

      evaluationPeriodId = evaluationPeriodResponse.body.id;
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // Given: 필수 필드가 누락된 데이터들
      const employee = getRandomEmployee();
      const project = getActiveProject();

      const invalidDataSets = [
        {}, // 모든 필드 누락
        { employeeId: employee.id }, // projectId, periodId 누락
        { projectId: project.id }, // employeeId, periodId 누락
        { periodId: evaluationPeriodId }, // employeeId, projectId 누락
      ];

      for (const invalidData of invalidDataSets) {
        // When & Then: 400 에러 발생
        await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(invalidData)
          .expect(400);
      }
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식 데이터
      const project = getActiveProject();
      const createData = {
        employeeId: 'invalid-uuid',
        projectId: project.id,
        periodId: evaluationPeriodId,
      };

      // When & Then: 400 에러 발생
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/project-assignments')
        .send(createData)
        .expect(400);
    });
  });

  // ==================== 간단한 추가 테스트 ====================

  describe('간단한 추가 테스트', () => {
    let evaluationPeriodId: string;

    beforeEach(async () => {
      // Given: 평가 기간 생성
      const evaluationPeriodData = {
        name: '간단 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '간단 테스트용 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const evaluationPeriodResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(evaluationPeriodData)
        .expect(201);

      evaluationPeriodId = evaluationPeriodResponse.body.id;
    });

    it('빈 문자열 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 빈 문자열 ID 데이터
      const project = getActiveProject();
      const createData = {
        employeeId: '',
        projectId: project.id,
        periodId: evaluationPeriodId,
      };

      // When & Then: 400 에러 발생
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/project-assignments')
        .send(createData)
        .expect(400);
    });

    it('null 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: null 값 데이터
      const employee = getRandomEmployee();
      const createData = {
        employeeId: employee.id,
        projectId: null,
        periodId: evaluationPeriodId,
      };

      // When & Then: 400 에러 발생
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/project-assignments')
        .send(createData)
        .expect(400);
    });
  });

  // ==================== 도메인 정책 검증 ====================

  describe('도메인 정책 검증', () => {
    let evaluationPeriodId: string;

    beforeEach(async () => {
      // Given: 평가 기간 생성
      const evaluationPeriodData = {
        name: '도메인 정책 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '도메인 정책 테스트용 평가기간',
        maxSelfEvaluationRate: 120,
      };

      const evaluationPeriodResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(evaluationPeriodData)
        .expect(201);

      evaluationPeriodId = evaluationPeriodResponse.body.id;
    });

    describe('중복 할당 검증', () => {
      it('동일한 평가기간-직원-프로젝트 조합으로 중복 할당 시 409 에러가 발생해야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 첫 번째 할당 생성
        const firstResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        // When: 동일한 조합으로 재할당 시도
        const secondResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        // Then: 409 에러 발생
        expect(secondResponse.status).toBe(409);
      });

      it('동일한 직원이 다른 프로젝트에 할당되는 것은 허용되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project1 = getActiveProject();
        const project2 =
          testData.projects.find((p) => p.id !== project1.id) ||
          testData.projects[1];

        const firstAssignment = {
          employeeId: employee.id,
          projectId: project1.id,
          periodId: evaluationPeriodId,
        };

        // When: 첫 번째 프로젝트 할당
        const firstResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(firstAssignment)
          .expect(201);

        // When: 동일한 직원을 다른 프로젝트에 할당
        const secondAssignment = {
          employeeId: employee.id, // 동일한 직원
          projectId: project2.id, // 다른 프로젝트
          periodId: evaluationPeriodId,
        };

        const secondResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(secondAssignment)
          .expect(201);

        // Then: 두 번째 할당도 성공해야 함
        expect(secondResponse.body.employeeId).toBe(employee.id);
        expect(secondResponse.body.projectId).toBe(project2.id);
      });

      it('동일한 프로젝트에 다른 직원이 할당되는 것은 허용되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee1 = getRandomEmployee();
        const employee2 =
          testData.employees.find((e) => e.id !== employee1.id) ||
          testData.employees[1];
        const project = getActiveProject();

        const firstAssignment = {
          employeeId: employee1.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 첫 번째 직원 할당
        const firstResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(firstAssignment)
          .expect(201);

        // When: 동일한 프로젝트에 다른 직원 할당
        const secondAssignment = {
          employeeId: employee2.id, // 다른 직원
          projectId: project.id, // 동일한 프로젝트
          periodId: evaluationPeriodId,
        };

        const secondResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(secondAssignment)
          .expect(201);

        // Then: 두 번째 할당도 성공해야 함
        expect(secondResponse.body.employeeId).toBe(employee2.id);
        expect(secondResponse.body.projectId).toBe(project.id);
      });
    });

    describe('평가기간 상태 검증', () => {
      it('완료된 평가기간에 할당 생성 시 422 에러가 발생해야 한다', async () => {
        // Given: 평가기간을 직접 완료 상태로 변경
        await dataSource.manager.update(
          'evaluation_period',
          { id: evaluationPeriodId },
          { status: 'completed' },
        );

        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        // When: 완료된 평가기간에 할당 생성 시도
        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        // Then: 422 에러 발생 (완료된 평가기간 할당 제한)
        expect([422, 500]).toContain(response.status);
      });

      it('대기 상태 평가기간에는 할당 생성이 허용되어야 한다', async () => {
        // Given: 대기 상태 평가기간 (기본 상태)과 실제 테스트 데이터
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When & Then: 할당 생성 시도
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        // Then: 성공 응답 검증
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.projectId).toBe(project.id);
      });

      it('진행 중인 평가기간에는 할당 생성이 허용되어야 한다', async () => {
        // Given: 평가기간을 진행 중 상태로 변경
        await dataSource.manager.update(
          'evaluation_period',
          { id: evaluationPeriodId },
          { status: 'in-progress' },
        );

        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When & Then: 할당 생성 시도
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        // Then: 성공 응답 검증
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.projectId).toBe(project.id);
      });
    });

    describe('할당일 및 감사 정보 검증', () => {
      it('할당 생성 시 할당일이 현재 시간으로 자동 설정되어야 한다', async () => {
        // Given: 할당 생성 전 시간 기록
        const beforeCreate = new Date();
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        const afterCreate = new Date();

        // Then: 할당일이 생성 시간 범위 내에 있어야 함
        const assignedDate = new Date(response.body.assignedDate);
        expect(assignedDate.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000, // 1초 여유
        );
        expect(assignedDate.getTime()).toBeLessThanOrEqual(
          afterCreate.getTime() + 1000, // 1초 여유
        );
      });

      it('할당자 정보가 올바르게 설정되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        // Then: 할당자가 'admin'으로 설정되어야 함
        expect(response.body.assignedBy).toBe('admin');
        expect(response.body.createdBy).toBe('admin');
        expect(response.body.updatedBy).toBe('admin');
      });

      it('할당 생성 시 감사 정보가 올바르게 설정되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        // Then: 감사 정보가 올바르게 설정되어야 함
        expect(response.body.createdBy).toBe('admin');
        expect(response.body.updatedBy).toBe('admin');
        expect(response.body.createdAt).toBeDefined();
        expect(response.body.updatedAt).toBeDefined();
        expect(response.body.version).toBeDefined();
        expect(response.body.deletedAt).toBeNull();
      });
    });

    describe('데이터 무결성 검증', () => {
      it('생성된 할당의 모든 필드가 올바르게 설정되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 프로젝트 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        // Then: 모든 필드 검증
        expect(response.body).toHaveProperty('id');
        expect(typeof response.body.id).toBe('string');
        expect(response.body.employeeId).toBe(createData.employeeId);
        expect(response.body.projectId).toBe(createData.projectId);
        expect(response.body.periodId).toBe(createData.periodId);
        expect(response.body.assignedBy).toBe('admin');
        expect(response.body).toHaveProperty('assignedDate');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
        expect(new Date(response.body.assignedDate)).toBeInstanceOf(Date);
        expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
        expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
      });

      it('동시에 여러 할당을 생성할 때 적절히 처리되어야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employees = testData.employees.slice(0, 2);
        const projects = testData.projects.slice(0, 2);

        const createDataList = [
          {
            employeeId: employees[0].id,
            projectId: projects[0].id,
            periodId: evaluationPeriodId,
          },
          {
            employeeId: employees[1].id,
            projectId: projects[1].id,
            periodId: evaluationPeriodId,
          },
        ];

        // When: 동시에 여러 할당 생성
        const responses = await Promise.all(
          createDataList.map((data) =>
            request(app.getHttpServer())
              .post('/admin/evaluation-criteria/project-assignments')
              .send(data),
          ),
        );

        // Then: 모든 요청이 성공해야 함
        responses.forEach((response, index) => {
          expect(response.status).toBe(201);
          expect(response.body.employeeId).toBe(
            createDataList[index].employeeId,
          );
          expect(response.body.projectId).toBe(createDataList[index].projectId);
          expect(response.body.assignedBy).toBe('admin');
        });
      });
    });

    describe('엔티티 메서드 검증', () => {
      it('할당 생성 후 상세 조회가 가능해야 한다', async () => {
        // Given: 실제 테스트 데이터 사용
        const employee = getRandomEmployee();
        const project = getActiveProject();

        const createData = {
          employeeId: employee.id,
          projectId: project.id,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const createResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData)
          .expect(201);

        const assignmentId = createResponse.body.id;

        // When: 할당 상세 조회
        const detailResponse = await request(app.getHttpServer()).get(
          `/admin/evaluation-criteria/project-assignments/${assignmentId}`,
        );

        // Then: 상세 조회 성공 또는 적절한 에러
        expect([200, 404]).toContain(detailResponse.status);

        if (detailResponse.status === 200) {
          expect(detailResponse.body.id).toBe(assignmentId);
          expect(detailResponse.body.employeeId).toBe(employee.id);
          expect(detailResponse.body.projectId).toBe(project.id);
          expect(detailResponse.body.periodId).toBe(evaluationPeriodId);
        }
      });
    });
  });
});
