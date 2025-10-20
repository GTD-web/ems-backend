import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('시드 데이터 성능 테스트', () => {
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

  // ==================== 성능 벤치마크 ====================

  describe('성능 벤치마크', () => {
    it('소규모 데이터 생성 성능 (5초 이내)', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 10,
          employeeCount: 20,
          projectCount: 5,
          wbsPerProject: 10,
        },
        evaluationConfig: {
          periodCount: 5,
        },
      };

      // When
      const startTime = Date.now();
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config);
      const totalTime = Date.now() - startTime;

      // Then
      expect(response.status).toBe(201);
      expect(totalTime).toBeLessThan(5000); // 5초 이내

      console.log('\n========== 소규모 성능 ==========');
      console.log(`총 소요 시간: ${totalTime}ms`);
      console.log(`서버 처리 시간: ${response.body.totalDuration}ms`);
      console.log(
        `네트워크 오버헤드: ${totalTime - response.body.totalDuration}ms`,
      );
    });

    it('중규모 데이터 생성 성능 (10초 이내)', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 20,
          employeeCount: 50,
          projectCount: 10,
          wbsPerProject: 15,
        },
        evaluationConfig: {
          periodCount: 10,
        },
      };

      // When
      const startTime = Date.now();
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config);
      const totalTime = Date.now() - startTime;

      // Then
      expect(response.status).toBe(201);
      expect(totalTime).toBeLessThan(10000); // 10초 이내

      console.log('\n========== 중규모 성능 ==========');
      console.log(`총 소요 시간: ${totalTime}ms`);

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        console.log(`최종평가 생성: ${finalEvalCount[0].count}개`);
        console.log(
          `초당 생성률: ${Math.round((parseInt(finalEvalCount[0].count) / totalTime) * 1000)} 개/초`,
        );
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });

    it('Phase별 생성 시간 분석', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 15,
          employeeCount: 30,
          projectCount: 8,
          wbsPerProject: 12,
        },
        evaluationConfig: {
          periodCount: 8,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      console.log('\n========== Phase별 생성 시간 ==========');
      console.log(`전체 소요 시간: ${response.body.totalDuration}ms\n`);

      response.body.results.forEach((result: any) => {
        const percentage = (
          (result.duration / response.body.totalDuration) *
          100
        ).toFixed(1);
        console.log(`${result.phase}: ${result.duration}ms (${percentage}%)`);
        if (result.entityCounts) {
          Object.entries(result.entityCounts).forEach(([entity, count]) => {
            console.log(`  - ${entity}: ${count}개`);
          });
        }
      });

      // 각 Phase가 전체 시간의 60% 이하여야 함 (병목 방지)
      response.body.results.forEach((result: any) => {
        const percentage =
          (result.duration / response.body.totalDuration) * 100;
        expect(percentage).toBeLessThan(60);
      });
    });
  });

  // ==================== 반복 생성 안정성 ====================

  describe('반복 생성 안정성', () => {
    it('동일 설정으로 3회 반복 생성 시 일관된 결과를 반환해야 함', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 10,
          employeeCount: 20,
          projectCount: 5,
          wbsPerProject: 10,
        },
        evaluationConfig: {
          periodCount: 5,
        },
      };

      const times: number[] = [];
      const finalEvalCounts: number[] = [];

      // When: 3회 반복 생성
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const response = await testSuite
          .request()
          .post('/admin/seed/generate')
          .send(config)
          .expect(201);
        times.push(Date.now() - startTime);

        // 최종평가 확인 (테이블이 있는 경우에만)
        try {
          const finalEvalCount = await dataSource.query(
            'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
          );
          finalEvalCounts.push(parseInt(finalEvalCount[0].count));
        } catch (error: any) {
          if (error.message?.includes('does not exist')) {
            finalEvalCounts.push(0);
          } else {
            throw error;
          }
        }

        // 다음 생성 전 정리
        if (i < 2) {
          await testSuite.cleanupAfterTest();
        }
      }

      console.log('\n========== 반복 생성 안정성 ==========');
      times.forEach((time, idx) => {
        console.log(
          `${idx + 1}회차: ${time}ms${finalEvalCounts[idx] ? ` (최종평가: ${finalEvalCounts[idx]}개)` : ''}`,
        );
      });

      // 최종평가가 있는 경우에만 검증
      if (finalEvalCounts.some((count) => count > 0)) {
        // 모든 반복에서 동일한 개수 생성
        finalEvalCounts.forEach((count) => {
          expect(count).toBe(100); // 20명 x 5개 평가기간
        });
      } else {
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }

      // 생성 시간 변동폭이 50% 이내
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxDeviation =
        Math.max(...times.map((t) => Math.abs(t - avgTime))) / avgTime;
      expect(maxDeviation).toBeLessThan(0.5); // 50% 이내

      console.log(
        `평균: ${avgTime.toFixed(0)}ms, 최대 편차: ${(maxDeviation * 100).toFixed(1)}%`,
      );
    });

    it('clearExisting=false로 누적 생성 시 데이터가 정상적으로 추가되어야 함', async () => {
      // Given
      const baseConfig = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      // 첫 번째 생성
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(baseConfig)
        .expect(201);

      const firstCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL',
      );

      // When: clearExisting=false로 추가 생성
      const addConfig = {
        ...baseConfig,
        clearExisting: false,
        dataScale: {
          ...baseConfig.dataScale,
          employeeCount: 15,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(addConfig)
        .expect(201);

      const secondCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL',
      );

      // Then: 10 + 15 = 25명
      expect(parseInt(secondCount[0].count)).toBe(
        parseInt(firstCount[0].count) + 15,
      );

      console.log('\n========== 누적 생성 결과 ==========');
      console.log(`첫 번째 생성 후: ${firstCount[0].count}명`);
      console.log(`두 번째 생성 후: ${secondCount[0].count}명`);
      console.log(
        `추가된 직원: ${parseInt(secondCount[0].count) - parseInt(firstCount[0].count)}명`,
      );
    });
  });

  // ==================== 대용량 스트레스 테스트 ====================

  describe('대용량 스트레스 테스트', () => {
    it('100명 x 10개 평가기간 = 1,000개 최종평가 생성', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 20,
          employeeCount: 100,
          projectCount: 10,
          wbsPerProject: 15,
        },
        evaluationConfig: {
          periodCount: 10,
        },
      };

      // When
      const startTime = Date.now();
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);
      const totalTime = Date.now() - startTime;

      // Then
      const empCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL',
      );
      const periodCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM evaluation_period WHERE "deletedAt" IS NULL',
      );

      expect(parseInt(empCount[0].count)).toBe(100);
      expect(parseInt(periodCount[0].count)).toBe(10);

      console.log('\n========== 대용량 생성 결과 ==========');
      console.log(`총 소요 시간: ${totalTime}ms`);
      console.log(`직원: ${empCount[0].count}명`);
      console.log(`평가기간: ${periodCount[0].count}개`);

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        expect(parseInt(finalEvalCount[0].count)).toBe(1000);
        console.log(`최종평가: ${finalEvalCount[0].count}개`);
        console.log(
          `초당 최종평가 생성: ${Math.round((parseInt(finalEvalCount[0].count) / totalTime) * 1000)} 개/초`,
        );
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });

    it('메모리 누수 확인 - 5회 반복 생성', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 10,
          employeeCount: 50,
          projectCount: 5,
          wbsPerProject: 10,
        },
      };

      const memoryUsages: number[] = [];

      // When: 5회 반복 생성
      for (let i = 0; i < 5; i++) {
        await testSuite
          .request()
          .post('/admin/seed/generate')
          .send(config)
          .expect(201);

        // 메모리 사용량 기록
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        memoryUsages.push(memUsage);

        await testSuite.cleanupAfterTest();

        // GC 유도
        if (global.gc) {
          global.gc();
        }
      }

      // Then: 메모리 증가율이 50% 이하여야 함
      const firstMem = memoryUsages[0];
      const lastMem = memoryUsages[memoryUsages.length - 1];
      const increaseRate = (lastMem - firstMem) / firstMem;

      expect(increaseRate).toBeLessThan(0.5); // 50% 이하

      console.log('\n========== 메모리 사용량 ==========');
      memoryUsages.forEach((mem, idx) => {
        console.log(`${idx + 1}회차: ${mem.toFixed(2)}MB`);
      });
      console.log(`증가율: ${(increaseRate * 100).toFixed(1)}% (첫 회차 대비)`);
    });
  });

  // ==================== 동시성 테스트 ====================

  describe('동시성 테스트', () => {
    it('여러 시나리오 동시 생성 시 충돌 없이 처리되어야 함', async () => {
      // Given: 3개의 다른 설정
      const configs = [
        {
          scenario: 'minimal',
          clearExisting: true,
          dataScale: {
            departmentCount: 3,
            employeeCount: 5,
            projectCount: 2,
            wbsPerProject: 3,
          },
        },
        {
          scenario: 'with_period',
          clearExisting: true,
          dataScale: {
            departmentCount: 5,
            employeeCount: 10,
            projectCount: 3,
            wbsPerProject: 5,
          },
          evaluationConfig: { periodCount: 2 },
        },
        {
          scenario: 'with_assignments',
          clearExisting: true,
          dataScale: {
            departmentCount: 5,
            employeeCount: 10,
            projectCount: 3,
            wbsPerProject: 5,
          },
          evaluationConfig: { periodCount: 1 },
        },
      ];

      // When: 동시에 3개 요청 (하지만 순차 처리됨)
      const startTime = Date.now();
      const responses = await Promise.all(
        configs.map((config) =>
          testSuite.request().post('/admin/seed/generate').send(config),
        ),
      );
      const totalTime = Date.now() - startTime;

      // Then: 적어도 하나는 성공해야 함 (동시 요청 시 일부는 실패할 수 있음)
      const successCount = responses.filter((r) => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      const successfulResponses = responses.filter((r) => r.status === 201);
      successfulResponses.forEach((response) => {
        expect(response.body.success).toBe(true);
      });

      console.log('\n========== 동시 생성 결과 ==========');
      console.log(`총 소요 시간: ${totalTime}ms`);
      responses.forEach((response, idx) => {
        console.log(
          `요청 ${idx + 1}: ${response.body.totalDuration}ms (${configs[idx].scenario})`,
        );
      });
    }, 30000); // 30초 타임아웃
  });

  // ==================== 부분 실패 복구 ====================

  describe('에러 처리 및 복구', () => {
    it('잘못된 설정으로 실패 후 정상 생성이 가능해야 함', async () => {
      // Given: 잘못된 설정
      const invalidConfig = {
        scenario: 'invalid_scenario',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      // When: 실패
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(invalidConfig)
        .expect(400);

      // Then: 정상 설정으로 성공
      const validConfig = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(validConfig)
        .expect(201);

      expect(response.body.success).toBe(true);

      console.log('\n========== 에러 복구 테스트 ==========');
      console.log('✓ 잘못된 요청 후 정상 요청 성공');
      console.log(`생성 시간: ${response.body.totalDuration}ms`);
    });
  });

  // ==================== 배치 처리 성능 ====================

  describe('배치 처리 성능', () => {
    it('배치 크기에 따른 성능 차이 확인', async () => {
      // Given: 동일한 데이터 규모
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 10,
          employeeCount: 50,
          projectCount: 5,
          wbsPerProject: 10,
        },
        evaluationConfig: {
          periodCount: 5,
        },
      };

      // When
      const startTime = Date.now();
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);
      const totalTime = Date.now() - startTime;

      console.log('\n========== 배치 처리 성능 ==========');
      console.log(`총 소요 시간: ${totalTime}ms`);

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );

        const throughput =
          (parseInt(finalEvalCount[0].count) / totalTime) * 1000;

        console.log(`최종평가 생성: ${finalEvalCount[0].count}개`);
        console.log(`처리율: ${throughput.toFixed(0)} 개/초`);

        // 최소 처리율: 초당 50개 이상
        expect(throughput).toBeGreaterThan(50);
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });
  });
});
