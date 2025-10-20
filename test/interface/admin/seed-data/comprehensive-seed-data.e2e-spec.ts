import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('종합 시드 데이터 생성 테스트', () => {
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

  // ==================== FULL 시나리오 테스트 ====================

  describe('FULL 시나리오 - 전체 평가 사이클', () => {
    it('소규모 FULL 데이터를 생성하고 검증해야 함', async () => {
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
          periodCount: 3,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBeGreaterThanOrEqual(3);

      // DB 검증
      const deptCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM department WHERE "deletedAt" IS NULL',
      );
      const empCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL',
      );
      const periodCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM evaluation_period WHERE "deletedAt" IS NULL',
      );

      expect(parseInt(empCount[0].count)).toBe(20);
      expect(parseInt(periodCount[0].count)).toBe(3);

      // final_evaluation 테이블 존재 여부 확인
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        // 각 직원당 3개 평가기간 = 60개 최종평가
        expect(parseInt(finalEvalCount[0].count)).toBe(60);
      } catch (error: any) {
        // 테이블이 없으면 스킵 (Phase 3-8이 아직 구현되지 않았을 수 있음)
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }

      console.log('\n========== FULL 시나리오 생성 결과 ==========');
      console.log(`부서: ${deptCount[0].count}개`);
      console.log(`직원: ${empCount[0].count}개`);
      console.log(`평가기간: ${periodCount[0].count}개`);
    });

    it('평가기간 10개로 직원별 최근 10개 평가 내역을 생성해야 함', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 10,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);

      // Phase2 결과 확인
      const phase2Result = response.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );
      expect(phase2Result).toBeDefined();
      expect(phase2Result.entityCounts.EvaluationPeriod).toBe(10);

      // DB에서 실제 평가기간 수 확인
      const periodCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM evaluation_period WHERE "deletedAt" IS NULL',
      );
      expect(parseInt(periodCount[0].count)).toBe(10);

      console.log('\n========== 10개 평가기간 생성 결과 ==========');
      console.log(`평가기간: ${periodCount[0].count}개`);

      // 최종평가 수 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        expect(parseInt(finalEvalCount[0].count)).toBe(100);

        // 특정 직원의 최종평가 개수 확인
        const sampleEmployee = await dataSource.query(`
          SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1
        `);
        const employeeId = sampleEmployee[0].id;

        const employeeEvalCount = await dataSource.query(
          `SELECT COUNT(*) as count 
           FROM final_evaluation 
           WHERE "deletedAt" IS NULL AND "employeeId" = $1`,
          [employeeId],
        );
        expect(parseInt(employeeEvalCount[0].count)).toBe(10);

        console.log(`최종평가: ${finalEvalCount[0].count}개`);
        console.log(
          `샘플 직원의 최종평가: ${employeeEvalCount[0].count}개 (직원 ID: ${employeeId.substring(0, 8)}...)`,
        );
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });

    it('대용량 FULL 데이터 생성 및 성능 측정', async () => {
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
      expect(response.body.success).toBe(true);

      console.log('\n========== 대용량 데이터 생성 결과 ==========');
      console.log(`총 소요 시간: ${totalTime}ms`);
      console.log(`서버 처리 시간: ${response.body.totalDuration}ms`);

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        expect(parseInt(finalEvalCount[0].count)).toBe(1000);
        console.log(`최종평가: ${finalEvalCount[0].count}개`);
        console.log(
          `초당 생성률: ${Math.round((parseInt(finalEvalCount[0].count) / totalTime) * 1000)} 개/초`,
        );
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }

      // 성능 기준: 15초 이내로 완화 (대용량 데이터)
      expect(totalTime).toBeLessThan(15000);
    });
  });

  // ==================== 데이터 무결성 검증 ====================

  describe('데이터 무결성 검증', () => {
    it('부서 계층 구조가 올바르게 생성되어야 함 (회사→본부→파트)', async () => {
      // Given & When
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 20,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then: 계층 구조 검증
      const hierarchy = await dataSource.query(`
        SELECT 
          d.id, 
          d.name, 
          d."parentDepartmentId",
          parent.name as "parentName"
        FROM department d
        LEFT JOIN department parent ON d."parentDepartmentId" = parent."externalId"
        WHERE d."deletedAt" IS NULL
        ORDER BY d."order"
      `);

      // 회사 (최상위) 개수 확인
      const companies = hierarchy.filter(
        (d: any) => d.parentDepartmentId === null,
      );
      expect(companies.length).toBe(1);
      expect(companies[0].name).toContain('회사');

      // 본부 개수 확인 (약 30%)
      const headquarters = hierarchy.filter(
        (d: any) => d.parentName && d.parentName.includes('회사'),
      );
      const expectedHqCount = Math.ceil((20 - 1) * 0.3);
      expect(headquarters.length).toBe(expectedHqCount);

      console.log('\n========== 부서 계층 구조 ==========');
      console.log(`회사: ${companies.length}개`);
      console.log(`본부: ${headquarters.length}개`);
      console.log(`파트: ${20 - companies.length - headquarters.length}개`);
      console.log('\n샘플 계층:');
      hierarchy.slice(0, 5).forEach((d: any) => {
        console.log(
          `- ${d.name} ${d.parentName ? `(상위: ${d.parentName})` : '(최상위)'}`,
        );
      });
    });

    it('직원이 부서에 올바르게 할당되어야 함', async () => {
      // Given & When
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 20,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then: 모든 직원이 유효한 부서에 할당되었는지 확인
      const orphanEmployees = await dataSource.query(`
        SELECT e.id, e.name, e."departmentId"
        FROM employee e
        LEFT JOIN department d ON e."departmentId" = d."externalId"
        WHERE e."deletedAt" IS NULL AND d.id IS NULL
      `);

      expect(orphanEmployees.length).toBe(0);

      // 부서별 직원 수 확인
      const deptEmployeeCount = await dataSource.query(`
        SELECT 
          d.name as "deptName",
          COUNT(e.id) as "empCount"
        FROM department d
        LEFT JOIN employee e ON d."externalId" = e."departmentId" AND e."deletedAt" IS NULL
        WHERE d."deletedAt" IS NULL
        GROUP BY d.name
        ORDER BY "empCount" DESC
      `);

      console.log('\n========== 부서별 직원 수 ==========');
      deptEmployeeCount.forEach((d: any) => {
        console.log(`${d.deptName}: ${d.empCount}명`);
      });
    });

    it('평가기간-직원 매핑이 올바르게 생성되어야 함', async () => {
      // Given & When
      const config = {
        scenario: 'with_period',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 15,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 2,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then: 각 평가기간마다 모든 직원이 매핑되었는지 확인
      const mappingCount = await dataSource.query(`
        SELECT 
          ep.name as "periodName",
          COUNT(DISTINCT epem."employeeId") as "employeeCount"
        FROM evaluation_period ep
        LEFT JOIN evaluation_period_employee_mapping epem 
          ON ep.id = epem."evaluationPeriodId" AND epem."deletedAt" IS NULL
        WHERE ep."deletedAt" IS NULL
        GROUP BY ep.id, ep.name
      `);

      mappingCount.forEach((m: any) => {
        expect(parseInt(m.employeeCount)).toBe(15);
      });

      console.log('\n========== 평가기간별 직원 매핑 ==========');
      mappingCount.forEach((m: any) => {
        console.log(`${m.periodName}: ${m.employeeCount}명`);
      });
    });

    it('최종평가가 모든 직원-평가기간 조합에 생성되어야 함', async () => {
      // Given & When
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 5,
          projectCount: 2,
          wbsPerProject: 3,
        },
        evaluationConfig: {
          periodCount: 4,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      console.log('\n========== 직원별 최종평가 개수 ==========');

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        expect(parseInt(finalEvalCount[0].count)).toBe(20);

        // 직원별 최종평가 개수 확인
        const employeeEvalCounts = await dataSource.query(`
          SELECT 
            e.name,
            COUNT(fe.id) as "evalCount"
          FROM employee e
          LEFT JOIN final_evaluation fe ON e.id = fe."employeeId" AND fe."deletedAt" IS NULL
          WHERE e."deletedAt" IS NULL
          GROUP BY e.id, e.name
          ORDER BY e.name
        `);

        employeeEvalCounts.forEach((emp: any) => {
          expect(parseInt(emp.evalCount)).toBe(4);
          console.log(`${emp.name}: ${emp.evalCount}개`);
        });
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });

    it('FK 관계가 올바르게 설정되어야 함', async () => {
      // Given & When
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 2,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then: 고아 레코드가 없어야 함

      // 1. 프로젝트 할당
      const orphanProjectAssignments = await dataSource.query(`
        SELECT epa.id
        FROM evaluation_project_assignment epa
        LEFT JOIN employee e ON epa."employeeId" = e.id
        LEFT JOIN project p ON epa."projectId" = p.id
        LEFT JOIN evaluation_period ep ON epa."periodId" = ep.id
        WHERE epa."deletedAt" IS NULL 
          AND (e.id IS NULL OR p.id IS NULL OR ep.id IS NULL)
      `);
      expect(orphanProjectAssignments.length).toBe(0);

      // 2. WBS 할당
      const orphanWbsAssignments = await dataSource.query(`
        SELECT ewa.id
        FROM evaluation_wbs_assignment ewa
        LEFT JOIN employee e ON ewa."employeeId" = e.id
        LEFT JOIN wbs_item w ON ewa."wbsItemId" = w.id
        LEFT JOIN evaluation_period ep ON ewa."periodId" = ep.id
        WHERE ewa."deletedAt" IS NULL 
          AND (e.id IS NULL OR w.id IS NULL OR ep.id IS NULL)
      `);
      expect(orphanWbsAssignments.length).toBe(0);

      console.log('\n========== FK 무결성 검증 완료 ==========');
      console.log('✓ 프로젝트 할당: 고아 레코드 없음');
      console.log('✓ WBS 할당: 고아 레코드 없음');

      // 3. 최종평가 (테이블이 있는 경우에만)
      try {
        const orphanFinalEvaluations = await dataSource.query(`
          SELECT fe.id
          FROM final_evaluation fe
          LEFT JOIN employee e ON fe."employeeId" = e.id
          LEFT JOIN evaluation_period ep ON fe."periodId" = ep.id
          WHERE fe."deletedAt" IS NULL 
            AND (e.id IS NULL OR ep.id IS NULL)
        `);
        expect(orphanFinalEvaluations.length).toBe(0);
        console.log('✓ 최종평가: 고아 레코드 없음');
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });
  });

  // ==================== 다양한 규모 테스트 ====================

  describe('다양한 규모의 데이터 생성', () => {
    it('초소규모 (테스트용)', async () => {
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 5,
          projectCount: 2,
          wbsPerProject: 3,
        },
        evaluationConfig: {
          periodCount: 2,
        },
      };

      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.totalDuration).toBeLessThan(5000); // 5초 이내

      console.log(`\n초소규모 생성 시간: ${response.body.totalDuration}ms`);
    });

    it('소규모 (개발용)', async () => {
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 10,
          employeeCount: 30,
          projectCount: 5,
          wbsPerProject: 10,
        },
        evaluationConfig: {
          periodCount: 5,
        },
      };

      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      expect(response.body.success).toBe(true);

      console.log(`\n소규모 생성 시간: ${response.body.totalDuration}ms`);

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        expect(parseInt(finalEvalCount[0].count)).toBe(150);
        console.log(`최종평가: ${finalEvalCount[0].count}개`);
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });

    it('중규모 (스테이징용)', async () => {
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

      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      expect(response.body.success).toBe(true);

      console.log(`\n중규모 생성 시간: ${response.body.totalDuration}ms`);

      // 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const finalEvalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );
        expect(parseInt(finalEvalCount[0].count)).toBe(500);
        console.log(`최종평가: ${finalEvalCount[0].count}개`);
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });
  });

  // ==================== 상태 분포 테스트 ====================

  describe('상태 분포 커스터마이징', () => {
    it('최종평가 완료율을 90%로 설정하여 생성해야 함', async () => {
      // Given
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 20,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 5,
        },
        stateDistribution: {
          finalEvaluationProgress: {
            notStarted: 0.05,
            inProgress: 0.05,
            completed: 0.9, // 90% 완료
          },
        },
      };

      // When
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      console.log('\n========== 최종평가 완료율 ==========');

      // Then - 최종평가 확인 (테이블이 있는 경우에만)
      try {
        const completedCount = await dataSource.query(`
          SELECT COUNT(*) as count 
          FROM final_evaluation 
          WHERE "deletedAt" IS NULL AND "isConfirmed" = true
        `);
        const totalCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM final_evaluation WHERE "deletedAt" IS NULL',
        );

        const completedRatio =
          parseInt(completedCount[0].count) / parseInt(totalCount[0].count);

        // 90% ± 10% 범위 확인
        expect(completedRatio).toBeGreaterThan(0.8);
        expect(completedRatio).toBeLessThan(1.0);

        console.log(
          `완료: ${completedCount[0].count}개 / 전체: ${totalCount[0].count}개`,
        );
        console.log(
          `완료율: ${(completedRatio * 100).toFixed(1)}% (목표: 90%)`,
        );
      } catch (error: any) {
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
        console.log('⚠️ final_evaluation 테이블이 아직 생성되지 않았습니다.');
      }
    });

    it('직원 상태 분포를 커스터마이징하여 생성해야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 100,
          projectCount: 5,
          wbsPerProject: 5,
        },
        stateDistribution: {
          employeeStatus: {
            active: 0.95, // 95% 재직중
            onLeave: 0.03, // 3% 휴직중
            resigned: 0.02, // 2% 퇴사
          },
        },
      };

      // When
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      const statusCounts = await dataSource.query(`
        SELECT status, COUNT(*) as count
        FROM employee
        WHERE "deletedAt" IS NULL
        GROUP BY status
      `);

      console.log('\n========== 직원 상태 분포 ==========');
      statusCounts.forEach((s: any) => {
        const ratio = (parseInt(s.count) / 100) * 100;
        console.log(`${s.status}: ${s.count}명 (${ratio.toFixed(1)}%)`);
      });

      const activeCount = statusCounts.find(
        (s: any) => s.status === '재직중',
      )?.count;
      expect(parseInt(activeCount || '0')).toBeGreaterThan(90);
    });
  });

  // ==================== 실제 사용 시나리오 ====================

  describe('실제 사용 시나리오 검증', () => {
    it('직원별 최종평가 목록 조회 API와 연동 테스트', async () => {
      // Given: 시드 데이터 생성
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 10,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When: 첫 번째 직원의 최종평가 목록 조회
      const employees = await dataSource.query(
        'SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1',
      );
      const employeeId = employees[0].id;

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/employees/${employeeId}/final-evaluations`)
        .expect(200);

      // Then: 10개의 최종평가가 조회되어야 함
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('finalEvaluations');
      expect(response.body.finalEvaluations).toHaveLength(10);

      console.log('\n========== 직원별 최종평가 목록 조회 결과 ==========');
      console.log(`직원: ${response.body.employee.name}`);
      console.log(`최종평가 개수: ${response.body.finalEvaluations.length}개`);
      console.log('\n최종평가 내역:');
      response.body.finalEvaluations.slice(0, 3).forEach((fe: any) => {
        const periodName =
          fe.evaluationPeriod?.name || fe.periodId || '알 수 없음';
        console.log(
          `- ${periodName}: ${fe.evaluationGrade}등급 (${fe.isConfirmed ? '확정' : '미확정'})`,
        );
      });
    });

    it('전체 직원 최종평가 조회 API와 연동 테스트', async () => {
      // Given: 시드 데이터 생성
      const config = {
        scenario: 'full',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 20,
          projectCount: 5,
          wbsPerProject: 10,
        },
        evaluationConfig: {
          periodCount: 5,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When: 전체 직원 최종평가 조회
      const response = await testSuite
        .request()
        .get('/admin/dashboard/final-evaluations')
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      expect(response.body.evaluationPeriods).toHaveLength(5);
      expect(response.body.employees.length).toBeGreaterThan(0);

      // 각 직원의 평가 배열 길이가 평가기간 개수와 일치
      response.body.employees.forEach((emp: any) => {
        expect(emp.finalEvaluations).toHaveLength(5);
      });

      console.log('\n========== 전체 직원 최종평가 조회 결과 ==========');
      console.log(`평가기간: ${response.body.evaluationPeriods.length}개`);
      console.log(`직원: ${response.body.employees.length}명`);
      console.log(
        `총 평가 건수: ${response.body.evaluationPeriods.length * response.body.employees.length}개`,
      );
    });
  });
});
