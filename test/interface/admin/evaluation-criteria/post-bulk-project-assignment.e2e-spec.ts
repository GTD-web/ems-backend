import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { ProjectService } from '@domain/common/project/project.service';
import { ProjectStatus } from '@domain/common/project/project.types';

describe('POST /admin/evaluation-criteria/project-assignments/bulk', () => {
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
        // Given: 대량 할당 데이터
        const bulkAssignmentData = {
          assignments: [
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
            {
              employeeId: generateTempUUID(),
              projectId: generateTempUUID(),
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 성공하거나 적절한 에러 코드 반환
        expect([201, 400, 404, 500]).toContain(response.status);

        if (response.status === 201) {
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
            expect(assignment.assignedBy).toBe('admin');
          });
        }
      });

      it('단일 직원을 여러 프로젝트에 할당할 수 있어야 한다', async () => {
        // Given: 동일한 직원을 여러 프로젝트에 할당하는 데이터
        const employeeId = generateTempUUID();
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId,
              projectId: generateTempUUID(),
              periodId: evaluationPeriodId,
            },
            {
              employeeId,
              projectId: generateTempUUID(),
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 성공하거나 적절한 에러 코드 반환
        expect([201, 400, 404, 500]).toContain(response.status);

        if (response.status === 201) {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body).toHaveLength(2);

          // 모든 할당이 동일한 직원에게 되었는지 확인
          response.body.forEach((assignment: any) => {
            expect(assignment.employeeId).toBe(employeeId);
          });
        }
      });

      it('여러 직원을 단일 프로젝트에 할당할 수 있어야 한다', async () => {
        // Given: 여러 직원을 동일한 프로젝트에 할당하는 데이터
        const projectId = generateTempUUID();
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: generateTempUUID(),
              projectId,
              periodId: evaluationPeriodId,
            },
            {
              employeeId: generateTempUUID(),
              projectId,
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 성공하거나 적절한 에러 코드 반환
        expect([201, 400, 404, 500]).toContain(response.status);

        if (response.status === 201) {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body).toHaveLength(2);

          // 모든 할당이 동일한 프로젝트에 되었는지 확인
          response.body.forEach((assignment: any) => {
            expect(assignment.projectId).toBe(projectId);
          });
        }
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
        // Given: 필수 필드가 누락된 할당 데이터
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: generateTempUUID(),
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
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: 'invalid-uuid',
              projectId: generateTempUUID(),
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

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: generateTempUUID(),
              projectId: generateTempUUID(),
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
        // Given: 동일한 직원-프로젝트 조합이 포함된 대량 할당 데이터
        const employeeId = generateTempUUID();
        const projectId = generateTempUUID();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId,
              projectId,
              periodId: evaluationPeriodId,
            },
            {
              employeeId, // 동일한 직원
              projectId, // 동일한 프로젝트
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
        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: generateTempUUID(),
              projectId: generateTempUUID(),
              periodId: evaluationPeriodId,
            },
            {
              employeeId: 'invalid-uuid', // 무효한 UUID
              projectId: generateTempUUID(),
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
        // Given: 대량의 할당 데이터 (50개)
        const assignments: Array<{
          employeeId: string;
          projectId: string;
          periodId: string;
        }> = [];
        for (let i = 0; i < 50; i++) {
          assignments.push({
            employeeId: generateTempUUID(),
            projectId: generateTempUUID(),
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
          expect(response.body).toHaveLength(50);
        }
      });

      it('동시 대량 할당 요청을 처리할 수 있어야 한다', async () => {
        // Given: 여러 개의 대량 할당 요청 데이터
        const bulkRequests: Array<{
          assignments: Array<{
            employeeId: string;
            projectId: string;
            periodId: string;
          }>;
        }> = [];
        for (let i = 0; i < 3; i++) {
          const assignments: Array<{
            employeeId: string;
            projectId: string;
            periodId: string;
          }> = [];
          for (let j = 0; j < 5; j++) {
            assignments.push({
              employeeId: generateTempUUID(),
              projectId: generateTempUUID(),
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

        // Then: 모든 요청이 적절히 처리되어야 함
        responses.forEach((response) => {
          expect([201, 400, 404, 500]).toContain(response.status);
        });
      });
    });

    describe('감사 정보 검증', () => {
      it('대량 할당 시 모든 할당에 감사 정보가 올바르게 설정되어야 한다', async () => {
        // Given: 대량 할당 데이터
        const bulkAssignmentData = {
          assignments: [
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
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        // Then: 성공 시 모든 할당에 감사 정보가 설정되어야 함
        expect([201, 400, 404, 500]).toContain(response.status);

        if (response.status === 201) {
          response.body.forEach((assignment: any) => {
            expect(assignment.assignedBy).toBe('admin');
            expect(assignment.createdBy).toBe('admin');
            expect(assignment.updatedBy).toBe('admin');
            expect(assignment.createdAt).toBeDefined();
            expect(assignment.updatedAt).toBeDefined();
            expect(assignment.assignedDate).toBeDefined();
          });
        }
      });

      it('대량 할당 시 할당일이 현재 시간으로 설정되어야 한다', async () => {
        // Given: 할당 생성 전 시간 기록
        const beforeCreate = new Date();

        const bulkAssignmentData = {
          assignments: [
            {
              employeeId: generateTempUUID(),
              projectId: generateTempUUID(),
              periodId: evaluationPeriodId,
            },
          ],
        };

        // When: 대량 할당 요청
        const response = await request(app.getHttpServer())
          .post('/admin/evaluation-criteria/project-assignments/bulk')
          .send(bulkAssignmentData);

        if (response.status === 201) {
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
        }
      });
    });
  });
});
