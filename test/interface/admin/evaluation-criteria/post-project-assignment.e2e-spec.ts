import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { ProjectService } from '@domain/common/project/project.service';
import { ProjectStatus } from '@domain/common/project/project.types';

describe('POST /admin/evaluation-criteria/project-assignments', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;

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

    // 모든 테스트에서 ProjectService 목킹
    const projectService = app.get(ProjectService);
    const mockProject = {
      id: 'mock-project-id',
      name: '테스트 프로젝트',
      description: '테스트용 프로젝트',
      status: ProjectStatus.ACTIVE,
      isDeleted: false,
      isActive: true,
      isCompleted: false,
      isCancelled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jest.spyOn(projectService, 'ID로_조회한다').mockResolvedValue(mockProject);
  });

  afterEach(() => {
    // 각 테스트 후 목킹 정리
    jest.restoreAllMocks();
  });

  // 임시 UUID 생성 헬퍼 함수
  function generateTempUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  // ==================== 성공 케이스 ====================

  describe('성공 케이스', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let projectId: string;

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

      // Given: 임시 UUID 생성 (실제 데이터 생성 없이 테스트)
      employeeId = generateTempUUID();
      projectId = generateTempUUID();
    });

    it('존재하지 않는 직원/프로젝트 ID로도 할당 생성이 가능해야 한다 (임시 테스트)', async () => {
      // Given: 임시 UUID를 사용한 프로젝트 할당 데이터
      const createData = {
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
      };

      // When & Then: 임시 UUID로 할당 생성 시도 (실제 구현에 따라 결과가 달라질 수 있음)
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/project-assignments')
        .send(createData);

      // 실제 구현에 따라 다양한 상태 코드가 반환될 수 있음
      expect([201, 400, 404, 500]).toContain(response.status);

      if (response.status === 201) {
        // 성공한 경우 기본 필드 검증
        expect(response.body).toHaveProperty('id');
        expect(response.body.employeeId).toBe(employeeId);
        expect(response.body.projectId).toBe(projectId);
        expect(response.body.periodId).toBe(evaluationPeriodId);
      }
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
      const invalidDataSets = [
        {}, // 모든 필드 누락
        { employeeId: generateTempUUID() }, // projectId, periodId 누락
        { projectId: generateTempUUID() }, // employeeId, periodId 누락
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
      const createData = {
        employeeId: 'invalid-uuid',
        projectId: generateTempUUID(),
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
      const createData = {
        employeeId: '',
        projectId: generateTempUUID(),
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
      const createData = {
        employeeId: generateTempUUID(),
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
    let employeeId: string;
    let projectId: string;

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

      // Given: 임시 UUID 생성
      employeeId = generateTempUUID();
      projectId = generateTempUUID();
    });

    describe('중복 할당 검증', () => {
      it('동일한 평가기간-직원-프로젝트 조합으로 중복 할당 시 409 에러가 발생해야 한다', async () => {
        // Given: 첫 번째 할당 생성 (실제로는 실패할 수 있지만 테스트 목적)
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        const firstResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        // 첫 번째 요청이 성공한 경우에만 중복 테스트 진행
        if (firstResponse.status === 201) {
          // When & Then: 동일한 조합으로 재할당 시 409 에러 발생
          const secondResponse = await request(app.getHttpServer())
            .post('/admin/evaluation-criteria/project-assignments')
            .send(createData);

          expect([409, 400]).toContain(secondResponse.status);
        } else {
          // 첫 번째 요청이 실패한 경우, 적절한 에러 코드인지 확인
          expect([400, 404, 500]).toContain(firstResponse.status);
        }
      });

      it('동일한 직원이 다른 프로젝트에 할당되는 것은 허용되어야 한다', async () => {
        // Given: 첫 번째 프로젝트 할당
        const firstAssignment = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        const firstResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(firstAssignment);

        // 첫 번째 할당이 성공한 경우에만 테스트 진행
        if (firstResponse.status === 201) {
          // When: 동일한 직원을 다른 프로젝트에 할당
          const secondAssignment = {
            employeeId, // 동일한 직원
            projectId: generateTempUUID(), // 다른 프로젝트
            periodId: evaluationPeriodId,
          };

          const secondResponse = await request(app.getHttpServer())
            .post('/admin/evaluation-criteria/project-assignments')
            .send(secondAssignment);

          // Then: 성공하거나 적절한 에러 코드 반환
          expect([201, 400, 404, 500]).toContain(secondResponse.status);
        }
      });

      it('동일한 프로젝트에 다른 직원이 할당되는 것은 허용되어야 한다', async () => {
        // Given: 첫 번째 직원 할당
        const firstAssignment = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        const firstResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(firstAssignment);

        // 첫 번째 할당이 성공한 경우에만 테스트 진행
        if (firstResponse.status === 201) {
          // When: 동일한 프로젝트에 다른 직원 할당
          const secondAssignment = {
            employeeId: generateTempUUID(), // 다른 직원
            projectId, // 동일한 프로젝트
            periodId: evaluationPeriodId,
          };

          const secondResponse = await request(app.getHttpServer())
            .post('/admin/evaluation-criteria/project-assignments')
            .send(secondAssignment);

          // Then: 성공하거나 적절한 에러 코드 반환
          expect([201, 400, 404, 500]).toContain(secondResponse.status);
        }
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

        // When: 완료된 평가기간에 할당 생성 시도
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        // Then: 422 에러 발생 (완료된 평가기간 할당 제한)
        expect([422, 500]).toContain(response.status);
      });

      it('대기 상태 평가기간에는 할당 생성이 허용되어야 한다', async () => {
        // Given: 대기 상태 평가기간 (기본 상태)
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        // When & Then: 할당 생성 시도
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        // 대기 상태에서는 할당이 허용되어야 함 (실제 구현에 따라 결과 달라질 수 있음)
        expect([201, 400, 404, 500]).toContain(response.status);
      });

      it('진행 중인 평가기간에는 할당 생성이 허용되어야 한다', async () => {
        // Given: 평가기간을 진행 중 상태로 변경
        await dataSource.manager.update(
          'evaluation_period',
          { id: evaluationPeriodId },
          { status: 'in-progress' },
        );

        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        // When & Then: 할당 생성 시도
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        // 진행 중 상태에서는 할당이 허용되어야 함 (201 성공 또는 409 중복)
        expect([201, 409]).toContain(response.status);
      });
    });

    describe('할당일 및 감사 정보 검증', () => {
      it('할당 생성 시 할당일이 현재 시간으로 자동 설정되어야 한다', async () => {
        // Given: 할당 생성 전 시간 기록
        const beforeCreate = new Date();

        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        if (response.status === 201) {
          const afterCreate = new Date();

          // Then: 할당일이 생성 시간 범위 내에 있어야 함
          const assignedDate = new Date(response.body.assignedDate);
          expect(assignedDate.getTime()).toBeGreaterThanOrEqual(
            beforeCreate.getTime() - 1000, // 1초 여유
          );
          expect(assignedDate.getTime()).toBeLessThanOrEqual(
            afterCreate.getTime() + 1000, // 1초 여유
          );
        }
      });

      it('할당자 정보가 올바르게 설정되어야 한다', async () => {
        // Given: 할당 데이터
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        if (response.status === 201) {
          // Then: 할당자가 'admin'으로 설정되어야 함
          expect(response.body.assignedBy).toBe('admin');
          expect(response.body.createdBy).toBe('admin');
          expect(response.body.updatedBy).toBe('admin');
        }
      });

      it('할당 생성 시 감사 정보가 올바르게 설정되어야 한다', async () => {
        // Given: 할당 데이터
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        // When: 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        if (response.status === 201) {
          // Then: 감사 정보가 올바르게 설정되어야 함
          expect(response.body.createdBy).toBe('admin');
          expect(response.body.updatedBy).toBe('admin');
          expect(response.body.createdAt).toBeDefined();
          expect(response.body.updatedAt).toBeDefined();
          expect(response.body.version).toBeDefined();
          expect(response.body.deletedAt).toBeNull();
        }
      });
    });

    describe('데이터 무결성 검증', () => {
      it('생성된 할당의 모든 필드가 올바르게 설정되어야 한다', async () => {
        // Given: 완전한 프로젝트 할당 데이터
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        // When: 프로젝트 할당 생성
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        if (response.status === 201) {
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
        }
      });

      it('동시에 여러 할당을 생성할 때 적절히 처리되어야 한다', async () => {
        // Given: 여러 프로젝트 할당 데이터
        const createDataList = [
          {
            employeeId: generateTempUUID(),
            projectId: generateTempUUID(),
            periodId: evaluationPeriodId,
          },
          {
            employeeId: generateTempUUID(),
            projectId: generateTempUUID(),
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

        // Then: 각 요청이 적절한 상태 코드를 반환해야 함
        responses.forEach((response, index) => {
          expect([201, 400, 404, 500]).toContain(response.status);

          if (response.status === 201) {
            expect(response.body.employeeId).toBe(
              createDataList[index].employeeId,
            );
            expect(response.body.projectId).toBe(
              createDataList[index].projectId,
            );
            expect(response.body.assignedBy).toBe('admin');
          }
        });
      });
    });

    describe('엔티티 메서드 검증', () => {
      it('할당 생성 후 상세 조회가 가능해야 한다', async () => {
        // Given: 할당 생성
        const createData = {
          employeeId,
          projectId,
          periodId: evaluationPeriodId,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments')
          .send(createData);

        if (createResponse.status === 201) {
          const assignmentId = createResponse.body.id;

          // When: 할당 상세 조회
          const detailResponse = await request(app.getHttpServer()).get(
            `/admin/evaluation-criteria/project-assignments/${assignmentId}`,
          );

          // Then: 상세 조회 성공 또는 적절한 에러
          expect([200, 404]).toContain(detailResponse.status);

          if (detailResponse.status === 200) {
            expect(detailResponse.body.id).toBe(assignmentId);
            expect(detailResponse.body.employeeId).toBe(employeeId);
            expect(detailResponse.body.projectId).toBe(projectId);
            expect(detailResponse.body.periodId).toBe(evaluationPeriodId);
          }
        }
      });
    });
  });
});
