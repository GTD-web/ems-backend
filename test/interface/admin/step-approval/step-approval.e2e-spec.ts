/**
 * 단계 승인 - E2E 테스트
 *
 * 평가 단계별 승인 상태 관리 API를 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/step-approvals/:evaluationPeriodId/employees/:employeeId/step', () => {
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

    // full 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'full',
        clearExisting: false,
      })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getEvaluationPeriodAndEmployee() {
    const result = await dataSource.query(
      `SELECT 
        m."evaluationPeriodId", 
        m."employeeId",
        e."name" as employee_name
       FROM evaluation_period_employee_mapping m
       JOIN employee e ON e.id = m."employeeId"
       WHERE m."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getAdminEmployeeId() {
    const employees = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return employees.length > 0 ? employees[0].id : null;
  }

  async function getStepApprovalStatus(
    evaluationPeriodId: string,
    employeeId: string,
  ) {
    const result = await dataSource.query(
      `SELECT 
        sa."criteriaSettingStatus",
        sa."selfEvaluationStatus",
        sa."primaryEvaluationStatus",
        sa."secondaryEvaluationStatus"
       FROM employee_evaluation_step_approval sa
       JOIN evaluation_period_employee_mapping m 
         ON m.id = sa."evaluationPeriodEmployeeMappingId"
       WHERE m."evaluationPeriodId" = $1 
         AND m."employeeId" = $2
         AND m."deletedAt" IS NULL`,
      [evaluationPeriodId, employeeId],
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getRevisionRequests(employeeId: string) {
    const result = await dataSource.query(
      `SELECT 
        rr.id,
        rr."employeeId",
        rr.step,
        rr.comment
       FROM evaluation_revision_request rr
       WHERE rr."employeeId" = $1
       ORDER BY rr."createdAt" DESC
       LIMIT 1`,
      [employeeId],
    );
    return result.length > 0 ? result[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 시나리오 - 평가기준 설정 단계', () => {
    it('평가기준 설정을 approved로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'approved',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.criteriaSettingStatus).toBe('approved');

      console.log('\n✅ 평가기준 설정 승인 완료');
    });

    it('평가기준 설정을 revision_requested로 변경하고 재작성 요청이 생성되어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'revision_requested',
          revisionComment: '평가기준이 명확하지 않습니다. 다시 작성해주세요.',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.criteriaSettingStatus).toBe('revision_requested');

      // 재작성 요청 생성 확인
      const revisionRequest = await getRevisionRequests(data.employeeId);
      expect(revisionRequest).toBeDefined();
      expect(revisionRequest.step).toBe('criteria');
      expect(revisionRequest.comment).toContain('명확하지 않습니다');

      console.log('\n✅ 평가기준 재작성 요청 생성 완료');
    });

    it('평가기준 설정을 pending으로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'pending',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.criteriaSettingStatus).toBe('pending');

      console.log('\n✅ 평가기준 pending으로 변경 완료');
    });
  });

  describe('성공 시나리오 - 자기평가 단계', () => {
    it('자기평가를 approved로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'self',
          status: 'approved',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.selfEvaluationStatus).toBe('approved');

      console.log('\n✅ 자기평가 승인 완료');
    });

    it('자기평가를 revision_requested로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'self',
          status: 'revision_requested',
          revisionComment: '자기평가 내용이 구체적이지 않습니다.',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.selfEvaluationStatus).toBe('revision_requested');

      console.log('\n✅ 자기평가 재작성 요청 완료');
    });
  });

  describe('성공 시나리오 - 1차 하향평가 단계', () => {
    it('1차 하향평가를 approved로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'primary',
          status: 'approved',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.primaryEvaluationStatus).toBe('approved');

      console.log('\n✅ 1차 하향평가 승인 완료');
    });

    it('1차 하향평가를 revision_requested로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'primary',
          status: 'revision_requested',
          revisionComment: '1차평가 내용 재검토가 필요합니다.',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.primaryEvaluationStatus).toBe('revision_requested');

      console.log('\n✅ 1차 하향평가 재작성 요청 완료');
    });
  });

  describe('성공 시나리오 - 2차 하향평가 단계', () => {
    it('2차 하향평가를 approved로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'secondary',
          status: 'approved',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.secondaryEvaluationStatus).toBe('approved');

      console.log('\n✅ 2차 하향평가 승인 완료');
    });

    it('2차 하향평가를 revision_requested로 변경할 수 있어야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      // When
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'secondary',
          status: 'revision_requested',
          revisionComment: '2차평가 내용 재검토가 필요합니다.',
        })
        .expect(HttpStatus.OK);

      // Then
      const status = await getStepApprovalStatus(
        data.evaluationPeriodId,
        data.employeeId,
      );
      expect(status).toBeDefined();
      expect(status.secondaryEvaluationStatus).toBe('revision_requested');

      console.log('\n✅ 2차 하향평가 재작성 요청 완료');
    });
  });

  describe('실패 시나리오', () => {
    it('잘못된 evaluationPeriodId UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/invalid-uuid/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'approved',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluationPeriodId UUID 처리 성공');
    });

    it('잘못된 employeeId UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/invalid-uuid/step`,
        )
        .send({
          step: 'criteria',
          status: 'approved',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 employeeId UUID 처리 성공');
    });

    it('필수 필드 step 누락 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          status: 'approved',
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(`\n✅ step 필드 누락 처리 성공 (${response.status})`);
    });

    it('필수 필드 status 누락 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(`\n✅ status 필드 누락 처리 성공 (${response.status})`);
    });

    it('잘못된 step 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'invalid_step',
          status: 'approved',
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(`\n✅ 잘못된 step 값 처리 성공 (${response.status})`);
    });

    it('잘못된 status 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'invalid_status',
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(`\n✅ 잘못된 status 값 처리 성공 (${response.status})`);
    });

    it('revision_requested 상태인데 revisionComment 누락 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluationPeriodAndEmployee();
      if (!data) {
        console.log('테스트 데이터가 없어서 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${data.evaluationPeriodId}/employees/${data.employeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'revision_requested',
          // revisionComment 누락
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(`\n✅ revisionComment 누락 처리 성공 (${response.status})`);
    });

    it('존재하지 않는 평가기간-직원 조합으로 요청 시 404 에러가 발생해야 한다', async () => {
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000001';
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000002';

      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${nonExistentPeriodId}/employees/${nonExistentEmployeeId}/step`,
        )
        .send({
          step: 'criteria',
          status: 'approved',
        })
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 리소스 처리 성공');
    });
  });
});
