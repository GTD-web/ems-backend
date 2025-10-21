import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

describe('산출물 시드 데이터 검증', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;

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
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  describe('시드 데이터 생성 후 산출물 검증', () => {
    it('WITH_ASSIGNMENTS 시나리오로 산출물이 생성되어야 한다', async () => {
      // Given: WITH_ASSIGNMENTS 시나리오 설정 (Phase5 포함)
      const config = {
        scenario: 'with_assignments',
        clearExisting: true,
      };

      // When: 시드 데이터 생성
      const response = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send(config)
        .expect(201);

      // Then: 응답 검증
      expect(response.body.success).toBe(true);

      // Phase5 결과 확인
      const phase5Result = response.body.results.find(
        (r: any) => r.phase === 'Phase5',
      );
      expect(phase5Result).toBeDefined();
      console.log('\n📦 Phase5 결과:', JSON.stringify(phase5Result, null, 2));

      // 데이터베이스에서 산출물 확인
      const deliverableRepo = dataSource.getRepository(Deliverable);
      const deliverables = await deliverableRepo.find();

      console.log(`\n✅ 생성된 산출물 수: ${deliverables.length}개`);

      // 산출물이 생성되었는지 확인
      expect(deliverables.length).toBeGreaterThan(0);

      // 산출물 구조 검증
      if (deliverables.length > 0) {
        const firstDeliverable = deliverables[0];
        console.log(
          '\n📋 첫 번째 산출물 샘플:',
          JSON.stringify(
            {
              id: firstDeliverable.id,
              name: firstDeliverable.name,
              type: firstDeliverable.type,
              employeeId: firstDeliverable.employeeId,
              wbsItemId: firstDeliverable.wbsItemId,
              isActive: firstDeliverable.isActive,
              createdBy: firstDeliverable.createdBy,
              mappedBy: firstDeliverable.mappedBy,
              mappedDate: firstDeliverable.mappedDate,
            },
            null,
            2,
          ),
        );

        // 필수 필드 검증
        expect(firstDeliverable.id).toBeDefined();
        expect(firstDeliverable.name).toBeDefined();
        expect(firstDeliverable.type).toBeDefined();
        expect(firstDeliverable.employeeId).toBeDefined();
        expect(firstDeliverable.wbsItemId).toBeDefined();
        expect(firstDeliverable.isActive).toBe(true);
        expect(firstDeliverable.createdBy).toBeDefined();
        expect(firstDeliverable.mappedBy).toBeDefined();
        expect(firstDeliverable.mappedDate).toBeDefined();
      }

      // 통계 출력
      const typeStats = deliverables.reduce(
        (acc, d) => {
          acc[d.type] = (acc[d.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log('\n📊 산출물 유형별 통계:', typeStats);
    });
  });
});

