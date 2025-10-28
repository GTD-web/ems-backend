import { BaseE2ETest } from '../base-e2e.spec';

/**
 * 대시보드 관련 시나리오
 */
export class DashboardScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 직원의 평가 현황 및 할당 데이터를 통합 조회한다
   */
  async 직원의_통합_현황을_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.evaluationPeriodId}/employees/${config.employeeId}/complete-status`)
      .expect(200);
    
    return response.body;
  }

  /**
   * 직원의 평가기간 현황을 조회한다 (기존 엔드포인트)
   */
  async 직원의_평가기간_현황을_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.evaluationPeriodId}/employees/${config.employeeId}/status`)
      .expect(200);
    
    return response.body;
  }

  /**
   * 직원의 할당 데이터를 조회한다 (기존 엔드포인트)
   */
  async 직원의_할당_데이터를_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.evaluationPeriodId}/employees/${config.employeeId}/assigned-data`)
      .expect(200);
    
    return response.body;
  }

  /**
   * 통합 현황과 기존 엔드포인트들의 데이터 일관성을 검증한다
   */
  async 통합_현황_데이터_일관성을_검증한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<{
    통합현황: any;
    기존Status: any;
    기존AssignedData: any;
    일관성검증결과: {
      평가기간일치: boolean;
      직원정보일치: boolean;
      평가대상여부일치: boolean;
      제외정보일치: boolean;
      프로젝트카운트일치: boolean;
    };
  }> {
    // 통합 현황 조회
    const 통합현황 = await this.직원의_통합_현황을_조회한다(config);
    
    // 기존 엔드포인트들 조회
    const [기존Status, 기존AssignedData] = await Promise.all([
      this.직원의_평가기간_현황을_조회한다(config),
      this.직원의_할당_데이터를_조회한다(config),
    ]);

    // 데이터 일관성 검증
    const 일관성검증결과 = {
      평가기간일치: 통합현황.evaluationPeriod.id === 기존AssignedData.evaluationPeriod.id,
      직원정보일치: 통합현황.employee.id === 기존AssignedData.employee.id,
      평가대상여부일치: 통합현황.isEvaluationTarget === 기존Status.isEvaluationTarget,
      제외정보일치: 통합현황.exclusionInfo.isExcluded === 기존Status.exclusionInfo.isExcluded,
      프로젝트카운트일치: 통합현황.projects.totalCount === 기존AssignedData.summary.totalProjects,
    };

    return {
      통합현황,
      기존Status,
      기존AssignedData,
      일관성검증결과,
    };
  }

  /**
   * 여러 직원의 통합 현황을 일괄 조회한다
   */
  async 여러_직원의_통합_현황을_일괄_조회한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
  }): Promise<any[]> {
    const results = await Promise.all(
      config.employeeIds.map(employeeId =>
        this.직원의_통합_현황을_조회한다({
          evaluationPeriodId: config.evaluationPeriodId,
          employeeId,
        })
      )
    );

    return results;
  }

  /**
   * 통합 현황의 응답 구조를 검증한다
   */
  async 통합_현황_응답_구조를_검증한다(통합현황: any): Promise<{
    필수필드존재: boolean;
    중복필드제거확인: boolean;
    평가항목구조일관성: boolean;
    프로젝트구조일관성: boolean;
  }> {
    // 필수 필드 존재 확인
    const 필수필드들 = [
      'evaluationPeriod', 'employee', 'isEvaluationTarget', 'exclusionInfo',
      'evaluationLine', 'wbsCriteria', 'performance', 'selfEvaluation',
      'primaryDownwardEvaluation', 'secondaryDownwardEvaluation',
      'peerEvaluation', 'finalEvaluation', 'projects'
    ];
    
    const 필수필드존재 = 필수필드들.every(field => 통합현황.hasOwnProperty(field));

    // 중복 필드 제거 확인
    const 중복필드제거확인 = !통합현황.hasOwnProperty('summary') && 
                           !통합현황.hasOwnProperty('editableStatus');

    // 평가 항목 구조 일관성 확인 (모든 평가 항목이 동일한 패턴)
    const 평가항목들 = ['selfEvaluation', 'primaryDownwardEvaluation', 'secondaryDownwardEvaluation'];
    const 평가항목구조일관성 = 평가항목들.every(항목 => {
      const 평가항목 = 통합현황[항목];
      return 평가항목 && 
             평가항목.hasOwnProperty('status') &&
             평가항목.hasOwnProperty('totalCount') &&
             평가항목.hasOwnProperty('completedCount') &&
             평가항목.hasOwnProperty('isEditable') &&
             평가항목.hasOwnProperty('totalScore') &&
             평가항목.hasOwnProperty('grade');
    });

    // 프로젝트 구조 일관성 확인
    const 프로젝트구조일관성 = 통합현황.projects &&
                              통합현황.projects.hasOwnProperty('totalCount') &&
                              통합현황.projects.hasOwnProperty('items') &&
                              Array.isArray(통합현황.projects.items) &&
                              통합현황.projects.totalCount === 통합현황.projects.items.length;

    return {
      필수필드존재,
      중복필드제거확인,
      평가항목구조일관성,
      프로젝트구조일관성,
    };
  }
}
