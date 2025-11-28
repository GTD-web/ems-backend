import { BaseE2ETest } from '../../base-e2e.spec';
import { SeedDataScenario } from './seed-data.scenario';

/**
 * 신규 입사자 추가 및 삭제 E2E 테스트
 *
 * 이 테스트는 신규 입사자를 추가하고 배치 번호로 되돌리는 전체 시나리오를 검증합니다.
 */
describe('신규 입사자 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('신규 입사자 추가', () => {
    it('5명의 신규 입사자를 추가한다', async () => {
      const result = await seedDataScenario.신규_입사자를_추가한다(5);

      // 검증
      expect(result.success).toBe(true);
      expect(result.addedCount).toBe(5);
      expect(result.failedCount).toBe(0);
      expect(result.batchNumber).toMatch(/^NEW\d{10,13}$/);
      expect(result.addedEmployeeIds).toHaveLength(5);
      expect(result.message).toContain('5명');
    });

    it('1명의 신규 입사자를 추가한다', async () => {
      const result = await seedDataScenario.신규_입사자를_추가한다(1);

      expect(result.success).toBe(true);
      expect(result.addedCount).toBe(1);
      expect(result.addedEmployeeIds).toHaveLength(1);
    });

    it('10명의 신규 입사자를 추가한다', async () => {
      const result = await seedDataScenario.신규_입사자를_추가한다(10);

      expect(result.success).toBe(true);
      expect(result.addedCount).toBe(10);
      expect(result.addedEmployeeIds).toHaveLength(10);
    });
  });

  describe('신규 입사자 전체 시나리오', () => {
    it('신규 입사자 추가 후 즉시 삭제하는 전체 시나리오를 실행한다', async () => {
      const result =
        await seedDataScenario.신규_입사자_추가_및_삭제_시나리오를_실행한다(7);

      // 검증
      expect(result.추가결과.success).toBe(true);
      expect(result.추가결과.addedCount).toBe(7);
      expect(result.삭제결과.success).toBe(true);
      expect(result.삭제결과.removedCount).toBeGreaterThanOrEqual(7); // 이전 테스트의 직원들도 포함될 수 있음
    });

    it('대량 신규 입사자(50명) 추가 및 삭제 시나리오를 실행한다', async () => {
      const result =
        await seedDataScenario.신규_입사자_추가_및_삭제_시나리오를_실행한다(50);

      expect(result.추가결과.addedCount).toBe(50);
      expect(result.삭제결과.success).toBe(true);
      expect(result.삭제결과.removedCount).toBe(50); // 이전 테스트에서 정리되어 50명만 삭제
    });
  });

  describe('엣지 케이스', () => {
    it('count가 0인 요청 시 400 에러를 반환한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/seed/employees')
        .send({ count: 0 })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('count가 100을 초과하는 요청 시 400 에러를 반환한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/seed/employees')
        .send({ count: 101 })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('모든 배치 신규 입사자 제거', () => {
    beforeEach(async () => {
      // 각 테스트 전에 기존 신규 입사자 정리
      try {
        await testSuite
          .request()
          .delete('/admin/seed/employees/all')
          .expect((res) => {
            // 404 또는 200 둘 다 허용 (없거나 있거나)
            if (res.status !== 200 && res.status !== 404) {
              throw new Error(`Unexpected status: ${res.status}`);
            }
          });
      } catch (error) {
        // 이미 없는 경우 무시
      }
    });

    it('모든 배치로 추가한 신규 입사자를 한 번에 제거한다', async () => {
      // 1. 여러 배치로 신규 입사자 추가
      const batch1 = await seedDataScenario.신규_입사자를_추가한다(3);
      const batch2 = await seedDataScenario.신규_입사자를_추가한다(5);
      const batch3 = await seedDataScenario.신규_입사자를_추가한다(2);

      const totalCount = 3 + 5 + 2;

      // 2. 모든 신규 입사자 제거
      const response = await testSuite
        .request()
        .delete('/admin/seed/employees/all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.removedCount).toBe(totalCount);
      expect(response.body.message).toContain(`${totalCount}명`);
      expect(response.body.removedEmployees).toBeDefined();
      expect(response.body.removedEmployees.length).toBe(totalCount);

      // 3. 직원 목록에서 모두 제거되었는지 확인
      const employeesResponse = await testSuite
        .request()
        .get('/admin/employees')
        .query({ includeExcluded: false })
        .expect(200);

      const employees = employeesResponse.body;
      const newEmployees = employees.filter((emp: any) =>
        emp.employeeNumber.startsWith('NEW'),
      );

      expect(newEmployees.length).toBe(0);
    });

    it('신규 입사자가 없을 때 404 에러를 반환한다', async () => {
      // 신규 입사자가 없는 상태에서 삭제 시도
      const response = await testSuite
        .request()
        .delete('/admin/seed/employees/all')
        .expect(404);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });

    it('일부만 추가 후 모두 제거해도 정상 동작한다', async () => {
      // 1. 한 배치만 추가
      const batch = await seedDataScenario.신규_입사자를_추가한다(7);

      // 2. 모든 신규 입사자 제거
      const response = await testSuite
        .request()
        .delete('/admin/seed/employees/all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.removedCount).toBe(7);
    });
  });
});
