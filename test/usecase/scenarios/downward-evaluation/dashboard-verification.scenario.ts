import { BaseE2ETest } from '../../../base-e2e.spec';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';

/**
 * 하향평가 대시보드 검증 시나리오
 *
 * 대시보드 API를 통해 하향평가 데이터가 제대로 반환되는지 검증합니다.
 */
export class DownwardEvaluationDashboardScenario {
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  /**
   * 대시보드에서 1차/2차 하향평가 데이터 검증
   */
  async 대시보드에서_하향평가_데이터를_검증한다(config: {
    periodId: string;
    employeeId: string;
    wbsId: string;
    primary평가ID?: string;
    secondary평가ID?: string;
  }): Promise<{
    대시보드데이터: any;
    primary하향평가: any | null;
    secondary하향평가: any | null;
  }> {
    console.log('🔍 대시보드에서 하향평가 데이터 검증 시작...');
    console.log(`   피평가자 ID: ${config.employeeId}`);
    console.log(`   평가기간 ID: ${config.periodId}`);

    // 대시보드 직원 상태 조회
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.periodId}/employees/status`)
      .expect(200);

    console.log(`  🔍 대시보드 응답 직원 수: ${response.body.length}`);
    console.log(
      `  🔍 대시보드 응답 직원 IDs: ${response.body.map((emp: any) => emp.employeeId || 'undefined').join(', ')}`,
    );

    const 대시보드데이터 = response.body.find(
      (emp: any) => emp.employeeId === config.employeeId,
    );

    if (!대시보드데이터) {
      console.log(
        '  ❌ 대시보드 응답 전체:',
        JSON.stringify(response.body, null, 2),
      );
      throw new Error(
        `직원 ${config.employeeId}의 대시보드 데이터를 찾을 수 없습니다.`,
      );
    }

    console.log('  ✓ 대시보드 데이터 발견');
    console.log(`    직원: ${대시보드데이터.employee.name}`);

    // downwardEvaluation 필드 확인
    expect(대시보드데이터.downwardEvaluation).toBeDefined();
    console.log('  ✓ downwardEvaluation 필드 존재');

    // 1차 하향평가 확인
    let primary하향평가: any | null = null;
    if (대시보드데이터.downwardEvaluation.primary) {
      primary하향평가 = 대시보드데이터.downwardEvaluation.primary;
      console.log('  ✓ primary 하향평가 데이터 발견');
      console.log(`    - 상태: ${primary하향평가.status}`);
      console.log(`    - 할당된 WBS 수: ${primary하향평가.assignedWbsCount}`);
      console.log(
        `    - 완료된 평가 수: ${primary하향평가.completedEvaluationCount}`,
      );
      console.log(`    - 총점: ${primary하향평가.totalScore || 'N/A'}`);
      console.log(`    - 등급: ${primary하향평가.grade || 'N/A'}`);

      // 검증
      expect(primary하향평가).toBeDefined();
      expect(primary하향평가.assignedWbsCount).toBeGreaterThan(0);
      
      // 상태 검증 - 하향평가가 완료된 경우 상태가 'complete'이어야 함
      if (primary하향평가.completedEvaluationCount >= primary하향평가.assignedWbsCount) {
        expect(primary하향평가.status).toBe('complete');
        console.log('  ✓ 1차 하향평가 상태가 올바르게 완료됨');
      } else if (primary하향평가.completedEvaluationCount > 0) {
        expect(primary하향평가.status).toBe('in_progress');
        console.log('  ✓ 1차 하향평가 상태가 올바르게 진행중');
      } else {
        expect(primary하향평가.status).toBe('none');
        console.log('  ✓ 1차 하향평가 상태가 올바르게 없음');
      }
    }

    // 2차 하향평가 확인
    let secondary하향평가: any | null = null;
    if (대시보드데이터.downwardEvaluation.secondary) {
      secondary하향평가 = 대시보드데이터.downwardEvaluation.secondary;
      console.log('  ✓ secondary 하향평가 데이터 발견');
      console.log(
        `    - 평가자 수: ${secondary하향평가.evaluators?.length || 0}`,
      );
      console.log(`    - 총점: ${secondary하향평가.totalScore || 'N/A'}`);
      console.log(`    - 등급: ${secondary하향평가.grade || 'N/A'}`);

      // 검증
      expect(secondary하향평가).toBeDefined();
      if (
        secondary하향평가.evaluators &&
        secondary하향평가.evaluators.length > 0
      ) {
        expect(
          secondary하향평가.evaluators[0].assignedWbsCount,
        ).toBeGreaterThan(0);
        
        // 2차 하향평가 상태 검증
        const firstEvaluator = secondary하향평가.evaluators[0];
        console.log(`    - 첫 번째 평가자 상태: ${firstEvaluator.status}`);
        console.log(`    - 첫 번째 평가자 할당 WBS 수: ${firstEvaluator.assignedWbsCount}`);
        console.log(`    - 첫 번째 평가자 완료된 평가 수: ${firstEvaluator.completedEvaluationCount}`);
        
        if (firstEvaluator.completedEvaluationCount >= firstEvaluator.assignedWbsCount) {
          expect(firstEvaluator.status).toBe('complete');
          console.log('  ✓ 2차 하향평가 첫 번째 평가자 상태가 올바르게 완료됨');
        } else if (firstEvaluator.completedEvaluationCount > 0) {
          expect(firstEvaluator.status).toBe('in_progress');
          console.log('  ✓ 2차 하향평가 첫 번째 평가자 상태가 올바르게 진행중');
        } else {
          expect(firstEvaluator.status).toBe('none');
          console.log('  ✓ 2차 하향평가 첫 번째 평가자 상태가 올바르게 없음');
        }
      }
    }

    console.log('✅ 대시보드 하향평가 데이터 검증 완료');

    return {
      대시보드데이터,
      primary하향평가,
      secondary하향평가,
    };
  }

  /**
   * 대시보드에서 downwardEvaluation 요약 정보 검증
   */
  async 대시보드에서_하향평가_요약_검증한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<{
    대시보드데이터: any;
    하향평가요약: any;
  }> {
    console.log('🔍 대시보드에서 하향평가 요약 정보 검증 시작...');

    // 대시보드 직원 상태 조회
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.periodId}/employees/status`)
      .expect(200);

    const 대시보드데이터 = response.body.find(
      (emp: any) => emp.employee.id === config.employeeId,
    );

    if (!대시보드데이터) {
      throw new Error(
        `직원 ${config.employeeId}의 대시보드 데이터를 찾을 수 없습니다.`,
      );
    }

    // downwardEvaluation 필드 확인
    expect(대시보드데이터.downwardEvaluation).toBeDefined();

    const 하향평가요약 = 대시보드데이터.downwardEvaluation;

    console.log('  ✓ 하향평가 요약 정보:');
    console.log(`    - primary: ${하향평가요약.primary ? 'O' : 'X'}`);
    console.log(`    - secondary: ${하향평가요약.secondary ? 'O' : 'X'}`);

    if (하향평가요약.primary) {
      console.log(`    - primary 상태: ${하향평가요약.primary.status}`);
      console.log(
        `    - primary 총점: ${하향평가요약.primary.totalScore || 'N/A'}`,
      );
      console.log(`    - primary 등급: ${하향평가요약.primary.grade || 'N/A'}`);
    }

    if (하향평가요약.secondary) {
      console.log(
        `    - secondary 평가자 수: ${하향평가요약.secondary.evaluators?.length || 0}`,
      );
      console.log(
        `    - secondary 총점: ${하향평가요약.secondary.totalScore || 'N/A'}`,
      );
      console.log(
        `    - secondary 등급: ${하향평가요약.secondary.grade || 'N/A'}`,
      );
    }

    // 기본 필드 검증 - primary 또는 secondary가 있어야 함
    const hasPrimaryOrSecondary =
      하향평가요약.primary || 하향평가요약.secondary;
    expect(hasPrimaryOrSecondary).toBeTruthy();

    console.log('✅ 대시보드 하향평가 요약 검증 완료');

    return {
      대시보드데이터,
      하향평가요약,
    };
  }

  /**
   * 1차/2차 하향평가 작성 후 대시보드 검증 시나리오
   */
  async 하향평가_작성_후_대시보드_검증_시나리오를_실행한다(config: {
    periodId: string;
    employeeId: string;
    wbsId: string;
    primary평가ID: string;
    secondary평가ID?: string;
  }): Promise<{
    대시보드검증결과: any;
    요약검증결과: any;
  }> {
    console.log('🚀 하향평가 작성 후 대시보드 검증 시나리오 시작...');

    // 1. 대시보드에서 하향평가 데이터 검증
    const 대시보드검증결과 = await this.대시보드에서_하향평가_데이터를_검증한다(
      {
        periodId: config.periodId,
        employeeId: config.employeeId,
        wbsId: config.wbsId,
        primary평가ID: config.primary평가ID,
        secondary평가ID: config.secondary평가ID,
      },
    );

    // 2. 대시보드에서 하향평가 요약 검증
    const 요약검증결과 = await this.대시보드에서_하향평가_요약_검증한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 3. primary 데이터 존재 여부 검증
    expect(대시보드검증결과.primary하향평가).toBeDefined();
    expect(대시보드검증결과.primary하향평가.assignedWbsCount).toBeGreaterThan(
      0,
    );
    console.log('  ✓ primary 하향평가 데이터 존재 및 검증 완료');

    // 4. secondary 데이터 존재 여부 검증 (2차 평가자가 있는 경우)
    if (config.secondary평가ID) {
      expect(대시보드검증결과.secondary하향평가).toBeDefined();
      console.log('  ✓ secondary 하향평가 데이터 존재 및 검증 완료');
    }

    console.log('✅ 하향평가 작성 후 대시보드 검증 시나리오 완료!');

    return {
      대시보드검증결과,
      요약검증결과,
    };
  }
}
