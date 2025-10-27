import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource, IsNull } from 'typeorm';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import axios from 'axios';

describe('POST /admin/seed/generate-with-real-data - 외부 API 동기화 통합 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;
  let externalApiAvailable: boolean = false;
  const EXTERNAL_API_URL =
    process.env.EXTERNAL_METADATA_API_URL ||
    'https://lumir-metadata-manager.vercel.app';

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;

    // 외부 API 접근 가능 여부 확인
    try {
      const response = await axios.get(`${EXTERNAL_API_URL}/api/departments`, {
        timeout: 5000,
      });
      externalApiAvailable = response.status === 200;
      console.log(
        `\n✅ 외부 API 접근 가능: ${EXTERNAL_API_URL} (부서 ${response.data.length}개)`,
      );
    } catch (error) {
      externalApiAvailable = false;
      console.log(
        `\n⚠️  외부 API 접근 불가: ${EXTERNAL_API_URL}\n   → Fallback 테스트만 실행됩니다.`,
      );
    }
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  // ==================== 외부 API 통합 테스트 헬퍼 ====================

  // ==================== 테스트 케이스 ====================

  describe('외부 API 동기화 테스트 (API 접근 가능 시)', () => {
    it('외부 서버에서 부서와 직원을 동기화하여 minimal 시나리오 생성', async () => {
      // 외부 API가 없으면 스킵
      if (!externalApiAvailable) {
        console.log('⏭️  외부 API 접근 불가로 테스트 스킵');
        return;
      }
      // Given: 외부 API 접근 가능
      const config = {
        scenario: 'minimal',
        clearExisting: true, // 동기화된 데이터만 사용
      };

      // When: 시드 데이터 생성 (내부적으로 외부 API 호출)
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();

      // Phase1 결과 검증
      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();
      expect(phase1Result.entityCounts.Department).toBeGreaterThan(0);
      expect(phase1Result.entityCounts.Employee).toBeGreaterThan(0);

      // 데이터베이스에서 확인
      const departments = await dataSource
        .getRepository(Department)
        .find({ where: { deletedAt: IsNull() } });
      const employees = await dataSource
        .getRepository(Employee)
        .find({ where: { deletedAt: IsNull() } });

      console.log(`\n✅ 외부 API에서 동기화된 부서: ${departments.length}개`);
      console.log(`✅ 외부 API에서 동기화된 직원: ${employees.length}명`);

      expect(departments.length).toBeGreaterThan(0);
      expect(employees.length).toBeGreaterThan(0);

      // 동기화된 데이터는 externalId를 가져야 함
      departments.forEach((dept) => {
        expect(dept.externalId).toBeDefined();
      });
      employees.forEach((emp) => {
        expect(emp.externalId).toBeDefined();
      });

      console.log('\n========== 동기화된 데이터 샘플 ==========');
      departments.slice(0, 3).forEach((dept, idx) => {
        console.log(
          `부서 ${idx + 1}. ${dept.code} - ${dept.name} (externalId: ${dept.externalId})`,
        );
      });
      employees.slice(0, 3).forEach((emp, idx) => {
        console.log(
          `직원 ${idx + 1}. ${emp.employeeNumber} - ${emp.name} (externalId: ${emp.externalId})`,
        );
      });
    });

    it('외부 서버 동기화 후 FULL 시나리오 생성', async () => {
      // 외부 API가 없으면 스킵
      if (!externalApiAvailable) {
        console.log('⏭️  외부 API 접근 불가로 테스트 스킵');
        return;
      }

      // Given: 외부 API 접근 가능
      const config = {
        scenario: 'full',
        clearExisting: true,
        projectCount: 5,
        wbsPerProject: 10,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When: 외부 API에서 동기화 후 전체 사이클 생성
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);

      console.log('\n========== 생성된 Phase 결과 ==========');
      response.body.results.forEach((result: any) => {
        console.log(
          `${result.phase}: ${Object.keys(result.entityCounts).join(', ')}`,
        );
      });

      // Phase 8까지 모두 생성되었는지 확인
      const phases = response.body.results.map((r: any) => r.phase);
      expect(phases).toContain('Phase1');
      expect(phases).toContain('Phase2');
      expect(phases).toContain('Phase3');
      expect(phases).toContain('Phase4');
      expect(phases).toContain('Phase5');
      expect(phases).toContain('Phase6');
      expect(phases).toContain('Phase7');
      expect(phases).toContain('Phase8');

      console.log('\n✅ 외부 API 동기화 → FULL 시나리오 완료');
    });
  });

  describe('Fallback 테스트 (외부 API 접근 불가 시)', () => {
    it('외부 API 접근 불가 시 Faker 데이터로 대체', async () => {
      // 외부 API가 있으면 스킵 (Fallback 시나리오는 API 없을 때만 의미 있음)
      if (externalApiAvailable) {
        console.log('⏭️  외부 API 접근 가능하므로 Fallback 테스트 스킵');
        return;
      }

      // Given: 외부 API 접근 불가
      const config = {
        scenario: 'minimal',
        clearExisting: true,
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: faker로 대체되어 정상 생성됨
      expect(response.body.success).toBe(true);

      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();
      expect(phase1Result.entityCounts.Department).toBeGreaterThanOrEqual(1);
      expect(phase1Result.entityCounts.Employee).toBeGreaterThanOrEqual(1);

      console.log(
        '\n⚠️  외부 API 접근 불가 → Faker 데이터로 대체하여 정상 생성됨',
      );
      console.log(`  - 부서: ${phase1Result.entityCounts.Department}개`);
      console.log(`  - 직원: ${phase1Result.entityCounts.Employee}명`);
    });

    it('외부 API 불가 시에도 FULL 시나리오 생성 가능', async () => {
      // 외부 API가 있으면 스킵 (Fallback 시나리오는 API 없을 때만 의미 있음)
      if (externalApiAvailable) {
        console.log('⏭️  외부 API 접근 가능하므로 Fallback 테스트 스킵');
        return;
      }

      // Given: 외부 API 접근 불가
      const config = {
        scenario: 'full',
        clearExisting: true,
        projectCount: 3,
        wbsPerProject: 5,
        evaluationConfig: {
          periodCount: 1,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);

      const phases = response.body.results.map((r: any) => r.phase);
      expect(phases).toContain('Phase1');
      expect(phases).toContain('Phase8');

      console.log('\n⚠️  외부 API 접근 불가 시에도 FULL 시나리오 생성 완료');
      console.log(`  생성된 Phase: ${phases.join(', ')}`);
    });
  });
});
