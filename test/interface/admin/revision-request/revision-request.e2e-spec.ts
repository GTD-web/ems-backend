/**
 * 재작성 요청 - E2E 테스트
 *
 * 재작성 요청 조회 및 관리 API를 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('Revision Request API E2E Tests', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

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

    // full 시나리오로 시드 데이터 생성 (Faker 기반)
    await testSuite
      .request()
      .post('/admin/seed/generate')
      .send({
        scenario: 'full',
        clearExisting: false,
        dataScale: {
          departmentCount: 5,
          employeeCount: 20,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 1,
        },
        stateDistribution: {
          excludedFromEvaluation: 0.01,
          evaluationPeriodStatus: { waiting: 0, inProgress: 1.0, completed: 0 },
          evaluationLineMappingTypes: {
            primaryOnly: 0,
            primaryAndSecondary: 1.0,
            withAdditional: 0,
          },
        },
      })
      .expect(201);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getEvaluationPeriodAndEmployee() {
    // WBS 할당이 있는 직원을 조회 (평가라인 매핑은 WBS 할당 기반으로 생성됨)
    const result = await dataSource.query(
      `SELECT DISTINCT
        m."evaluationPeriodId", 
        wbs."employeeId",
        e."name" as employee_name
       FROM evaluation_period_employee_mapping m
       JOIN evaluation_wbs_assignment wbs ON wbs."periodId" = m."evaluationPeriodId"
       JOIN employee e ON e.id = wbs."employeeId"
       WHERE m."deletedAt" IS NULL 
         AND wbs."deletedAt" IS NULL
         AND m."employeeId" = wbs."employeeId"
       LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function createRevisionRequest(
    evaluationPeriodId: string,
    employeeId: string,
    step: string = 'criteria',
  ) {
    // Step approval을 revision_requested로 변경하여 재작성 요청 생성
    const response = await testSuite
      .request()
      .patch(
        `/admin/step-approvals/${evaluationPeriodId}/employees/${employeeId}/step`,
      )
      .send({
        step: step,
        status: 'revision_requested',
        revisionComment: '재작성이 필요합니다.',
      })
      .expect(HttpStatus.OK);

    // 생성된 재작성 요청 조회
    const result = await dataSource.query(
      `SELECT 
        rr.id,
        rr."evaluationPeriodId",
        rr."employeeId",
        rr.step,
        rr.comment
       FROM evaluation_revision_request rr
       WHERE rr."evaluationPeriodId" = $1 
         AND rr."employeeId" = $2
         AND rr.step = $3
       ORDER BY rr."createdAt" DESC
       LIMIT 1`,
      [evaluationPeriodId, employeeId, step],
    );

    return result.length > 0 ? result[0] : null;
  }

  async function getRecipientInfo(requestId: string) {
    const result = await dataSource.query(
      `SELECT 
        r."recipientId",
        e."email",
        e."name",
        e."employeeNumber"
       FROM evaluation_revision_request_recipient r
       JOIN employee e ON e.id = r."recipientId"
       WHERE r."revisionRequestId" = $1
         AND r."deletedAt" IS NULL
       LIMIT 1`,
      [requestId],
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getRecipientId(requestId: string) {
    const info = await getRecipientInfo(requestId);
    return info ? info.recipientId : null;
  }

  // ==================== GET /admin/revision-requests/me ====================

  describe('GET /admin/revision-requests/me - 내 재작성 요청 목록 조회', () => {
    describe('성공 시나리오', () => {
      it('필터 없이 모든 재작성 요청을 조회할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'criteria',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        const response = await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('requestId');
        expect(response.body[0]).toHaveProperty('evaluationPeriodId');
        expect(response.body[0]).toHaveProperty('employeeId');
        expect(response.body[0]).toHaveProperty('step');
        expect(response.body[0]).toHaveProperty('comment');
        expect(response.body[0]).toHaveProperty('isRead');
        expect(response.body[0]).toHaveProperty('isCompleted');
      });

      it('evaluationPeriodId로 필터링하여 조회할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'self',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        const response = await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({ evaluationPeriodId: data.evaluationPeriodId })
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach((req: any) => {
          expect(req.evaluationPeriodId).toBe(data.evaluationPeriodId);
        });
      });

      it('isRead=false로 필터링하여 읽지 않은 요청만 조회할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'primary',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        const response = await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({ isRead: 'false' })
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach((req: any) => {
          expect(req.isRead).toBe(false);
        });
      });

      it('isCompleted=false로 필터링하여 미완료 요청만 조회할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'secondary',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        const response = await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({ isCompleted: 'false' })
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach((req: any) => {
          expect(req.isCompleted).toBe(false);
        });
      });

      it('step으로 필터링하여 특정 단계의 요청만 조회할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'criteria',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        const response = await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({ step: 'criteria' })
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach((req: any) => {
          expect(req.step).toBe('criteria');
        });
      });

      it('여러 필터를 조합하여 조회할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'self',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        const response = await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({
            evaluationPeriodId: data.evaluationPeriodId,
            isRead: 'false',
            step: 'self',
          })
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach((req: any) => {
          expect(req.evaluationPeriodId).toBe(data.evaluationPeriodId);
          expect(req.isRead).toBe(false);
          expect(req.step).toBe('self');
        });
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 evaluationPeriodId로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({ evaluationPeriodId: 'invalid-uuid' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('잘못된 step 값으로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .get('/admin/revision-requests/me')
          .query({ step: 'invalid_step' })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  // ==================== GET /admin/revision-requests/me/unread-count ====================

  describe('GET /admin/revision-requests/me/unread-count - 읽지 않은 재작성 요청 수 조회', () => {
    it('읽지 않은 재작성 요청 수를 조회할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      expect(data).toBeDefined();

      const request = await createRevisionRequest(
        data.evaluationPeriodId,
        data.employeeId,
        'criteria',
      );
      expect(request).toBeDefined();

      const recipient = await getRecipientInfo(request.id);
      expect(recipient).toBeDefined();

      testSuite.setCurrentUser({
        id: recipient.recipientId,
        email: recipient.email,
        name: recipient.name,
        employeeNumber: recipient.employeeNumber,
      });

      const response = await testSuite
        .request()
        .get('/admin/revision-requests/me/unread-count')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('unreadCount');
      expect(typeof response.body.unreadCount).toBe('number');
      expect(response.body.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== PATCH /admin/revision-requests/:id/read ====================

  describe('PATCH /admin/revision-requests/:id/read - 재작성 요청 읽음 처리', () => {
    describe('성공 시나리오', () => {
      it('재작성 요청을 읽음 처리할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'criteria',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        await testSuite
          .request()
          .patch(`/admin/revision-requests/${request.id}/read`)
          .expect(HttpStatus.OK);

        // 읽음 상태 확인
        const updated = await dataSource.query(
          `SELECT "isRead", "readAt"
           FROM evaluation_revision_request_recipient
           WHERE "revisionRequestId" = $1 AND "recipientId" = $2`,
          [request.id, recipient.recipientId],
        );

        expect(updated.length).toBe(1);
        expect(updated[0].isRead).toBe(true);
        expect(updated[0].readAt).not.toBeNull();
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 requestId로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .patch('/admin/revision-requests/invalid-uuid/read')
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('존재하지 않는 재작성 요청 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000001';

        await testSuite
          .request()
          .patch(`/admin/revision-requests/${nonExistentId}/read`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });

  // ==================== PATCH /admin/revision-requests/:id/complete ====================

  describe('PATCH /admin/revision-requests/:id/complete - 재작성 완료 응답 제출', () => {
    describe('성공 시나리오', () => {
      it('재작성 완료 응답을 제출할 수 있어야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'criteria',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        await testSuite
          .request()
          .patch(`/admin/revision-requests/${request.id}/complete`)
          .send({
            responseComment: '평가기준을 수정 완료했습니다.',
          })
          .expect(HttpStatus.OK);

        // 완료 상태 확인
        const updated = await dataSource.query(
          `SELECT "isCompleted", "completedAt", "responseComment"
           FROM evaluation_revision_request_recipient
           WHERE "revisionRequestId" = $1 AND "recipientId" = $2`,
          [request.id, recipient.recipientId],
        );

        expect(updated.length).toBe(1);
        expect(updated[0].isCompleted).toBe(true);
        expect(updated[0].completedAt).not.toBeNull();
        expect(updated[0].responseComment).toBe(
          '평가기준을 수정 완료했습니다.',
        );
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 requestId로 요청 시 400 에러가 발생해야 한다', async () => {
        await testSuite
          .request()
          .patch('/admin/revision-requests/invalid-uuid/complete')
          .send({
            responseComment: '수정 완료',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('responseComment 필드 누락 시 400 에러가 발생해야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'self',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        await testSuite
          .request()
          .patch(`/admin/revision-requests/${request.id}/complete`)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('빈 responseComment로 요청 시 400 에러가 발생해야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'primary',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        await testSuite
          .request()
          .patch(`/admin/revision-requests/${request.id}/complete`)
          .send({
            responseComment: '',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('존재하지 않는 재작성 요청 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000001';

        await testSuite
          .request()
          .patch(`/admin/revision-requests/${nonExistentId}/complete`)
          .send({
            responseComment: '수정 완료',
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('이미 완료된 재작성 요청을 다시 완료 처리 시 409 에러가 발생해야 한다', async () => {
        const data = await getEvaluationPeriodAndEmployee();
        expect(data).toBeDefined();

        const request = await createRevisionRequest(
          data.evaluationPeriodId,
          data.employeeId,
          'secondary',
        );
        expect(request).toBeDefined();

        const recipient = await getRecipientInfo(request.id);
        expect(recipient).toBeDefined();

        testSuite.setCurrentUser({
          id: recipient.recipientId,
          email: recipient.email,
          name: recipient.name,
          employeeNumber: recipient.employeeNumber,
        });

        // 첫 번째 완료 처리
        await testSuite
          .request()
          .patch(`/admin/revision-requests/${request.id}/complete`)
          .send({
            responseComment: '첫 번째 완료',
          })
          .expect(HttpStatus.OK);

        // 두 번째 완료 처리 시도
        await testSuite
          .request()
          .patch(`/admin/revision-requests/${request.id}/complete`)
          .send({
            responseComment: '두 번째 완료 시도',
          })
          .expect(HttpStatus.CONFLICT);
      });
    });
  });
});
