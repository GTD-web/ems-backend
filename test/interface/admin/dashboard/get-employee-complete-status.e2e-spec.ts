import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('직원의 평가 현황 및 할당 데이터 통합 조회 (GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/complete-status)', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let dataSource: any;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  afterAll(async () => {
    // 정리 작업
    await testSuite.closeApp();
  });

  describe('기본 기능 테스트', () => {
    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생한다', async () => {
      await testSuite
        .request()
        .get(`/admin/dashboard/invalid-uuid/employees/invalid-uuid/complete-status`)
        .expect(400);
    });

    it('존재하지 않는 평가기간으로 조회 시 404 에러가 발생한다', async () => {
      const nonExistentPeriodId = '123e4567-e89b-12d3-a456-426614174999';
      const testEmployeeId = '123e4567-e89b-12d3-a456-426614174001';
      
      await testSuite
        .request()
        .get(`/admin/dashboard/${nonExistentPeriodId}/employees/${testEmployeeId}/complete-status`)
        .expect(404);
    });

    it('존재하지 않는 직원으로 조회 시 404 에러가 발생한다', async () => {
      const testEvaluationPeriodId = '123e4567-e89b-12d3-a456-426614174000';
      const nonExistentEmployeeId = '123e4567-e89b-12d3-a456-426614174999';
      
      await testSuite
        .request()
        .get(`/admin/dashboard/${testEvaluationPeriodId}/employees/${nonExistentEmployeeId}/complete-status`)
        .expect(404);
    });
  });
});
