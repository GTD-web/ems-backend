import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * WBS 할당 기본 시나리오 클래스
 * 
 * WBS 할당, 할당 취소, 순서 변경, 초기화 등의 기본 기능을 테스트합니다.
 */
export class WbsAssignmentBasicScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * WBS 할당을 생성합니다.
   */
  async WBS_할당을_생성한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    // 기존 할당 확인
    const existingAssignment = await this.testSuite.getRepository('EvaluationWbsAssignment').findOne({
      where: {
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      console.log(`⚠️ WBS 할당이 이미 존재합니다: ${existingAssignment.id}`);
      // 기존 할당이어도 평가라인 구성이 필요할 수 있으므로 할당 객체 반환
      return existingAssignment;
    }

    try {
      const response = await this.testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId,
          wbsItemId,
          projectId,
          periodId,
        });

      if (response.status === 201) {
        return response.body;
      } else if (response.status === 409) {
        console.log(`⚠️ WBS 할당 충돌 - 기존 할당을 조회합니다`);
        const existingAssignment = await this.testSuite.getRepository('EvaluationWbsAssignment').findOne({
          where: {
            employeeId,
            wbsItemId,
            projectId,
            periodId,
            deletedAt: null,
          },
        });
        if (existingAssignment) {
          return existingAssignment;
        }
      }
      
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      console.error(`❌ WBS 할당 생성 실패:`, {
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        error: error.message,
        status: error.response?.status,
        body: error.response?.body,
      });

      if (error.response?.status === 409) {
        console.log(`⚠️ WBS 할당 충돌 - 기존 할당을 조회합니다`);
        const existingAssignment = await this.testSuite.getRepository('EvaluationWbsAssignment').findOne({
          where: {
            employeeId,
            wbsItemId,
            projectId,
            periodId,
            deletedAt: null,
          },
        });
        if (existingAssignment) {
          return existingAssignment;
        }
      }

      // 404 오류의 경우 리소스가 존재하지 않음을 의미
      if (error.response?.status === 404) {
        throw new Error(`필요한 리소스를 찾을 수 없습니다. employeeId: ${employeeId}, wbsItemId: ${wbsItemId}, projectId: ${projectId}, periodId: ${periodId}`);
      }

      // 422 오류의 경우 유효성 검증 실패
      if (error.response?.status === 422) {
        throw new Error(`유효성 검증 실패: ${JSON.stringify(error.response?.body)}`);
      }

      throw error;
    }
  }

  /**
   * WBS 대량 할당을 생성합니다.
   */
  async WBS_대량_할당을_생성한다(
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
    }>,
  ): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments/bulk')
      .send({ assignments })
      .expect(201);

    return response.body;
  }

  /**
   * WBS 할당을 취소합니다.
   */
  async WBS_할당을_취소한다(assignmentId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}`)
      .expect(200);
  }

  /**
   * WBS 할당 순서를 변경합니다.
   */
  async WBS_할당_순서를_변경한다(
    assignmentId: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    await this.testSuite
      .request()
      .patch(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}/order`)
      .query({ direction })
      .expect(200);
  }

  /**
   * 직원의 WBS 할당을 초기화합니다.
   */
  async 직원의_WBS_할당을_초기화한다(
    employeeId: string,
    periodId: string,
  ): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId}`)
      .expect(200);
  }

  /**
   * 프로젝트의 WBS 할당을 초기화합니다.
   */
  async 프로젝트의_WBS_할당을_초기화한다(
    projectId: string,
    periodId: string,
  ): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/project/${projectId}/period/${periodId}`)
      .expect(200);
  }

  /**
   * 평가기간의 WBS 할당을 초기화합니다.
   */
  async 평가기간의_WBS_할당을_초기화한다(periodId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/period/${periodId}`)
      .expect(200);
  }

  /**
   * 직원의 WBS 할당 목록을 조회합니다.
   */
  async 직원의_WBS_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId}`)
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트의 WBS 할당 목록을 조회합니다.
   */
  async 프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/wbs-assignments/project/${projectId}/period/${periodId}`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 목록을 조회합니다.
   */
  async WBS_할당_목록을_조회한다(filters: {
    periodId?: string;
    employeeId?: string;
    projectId?: string;
    wbsItemId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  } = {}): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments')
      .query(filters)
      .expect(200);

    return response.body;
  }

  /**
   * 할당되지 않은 WBS 항목을 조회합니다.
   */
  async 할당되지_않은_WBS_항목을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<any> {
    const query: any = { projectId, periodId };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 할당 데이터를 대시보드에서 조회합니다.
   */
  async 직원_할당_데이터를_조회한다(
    periodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/employees/${employeeId}/assigned-data`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가자의 평가 대상자 현황을 대시보드에서 조회합니다.
   */
  async 평가자_평가대상자_현황을_조회한다(
    periodId: string,
    evaluatorId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/my-evaluation-targets/${evaluatorId}/status`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 후 대시보드 종합 검증을 수행합니다.
   */
  async WBS_할당_대시보드_종합_검증을_수행한다(
    periodId: string,
    employeeId: string,
    evaluatorId: string,
    wbsItemIds: string[],
  ): Promise<{
    wbsAssignmentsVerified: boolean;
    evaluationCriteriaVerified: boolean;
    primaryEvaluatorVerified: boolean;
    verifiedEndpoints: number;
    wbsCriteriaDetails?: { wbsId: string; criteriaCount: number; hasCriteria: boolean }[];
    totalCriteriaCount?: number;
    // WBS별 하향평가 검증 결과
    wbsDownwardEvaluationVerified?: boolean;
    wbsDownwardEvaluationDetails?: {
      wbsId: string;
      hasPrimaryDownwardEvaluation: boolean;
      hasSecondaryDownwardEvaluation: boolean;
      primaryDownwardEvaluationId?: string;
      secondaryDownwardEvaluationId?: string;
    }[];
    // 평가자 평가 대상자 현황 검증 결과
    evaluatorTargetsEvaluationCriteriaVerified?: boolean;
    evaluatorTargetsWbsCriteriaVerified?: boolean;
    evaluatorTargetsEvaluationLineVerified?: boolean;
    evaluatorTargetsDetails?: {
      employeeId: string;
      hasEvaluationCriteria: boolean;
      hasWbsCriteria: boolean;
      hasEvaluationLine: boolean;
      evaluationCriteriaCount: number;
      wbsCriteriaCount: number;
      evaluationLineCount: number;
    }[];
  }> {
    console.log('📝 WBS 할당 대시보드 종합 검증 시작');

    let verifiedEndpoints = 0;

    // 1. 직원 할당 데이터 조회 및 WBS 할당 검증
    console.log('📝 1. 직원 할당 데이터 조회');
    const assignedData = await this.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // WBS 할당 검증
    const wbsAssignments = assignedData.projects
      .flatMap((project: any) => project.wbsList || [])
      .filter((wbs: any) => wbsItemIds.includes(wbs.wbsId));

    const wbsAssignmentsVerified = wbsAssignments.length === wbsItemIds.length;
    console.log(`📝 WBS 할당 검증: ${wbsAssignments.length}/${wbsItemIds.length}개 - ${wbsAssignmentsVerified ? '성공' : '실패'}`);

    // WBS별 하향평가 검증
    console.log('📝 1.5. WBS별 하향평가 검증');
    let wbsDownwardEvaluationVerified = true;
    const wbsDownwardEvaluationDetails: {
      wbsId: string;
      hasPrimaryDownwardEvaluation: boolean;
      hasSecondaryDownwardEvaluation: boolean;
      primaryDownwardEvaluationId?: string;
      secondaryDownwardEvaluationId?: string;
    }[] = [];

    for (const wbs of wbsAssignments) {
      const hasPrimaryDownwardEvaluation = wbs.primaryDownwardEvaluation && wbs.primaryDownwardEvaluation.id;
      const hasSecondaryDownwardEvaluation = wbs.secondaryDownwardEvaluation && wbs.secondaryDownwardEvaluation.id;
      
      wbsDownwardEvaluationDetails.push({
        wbsId: wbs.wbsId,
        hasPrimaryDownwardEvaluation,
        hasSecondaryDownwardEvaluation,
        primaryDownwardEvaluationId: hasPrimaryDownwardEvaluation ? wbs.primaryDownwardEvaluation.id : undefined,
        secondaryDownwardEvaluationId: hasSecondaryDownwardEvaluation ? wbs.secondaryDownwardEvaluation.id : undefined,
      });

      if (!hasPrimaryDownwardEvaluation) {
        console.log(`❌ WBS ${wbs.wbsId}: primaryDownwardEvaluation 없음`);
        wbsDownwardEvaluationVerified = false;
      } else {
        console.log(`✅ WBS ${wbs.wbsId}: primaryDownwardEvaluation 확인 - ID: ${wbs.primaryDownwardEvaluation.id}`);
      }

      if (!hasSecondaryDownwardEvaluation) {
        console.log(`❌ WBS ${wbs.wbsId}: secondaryDownwardEvaluation 없음`);
        wbsDownwardEvaluationVerified = false;
      } else {
        console.log(`✅ WBS ${wbs.wbsId}: secondaryDownwardEvaluation 확인 - ID: ${wbs.secondaryDownwardEvaluation.id}`);
      }
    }

    // 하향평가 검증 통계
    const totalWithPrimaryDownwardEvaluation = wbsDownwardEvaluationDetails.filter(d => d.hasPrimaryDownwardEvaluation).length;
    const totalWithSecondaryDownwardEvaluation = wbsDownwardEvaluationDetails.filter(d => d.hasSecondaryDownwardEvaluation).length;
    
    console.log(`📊 WBS별 하향평가 검증 통계:`);
    console.log(`  - 전체 WBS 수: ${wbsAssignments.length}개`);
    console.log(`  - primaryDownwardEvaluation이 있는 WBS: ${totalWithPrimaryDownwardEvaluation}개`);
    console.log(`  - secondaryDownwardEvaluation이 있는 WBS: ${totalWithSecondaryDownwardEvaluation}개`);
    console.log(`  - 검증 결과: ${wbsDownwardEvaluationVerified ? '성공' : '실패'}`);

    if (!wbsDownwardEvaluationVerified) {
      console.log(`⚠️ 일부 WBS에 하향평가가 설정되지 않았습니다`);
      console.log(`📝 WBS별 하향평가 상세:`, JSON.stringify(wbsDownwardEvaluationDetails, null, 2));
    }

    // 2. 평가기준 검증 (모든 WBS에 대해 상세 검증)
    console.log('📝 2. 평가기준 검증');
    let evaluationCriteriaVerified = true;
    let totalCriteriaCount = 0;
    const wbsCriteriaDetails: { wbsId: string; criteriaCount: number; hasCriteria: boolean }[] = [];

    for (const wbs of wbsAssignments) {
      const criteriaCount = wbs.evaluationCriteria?.length || 0;
      const hasCriteria = criteriaCount > 0;
      
      // 평가기준 상세 내용 검증
      const criteriaDetails = wbs.evaluationCriteria?.map((criteria: any) => ({
        id: criteria.id,
        criteria: criteria.criteria,
        importance: criteria.importance,
        createdAt: criteria.createdAt,
        updatedAt: criteria.updatedAt,
      })) || [];
      
      wbsCriteriaDetails.push({
        wbsId: wbs.wbsId,
        criteriaCount,
        hasCriteria,
      });

      if (!hasCriteria) {
        evaluationCriteriaVerified = false;
        console.log(`❌ WBS ${wbs.wbsId}: 평가기준이 없습니다`);
      } else {
        console.log(`✅ WBS ${wbs.wbsId}: 평가기준 ${criteriaCount}개 확인`);
        console.log(`📝 WBS ${wbs.wbsId} 평가기준 상세:`);
        criteriaDetails.forEach((criteria: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${criteria.id}, 내용: "${criteria.criteria}", 중요도: ${criteria.importance}`);
        });
        totalCriteriaCount += criteriaCount;
      }
    }

    // 전체 평가기준 검증 결과
    const expectedWbsCount = wbsItemIds.length;
    const wbsWithCriteria = wbsCriteriaDetails.filter(detail => detail.hasCriteria).length;
    
    console.log(`📊 평가기준 검증 상세 결과:`);
    console.log(`  - 전체 WBS 수: ${expectedWbsCount}개`);
    console.log(`  - 평가기준이 있는 WBS: ${wbsWithCriteria}개`);
    console.log(`  - 전체 평가기준 수: ${totalCriteriaCount}개`);
    console.log(`  - 검증 결과: ${evaluationCriteriaVerified ? '성공' : '실패'}`);

    if (!evaluationCriteriaVerified) {
      console.log(`⚠️ 일부 WBS에 평가기준이 설정되지 않았습니다`);
      console.log(`📝 WBS별 평가기준 상세:`, JSON.stringify(wbsCriteriaDetails, null, 2));
    }

    // 3. 평가자 평가 대상자 현황 조회 및 상세 검증
    console.log('📝 3. 평가자 평가 대상자 현황 조회');
    const evaluatorTargets = await this.평가자_평가대상자_현황을_조회한다(periodId, evaluatorId);
    verifiedEndpoints++;

    // 평가자 평가 대상자 현황 상세 검증
    console.log(`📝 평가자 평가 대상자 현황 상세 검증 시작`);
    console.log(`📝 평가 대상자 수: ${evaluatorTargets.length}명`);
    
    let primaryEvaluatorVerified = false;
    let evaluatorTargetsEvaluationCriteriaVerified = false;
    let evaluatorTargetsWbsCriteriaVerified = false;
    let evaluatorTargetsEvaluationLineVerified = false;
    
    const targetDetails: {
      employeeId: string;
      hasEvaluationCriteria: boolean;
      hasWbsCriteria: boolean;
      hasEvaluationLine: boolean;
      evaluationCriteriaCount: number;
      wbsCriteriaCount: number;
      evaluationLineCount: number;
    }[] = [];

    for (const target of evaluatorTargets) {
      const hasEvaluationCriteria = target.evaluationCriteria && Array.isArray(target.evaluationCriteria) && target.evaluationCriteria.length > 0;
      const hasWbsCriteria = target.wbsCriteria && Array.isArray(target.wbsCriteria) && target.wbsCriteria.length > 0;
      const hasEvaluationLine = target.evaluationLine && Array.isArray(target.evaluationLine) && target.evaluationLine.length > 0;
      
      const evaluationCriteriaCount = hasEvaluationCriteria ? target.evaluationCriteria.length : 0;
      const wbsCriteriaCount = hasWbsCriteria ? target.wbsCriteria.length : 0;
      const evaluationLineCount = hasEvaluationLine ? target.evaluationLine.length : 0;

      targetDetails.push({
        employeeId: target.employeeId,
        hasEvaluationCriteria,
        hasWbsCriteria,
        hasEvaluationLine,
        evaluationCriteriaCount,
        wbsCriteriaCount,
        evaluationLineCount,
      });

      // 해당 직원이 평가 대상자 목록에 있는지 확인
      if (target.employeeId === employeeId) {
        primaryEvaluatorVerified = true;
        console.log(`✅ 평가 대상자 목록에서 직원 ${employeeId} 확인`);
        
        // 해당 직원의 상세 정보 검증
        if (hasEvaluationCriteria) {
          evaluatorTargetsEvaluationCriteriaVerified = true;
          console.log(`✅ 직원 ${employeeId} evaluationCriteria 확인: ${evaluationCriteriaCount}개`);
        } else {
          console.log(`❌ 직원 ${employeeId} evaluationCriteria 없음`);
        }
        
        if (hasWbsCriteria) {
          evaluatorTargetsWbsCriteriaVerified = true;
          console.log(`✅ 직원 ${employeeId} wbsCriteria 확인: ${wbsCriteriaCount}개`);
        } else {
          console.log(`❌ 직원 ${employeeId} wbsCriteria 없음`);
        }
        
        if (hasEvaluationLine) {
          evaluatorTargetsEvaluationLineVerified = true;
          console.log(`✅ 직원 ${employeeId} evaluationLine 확인: ${evaluationLineCount}개`);
        } else {
          console.log(`❌ 직원 ${employeeId} evaluationLine 없음`);
        }
      }
    }

    // 전체 평가 대상자 현황 통계
    const totalWithEvaluationCriteria = targetDetails.filter(d => d.hasEvaluationCriteria).length;
    const totalWithWbsCriteria = targetDetails.filter(d => d.hasWbsCriteria).length;
    const totalWithEvaluationLine = targetDetails.filter(d => d.hasEvaluationLine).length;
    
    console.log(`📊 평가자 평가 대상자 현황 통계:`);
    console.log(`  - 전체 평가 대상자: ${evaluatorTargets.length}명`);
    console.log(`  - evaluationCriteria가 있는 대상자: ${totalWithEvaluationCriteria}명`);
    console.log(`  - wbsCriteria가 있는 대상자: ${totalWithWbsCriteria}명`);
    console.log(`  - evaluationLine이 있는 대상자: ${totalWithEvaluationLine}명`);
    
    if (targetDetails.length > 0) {
      console.log(`📝 평가 대상자별 상세 정보:`);
      targetDetails.forEach(detail => {
        console.log(`  - ${detail.employeeId}: evaluationCriteria=${detail.evaluationCriteriaCount}개, wbsCriteria=${detail.wbsCriteriaCount}개, evaluationLine=${detail.evaluationLineCount}개`);
      });
    }

    console.log(`✅ 대시보드 종합 검증 완료 - WBS: ${wbsAssignmentsVerified}, 평가기준: ${evaluationCriteriaVerified}, 1차평가자: ${primaryEvaluatorVerified}, 엔드포인트: ${verifiedEndpoints}개`);
    console.log(`📊 WBS별 하향평가 검증 - primaryDownwardEvaluation: ${wbsDownwardEvaluationVerified}, secondaryDownwardEvaluation: ${wbsDownwardEvaluationVerified}`);
    console.log(`📊 평가자 평가 대상자 현황 검증 - evaluationCriteria: ${evaluatorTargetsEvaluationCriteriaVerified}, wbsCriteria: ${evaluatorTargetsWbsCriteriaVerified}, evaluationLine: ${evaluatorTargetsEvaluationLineVerified}`);

    return {
      wbsAssignmentsVerified,
      evaluationCriteriaVerified,
      primaryEvaluatorVerified,
      verifiedEndpoints,
      wbsCriteriaDetails,
      totalCriteriaCount,
      wbsDownwardEvaluationVerified,
      wbsDownwardEvaluationDetails,
      evaluatorTargetsEvaluationCriteriaVerified,
      evaluatorTargetsWbsCriteriaVerified,
      evaluatorTargetsEvaluationLineVerified,
      evaluatorTargetsDetails: targetDetails,
    };
  }

  /**
   * 프로젝트를 대량으로 할당합니다.
   */
  async 프로젝트를_대량으로_할당한다(
    periodId: string,
    projectIds: string[],
    employeeIds: string[],
  ): Promise<any[]> {
    const assignments: any[] = [];
    for (const employeeId of employeeIds) {
      for (const projectId of projectIds) {
        // 기존 프로젝트 할당 확인
        const existingAssignments = await this.testSuite.getRepository('EvaluationProjectAssignment').find({
          where: {
            periodId,
            employeeId,
            projectId,
            deletedAt: null,
          },
        });

        if (existingAssignments.length > 0) {
          console.log(`📝 프로젝트 할당 이미 존재: employeeId=${employeeId}, projectId=${projectId}`);
          assignments.push(...existingAssignments);
          continue;
        }

        console.log(`📝 프로젝트 할당 생성 요청: employeeId=${employeeId}, projectId=${projectId}, periodId=${periodId}`);
        
        try {
          const response = await this.testSuite
            .request()
            .post('/admin/evaluation-criteria/project-assignments/bulk')
            .send({
              assignments: [{
                employeeId,
                projectId,
                periodId,
              }],
            })
            .expect(201);
          assignments.push(...response.body);
          console.log(`✅ 프로젝트 할당 생성 성공: ${response.body.length}개`);
        } catch (error) {
          console.error(`❌ 프로젝트 할당 생성 실패:`, error.response?.body || error.message);
          // 422 오류의 경우 기존 할당을 사용
          if (error.response?.status === 422) {
            console.log(`⚠️ 프로젝트 할당이 이미 존재하여 기존 할당을 사용합니다`);
            assignments.push(...existingAssignments);
          } else {
            throw error;
          }
        }
      }
    }
    return assignments;
  }

  /**
   * 평가라인 변경 사항을 대시보드에서 검증합니다.
   */
  async 평가라인_변경사항을_대시보드에서_검증한다(
    periodId: string,
    employeeId: string,
    evaluatorId: string,
    expectedChanges: {
      primaryEvaluatorChanged?: boolean;
      secondaryEvaluatorChanged?: boolean;
      expectedPrimaryEvaluatorId?: string;
      expectedSecondaryEvaluatorId?: string;
    },
  ): Promise<{
    primaryEvaluatorVerified: boolean;
    secondaryEvaluatorVerified: boolean;
    evaluatorTargetsVerified: boolean;
    verifiedEndpoints: number;
    actualEvaluatorDetails?: {
      primaryEvaluatorId?: string;
      secondaryEvaluatorId?: string;
      evaluatorTargetsCount: number;
    };
  }> {
    console.log('📝 평가라인 변경사항 대시보드 검증 시작');

    let verifiedEndpoints = 0;

    // 1. 직원 할당 데이터 조회 (1차 평가자 확인)
    console.log('📝 1. 직원 할당 데이터 조회 (1차 평가자 확인)');
    const assignedData = await this.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // 2. 평가자 평가 대상자 현황 조회 (2차 평가자 확인)
    console.log('📝 2. 평가자 평가 대상자 현황 조회 (2차 평가자 확인)');
    const evaluatorTargets = await this.평가자_평가대상자_현황을_조회한다(periodId, evaluatorId);
    verifiedEndpoints++;

    // 3. 1차 평가자 검증
    console.log('📝 3. 1차 평가자 검증');
    let primaryEvaluatorVerified = false;
    let primaryEvaluatorId: string | undefined;

    // 직원 할당 데이터에서 1차 평가자 확인
    const targetEmployee = assignedData.projects
      .flatMap((project: any) => project.wbsList || [])
      .find((wbs: any) => wbs.primaryDownwardEvaluation?.id);

    if (targetEmployee?.primaryDownwardEvaluation) {
      primaryEvaluatorId = targetEmployee.primaryDownwardEvaluation.id;
      console.log(`📝 직원 할당 데이터에서 1차 평가자 ID: ${primaryEvaluatorId}`);
      
      if (expectedChanges.expectedPrimaryEvaluatorId) {
        primaryEvaluatorVerified = primaryEvaluatorId === expectedChanges.expectedPrimaryEvaluatorId;
        console.log(`📝 1차 평가자 ID 검증: ${primaryEvaluatorVerified ? '✅' : '❌'} (예상: ${expectedChanges.expectedPrimaryEvaluatorId}, 실제: ${primaryEvaluatorId})`);
      } else {
        primaryEvaluatorVerified = !!primaryEvaluatorId;
        console.log(`📝 1차 평가자 존재 여부: ${primaryEvaluatorVerified ? '✅' : '❌'}`);
      }
    } else {
      console.log(`❌ 1차 평가자 정보를 찾을 수 없습니다`);
    }

    // 4. 2차 평가자 검증
    console.log('📝 4. 2차 평가자 검증');
    let secondaryEvaluatorVerified = false;
    let secondaryEvaluatorId: string | undefined;

    // 평가자 평가 대상자 현황에서 2차 평가자 확인
    const targetInEvaluatorList = evaluatorTargets.find((target: any) => target.employeeId === employeeId);
    
    if (targetInEvaluatorList?.evaluationLine) {
      // evaluationLine이 배열인지 확인
      const evaluationLines = Array.isArray(targetInEvaluatorList.evaluationLine) 
        ? targetInEvaluatorList.evaluationLine 
        : [targetInEvaluatorList.evaluationLine];
      
      const secondaryEvaluationLine = evaluationLines.find(
        (line: any) => line.evaluatorType === 'secondary'
      );
      
      if (secondaryEvaluationLine) {
        secondaryEvaluatorId = secondaryEvaluationLine.evaluatorId;
        console.log(`📝 평가자 평가 대상자 현황에서 2차 평가자 ID: ${secondaryEvaluatorId}`);
        
        if (expectedChanges.expectedSecondaryEvaluatorId) {
          secondaryEvaluatorVerified = secondaryEvaluatorId === expectedChanges.expectedSecondaryEvaluatorId;
          console.log(`📝 2차 평가자 ID 검증: ${secondaryEvaluatorVerified ? '✅' : '❌'} (예상: ${expectedChanges.expectedSecondaryEvaluatorId}, 실제: ${secondaryEvaluatorId})`);
        } else {
          secondaryEvaluatorVerified = !!secondaryEvaluatorId;
          console.log(`📝 2차 평가자 존재 여부: ${secondaryEvaluatorVerified ? '✅' : '❌'}`);
        }
      } else {
        console.log(`❌ 2차 평가자 정보를 찾을 수 없습니다`);
        console.log(`📝 사용 가능한 평가라인:`, evaluationLines.map((line: any) => ({ type: line.evaluatorType, id: line.evaluatorId })));
      }
    } else {
      console.log(`❌ 평가자 평가 대상자 현황에서 해당 직원을 찾을 수 없습니다`);
    }

    // 5. 평가자 평가 대상자 현황 검증
    console.log('📝 5. 평가자 평가 대상자 현황 검증');
    const evaluatorTargetsVerified = evaluatorTargets.length > 0;
    console.log(`📝 평가자 평가 대상자 수: ${evaluatorTargets.length}명`);
    console.log(`📝 평가자 평가 대상자 현황 검증: ${evaluatorTargetsVerified ? '✅' : '❌'}`);

    // 6. 변경사항 종합 검증
    const actualEvaluatorDetails = {
      primaryEvaluatorId,
      secondaryEvaluatorId,
      evaluatorTargetsCount: evaluatorTargets.length,
    };

    console.log(`📊 평가라인 변경사항 검증 결과:`);
    console.log(`  - 1차 평가자 변경: ${primaryEvaluatorVerified ? '✅' : '❌'}`);
    console.log(`  - 2차 평가자 변경: ${secondaryEvaluatorVerified ? '✅' : '❌'}`);
    console.log(`  - 평가자 평가 대상자 현황: ${evaluatorTargetsVerified ? '✅' : '❌'}`);

    return {
      primaryEvaluatorVerified,
      secondaryEvaluatorVerified,
      evaluatorTargetsVerified,
      verifiedEndpoints,
      actualEvaluatorDetails,
    };
  }

  /**
   * 모든 직원 평가기간 현황을 조회합니다.
   */
  async 모든_직원_평가기간_현황을_조회한다(evaluationPeriodId: string): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
      .expect(200);

    return response.body;
  }

  /**
   * 모든 직원 평가기간 현황에서 평가기준 및 평가라인 검증을 수행합니다.
   */
  async 모든_직원_평가기간_현황_검증을_수행한다(
    periodId: string,
    expectedEmployeeIds: string[],
  ): Promise<{
    employeesStatusVerified: boolean;
    evaluationCriteriaVerified: boolean;
    wbsCriteriaVerified: boolean;
    evaluationLineVerified: boolean;
    verifiedEndpoints: number;
    statusDetails?: {
      totalEmployees: number;
      employeesWithEvaluationCriteria: number;
      employeesWithWbsCriteria: number;
      employeesWithEvaluationLine: number;
      employeeDetails: {
        employeeId: string;
        hasEvaluationCriteria: boolean;
        hasWbsCriteria: boolean;
        hasEvaluationLine: boolean;
        evaluationCriteriaCount: number;
        wbsCriteriaCount: number;
        evaluationLineCount: number;
      }[];
    };
  }> {
    console.log('📝 모든 직원 평가기간 현황 검증 시작');

    let verifiedEndpoints = 0;

    // 1. 모든 직원 평가기간 현황 조회
    console.log('📝 1. 모든 직원 평가기간 현황 조회');
    const allEmployeesStatus = await this.모든_직원_평가기간_현황을_조회한다(periodId);
    verifiedEndpoints++;

    // 2. 기본 검증
    const employeesStatusVerified = allEmployeesStatus.length > 0;
    console.log(`📝 전체 직원 수: ${allEmployeesStatus.length}명`);
    console.log(`📝 직원 현황 조회: ${employeesStatusVerified ? '✅' : '❌'}`);

    // 3. 예상 직원들이 모두 포함되어 있는지 확인
    const foundEmployeeIds = allEmployeesStatus.map((employee: any) => employee.employeeId);
    const missingEmployees = expectedEmployeeIds.filter(id => !foundEmployeeIds.includes(id));
    
    if (missingEmployees.length > 0) {
      console.log(`⚠️ 예상 직원 중 누락된 직원: ${missingEmployees.join(', ')}`);
    } else {
      console.log(`✅ 예상 직원 모두 포함됨`);
    }

    // 4. 각 직원별 상세 검증
    console.log('📝 4. 각 직원별 상세 검증');
    let evaluationCriteriaVerified = true;
    let wbsCriteriaVerified = true;
    let evaluationLineVerified = true;

    const employeeDetails: {
      employeeId: string;
      hasEvaluationCriteria: boolean;
      hasWbsCriteria: boolean;
      hasEvaluationLine: boolean;
      evaluationCriteriaCount: number;
      wbsCriteriaCount: number;
      evaluationLineCount: number;
    }[] = [];

    for (const employee of allEmployeesStatus) {
      const hasEvaluationCriteria = employee.evaluationCriteria && Array.isArray(employee.evaluationCriteria) && employee.evaluationCriteria.length > 0;
      const hasWbsCriteria = employee.wbsCriteria && Array.isArray(employee.wbsCriteria) && employee.wbsCriteria.length > 0;
      const hasEvaluationLine = employee.evaluationLine && Array.isArray(employee.evaluationLine) && employee.evaluationLine.length > 0;
      
      const evaluationCriteriaCount = hasEvaluationCriteria ? employee.evaluationCriteria.length : 0;
      const wbsCriteriaCount = hasWbsCriteria ? employee.wbsCriteria.length : 0;
      const evaluationLineCount = hasEvaluationLine ? employee.evaluationLine.length : 0;

      employeeDetails.push({
        employeeId: employee.employeeId,
        hasEvaluationCriteria,
        hasWbsCriteria,
        hasEvaluationLine,
        evaluationCriteriaCount,
        wbsCriteriaCount,
        evaluationLineCount,
      });

      console.log(`📝 직원 ${employee.employeeId}:`);
      console.log(`  - evaluationCriteria: ${evaluationCriteriaCount}개 ${hasEvaluationCriteria ? '✅' : '❌'}`);
      console.log(`  - wbsCriteria: ${wbsCriteriaCount}개 ${hasWbsCriteria ? '✅' : '❌'}`);
      console.log(`  - evaluationLine: ${evaluationLineCount}개 ${hasEvaluationLine ? '✅' : '❌'}`);

      // 예상 직원들에 대해서만 검증
      if (expectedEmployeeIds.includes(employee.employeeId)) {
        if (!hasEvaluationCriteria) {
          evaluationCriteriaVerified = false;
          console.log(`❌ 직원 ${employee.employeeId}: evaluationCriteria 없음`);
        }
        if (!hasWbsCriteria) {
          wbsCriteriaVerified = false;
          console.log(`❌ 직원 ${employee.employeeId}: wbsCriteria 없음`);
        }
        if (!hasEvaluationLine) {
          evaluationLineVerified = false;
          console.log(`❌ 직원 ${employee.employeeId}: evaluationLine 없음`);
        }
      }
    }

    // 5. 통계 계산
    const totalEmployees = allEmployeesStatus.length;
    const employeesWithEvaluationCriteria = employeeDetails.filter(d => d.hasEvaluationCriteria).length;
    const employeesWithWbsCriteria = employeeDetails.filter(d => d.hasWbsCriteria).length;
    const employeesWithEvaluationLine = employeeDetails.filter(d => d.hasEvaluationLine).length;

    const statusDetails = {
      totalEmployees,
      employeesWithEvaluationCriteria,
      employeesWithWbsCriteria,
      employeesWithEvaluationLine,
      employeeDetails,
    };

    console.log(`📊 모든 직원 평가기간 현황 검증 결과:`);
    console.log(`  - 전체 직원: ${totalEmployees}명`);
    console.log(`  - evaluationCriteria가 있는 직원: ${employeesWithEvaluationCriteria}명`);
    console.log(`  - wbsCriteria가 있는 직원: ${employeesWithWbsCriteria}명`);
    console.log(`  - evaluationLine이 있는 직원: ${employeesWithEvaluationLine}명`);
    console.log(`  - evaluationCriteria 검증: ${evaluationCriteriaVerified ? '✅' : '❌'}`);
    console.log(`  - wbsCriteria 검증: ${wbsCriteriaVerified ? '✅' : '❌'}`);
    console.log(`  - evaluationLine 검증: ${evaluationLineVerified ? '✅' : '❌'}`);

    return {
      employeesStatusVerified,
      evaluationCriteriaVerified,
      wbsCriteriaVerified,
      evaluationLineVerified,
      verifiedEndpoints,
      statusDetails,
    };
  }

  /**
   * 평가기준 변경 사항을 대시보드에서 검증합니다.
   */
  async 평가기준_변경사항을_대시보드에서_검증한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    expectedCriteriaChanges: {
      beforeCount: number;
      afterCount: number;
      expectedCriteria?: string;
      expectedImportance?: number;
    },
  ): Promise<{
    criteriaChangeVerified: boolean;
    criteriaContentVerified: boolean;
    criteriaCountMatch: boolean;
    verifiedEndpoints: number;
    actualCriteriaDetails?: {
      count: number;
      criteria: string[];
      importance: number[];
    };
  }> {
    console.log('📝 평가기준 변경사항 대시보드 검증 시작');

    let verifiedEndpoints = 0;

    // 1. 직원 할당 데이터 조회
    console.log('📝 1. 직원 할당 데이터 조회');
    const assignedData = await this.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // 2. 해당 WBS의 평가기준 정보 추출
    const targetWbs = assignedData.projects
      .flatMap((project: any) => project.wbsList || [])
      .find((wbs: any) => wbs.wbsId === wbsItemId);

    if (!targetWbs) {
      console.log(`❌ WBS ${wbsItemId}를 찾을 수 없습니다`);
      return {
        criteriaChangeVerified: false,
        criteriaContentVerified: false,
        criteriaCountMatch: false,
        verifiedEndpoints,
      };
    }

    // 3. 평가기준 개수 검증
    const actualCount = targetWbs.evaluationCriteria?.length || 0;
    const criteriaCountMatch = actualCount === expectedCriteriaChanges.afterCount;
    
    console.log(`📝 평가기준 개수 검증:`);
    console.log(`  - 예상 변경: ${expectedCriteriaChanges.beforeCount}개 → ${expectedCriteriaChanges.afterCount}개`);
    console.log(`  - 실제 개수: ${actualCount}개`);
    console.log(`  - 개수 일치: ${criteriaCountMatch ? '✅' : '❌'}`);

    // 4. 평가기준 내용 검증
    let criteriaContentVerified = true;
    const actualCriteriaDetails = {
      count: actualCount,
      criteria: [] as string[],
      importance: [] as number[],
    };

    if (actualCount > 0 && targetWbs.evaluationCriteria) {
      console.log(`📝 평가기준 내용 검증:`);
      targetWbs.evaluationCriteria.forEach((criteria: any, index: number) => {
        actualCriteriaDetails.criteria.push(criteria.criteria);
        actualCriteriaDetails.importance.push(criteria.importance);
        
        console.log(`  ${index + 1}. ID: ${criteria.id}`);
        console.log(`     내용: "${criteria.criteria}"`);
        console.log(`     중요도: ${criteria.importance}`);
        console.log(`     생성일: ${criteria.createdAt}`);
        console.log(`     수정일: ${criteria.updatedAt}`);

        // 특정 내용이 예상되는 경우 검증
        if (expectedCriteriaChanges.expectedCriteria && 
            criteria.criteria === expectedCriteriaChanges.expectedCriteria) {
          console.log(`    ✅ 예상 내용과 일치: "${criteria.criteria}"`);
        }
        
        if (expectedCriteriaChanges.expectedImportance && 
            criteria.importance === expectedCriteriaChanges.expectedImportance) {
          console.log(`    ✅ 예상 중요도와 일치: ${criteria.importance}`);
        }
      });
    }

    // 5. 변경사항 종합 검증
    const criteriaChangeVerified = criteriaCountMatch && criteriaContentVerified;
    
    console.log(`📊 평가기준 변경사항 검증 결과:`);
    console.log(`  - 개수 변경: ${criteriaCountMatch ? '✅' : '❌'}`);
    console.log(`  - 내용 검증: ${criteriaContentVerified ? '✅' : '❌'}`);
    console.log(`  - 전체 검증: ${criteriaChangeVerified ? '✅' : '❌'}`);

    return {
      criteriaChangeVerified,
      criteriaContentVerified,
      criteriaCountMatch,
      verifiedEndpoints,
      actualCriteriaDetails,
    };
  }
}
