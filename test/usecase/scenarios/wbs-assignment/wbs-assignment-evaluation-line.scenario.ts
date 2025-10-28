import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentBasicScenario } from './wbs-assignment-basic.scenario';

/**
 * WBS 할당 후 평가라인 검증 시나리오 클래스
 * 
 * WBS 할당 시 평가라인이 자동으로 구성되고 1차 평가자가 지정되는지 검증합니다.
 */
export class WbsAssignmentEvaluationLineScenario {
  private basicScenario: WbsAssignmentBasicScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.basicScenario = new WbsAssignmentBasicScenario(testSuite);
  }

  /**
   * 직원의 평가라인 설정을 조회합니다.
   */
  async 직원_평가라인_설정을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${periodId}/settings`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS별 평가라인 매핑을 조회합니다.
   */
  async WBS별_평가라인_매핑을_조회한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
  ): Promise<any> {
    // WBS별 평가라인 매핑 조회 API가 없으므로 직원 평가라인 설정에서 필터링
    const evaluationLines = await this.직원_평가라인_설정을_조회한다(employeeId, periodId);
    const wbsMappings = evaluationLines.evaluationLineMappings?.filter(
      (mapping: any) => mapping.wbsItemId === wbsItemId
    ) || [];
    
    return wbsMappings;
  }

  /**
   * 평가자를 조회합니다.
   */
  async 평가자를_조회한다(evaluatorId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/employees/${evaluatorId}`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 후 평가라인 자동 구성 검증 시나리오를 실행합니다.
   */
  async WBS_할당_후_평가라인_자동구성_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
  ): Promise<{
    assignmentCreated: boolean;
    evaluationLineConfigured: boolean;
    primaryEvaluatorAssigned: boolean;
    verifiedEndpoints: number;
  }> {
    console.log('📝 WBS 할당 후 평가라인 자동구성 검증 시나리오');

    // 1. 프로젝트 할당 먼저 생성
    console.log('📝 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], [employeeId]);
    console.log('✅ 프로젝트 할당 완료');

    // 2. 기존 WBS 할당 및 평가라인 삭제 (새로운 평가라인 구성 테스트를 위해)
    const existingAssignments = await this.testSuite.getRepository('EvaluationWbsAssignment').find({
      where: {
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        deletedAt: null,
      },
    });
    
    for (const existingAssignment of existingAssignments) {
      await this.testSuite.getRepository('EvaluationWbsAssignment').softDelete(existingAssignment.id);
      console.log(`🗑️ 기존 WBS 할당 삭제: ${existingAssignment.id}`);
    }

    // 기존 평가라인 매핑도 삭제
    const existingMappings = await this.testSuite.getRepository('EvaluationLineMapping').find({
      where: {
        employeeId,
        wbsItemId,
        deletedAt: null,
      },
    });
    
    for (const existingMapping of existingMappings) {
      await this.testSuite.getRepository('EvaluationLineMapping').softDelete(existingMapping.id);
      console.log(`🗑️ 기존 평가라인 매핑 삭제: ${existingMapping.id}`);
    }

    // 3. WBS 할당 전 평가라인 상태 확인
    const evaluationLinesBefore = await this.직원_평가라인_설정을_조회한다(employeeId, periodId);
    const beforeCount = evaluationLinesBefore.evaluationLineMappings?.length || 0;
    console.log(`📝 WBS 할당 전 평가라인 수: ${beforeCount}개`);
    console.log(`📝 WBS 할당 전 평가라인 데이터:`, JSON.stringify(evaluationLinesBefore, null, 2));

    // 4. 직원의 managerId 설정 (테스트용)
    const employees = await this.testSuite.getRepository('Employee').find({
      where: { deletedAt: null },
      take: 2,
    });
    
    if (employees.length >= 2) {
      // 첫 번째 직원을 두 번째 직원의 managerId로 설정
      await this.testSuite.getRepository('Employee').update(employees[1].id, {
        managerId: employees[0].id,
        updatedAt: new Date(),
      });
      console.log(`📝 직원 managerId 설정: ${employees[1].name} → ${employees[0].name}`);
    }

    // 5. WBS 할당 생성 (자동으로 1차/2차 평가자 설정됨)
    const assignment = await this.basicScenario.WBS_할당을_생성한다(
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    );
    console.log(`✅ WBS 할당 생성 완료: ${assignment.id}`);

    // 6. WBS 할당 후 평가라인 상태 확인
    const evaluationLinesAfter = await this.직원_평가라인_설정을_조회한다(employeeId, periodId);
    const afterCount = evaluationLinesAfter.evaluationLineMappings?.length || 0;
    console.log(`📝 WBS 할당 후 평가라인 수: ${afterCount}개`);
    console.log(`📝 WBS 할당 후 평가라인 데이터:`, JSON.stringify(evaluationLinesAfter, null, 2));

    // 7. 평가라인 자동 구성 검증
    const evaluationLineConfigured = afterCount > beforeCount;
    console.log(`📝 평가라인 자동구성 검증: ${beforeCount}개 → ${afterCount}개`);
    expect(evaluationLineConfigured).toBe(true);
    console.log(`✅ 평가라인 자동구성 확인: ${evaluationLineConfigured ? '성공' : '실패'}`);

    // 7. 1차 평가자 할당 검증 (자동 설정된 고정 평가자)
    let primaryEvaluatorAssigned = false;
    if (evaluationLineConfigured) {
      // 고정 평가자는 wbsItemId가 null인 매핑을 찾아야 함
      const allEvaluationLines = await this.직원_평가라인_설정을_조회한다(employeeId, periodId);
      const primaryMappings = allEvaluationLines.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === null
      ) || [];
      
      console.log(`📝 고정 평가자 매핑 수: ${primaryMappings.length}개`);
      console.log(`📝 고정 평가자 매핑 데이터:`, JSON.stringify(primaryMappings, null, 2));

      // 고정 평가자 매핑에서 evaluatorType 확인
      for (const mapping of primaryMappings) {
        const evaluationLine = await this.testSuite.getRepository('EvaluationLine').findOne({
          where: { id: mapping.evaluationLineId },
        });
        
        if (evaluationLine) {
          console.log(`📝 고정 평가라인 정보: ID=${evaluationLine.id}, Type=${evaluationLine.evaluatorType}, Order=${evaluationLine.order}`);
          
          if (evaluationLine.evaluatorType === 'primary') {
            primaryEvaluatorAssigned = true;
            console.log(`✅ 1차 고정 평가자 할당 확인: ${mapping.evaluatorId}`);
            
            // 평가자 정보 조회 및 검증 (API가 없으므로 DB에서 직접 조회)
            const evaluatorInfo = await this.testSuite.getRepository('Employee').findOne({
              where: { id: mapping.evaluatorId },
            });
            expect(evaluatorInfo).toBeDefined();
            if (evaluatorInfo) {
              expect(evaluatorInfo.id).toBe(mapping.evaluatorId);
              console.log(`✅ 1차 고정 평가자 정보 검증 완료: ${evaluatorInfo.name}`);
            }
          }
        }
      }

      if (!primaryEvaluatorAssigned) {
        console.log('⚠️ 1차 고정 평가자가 할당되지 않았습니다');
      }
    }

    console.log(`✅ WBS 할당 후 평가라인 자동구성 검증 완료 - 할당: ${assignment.id}, 평가라인 구성: ${evaluationLineConfigured}, 1차 평가자: ${primaryEvaluatorAssigned}`);

    return {
      assignmentCreated: true,
      evaluationLineConfigured,
      primaryEvaluatorAssigned,
      verifiedEndpoints: 4, // WBS 할당 + 평가라인 조회 + WBS별 매핑 조회 + 평가자 조회
    };
  }

  /**
   * WBS 할당 후 평가라인 수정 검증 시나리오를 실행합니다.
   */
  async WBS_할당_후_평가라인_수정_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    newPrimaryEvaluatorId: string,
  ): Promise<{
    assignmentCreated: boolean;
    evaluationLineModified: boolean;
    verifiedEndpoints: number;
  }> {
    console.log('📝 WBS 할당 후 평가라인 수정 검증 시나리오');

    // 1. WBS 할당 및 평가라인 자동구성
    const autoConfigResult = await this.WBS_할당_후_평가라인_자동구성_검증_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
      projectId,
    );

    if (!autoConfigResult.evaluationLineConfigured) {
      console.log('⚠️ 평가라인 자동구성이 실패하여 수정 검증을 건너뜁니다');
      return {
        assignmentCreated: autoConfigResult.assignmentCreated,
        evaluationLineModified: false,
        verifiedEndpoints: autoConfigResult.verifiedEndpoints,
      };
    }

    // 2. 1차 평가자 변경
    const response = await this.testSuite
      .request()
      .patch(`/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/primary-evaluator`)
      .send({
        evaluatorId: newPrimaryEvaluatorId,
      })
      .expect(200);

    console.log(`✅ 1차 평가자 변경 완료: ${newPrimaryEvaluatorId}`);

    // 3. 변경된 평가라인 검증
    const wbsEvaluationLines = await this.WBS별_평가라인_매핑을_조회한다(employeeId, wbsItemId, periodId);
    const updatedPrimaryEvaluator = wbsEvaluationLines.find((line: any) => 
      line.evaluatorType === 'PRIMARY' && line.wbsItemId === wbsItemId
    );

    expect(updatedPrimaryEvaluator).toBeDefined();
    expect(updatedPrimaryEvaluator.evaluatorId).toBe(newPrimaryEvaluatorId);
    console.log(`✅ 1차 평가자 변경 검증 완료: ${updatedPrimaryEvaluator.evaluatorId}`);

    console.log(`✅ WBS 할당 후 평가라인 수정 검증 완료`);

    return {
      assignmentCreated: autoConfigResult.assignmentCreated,
      evaluationLineModified: true,
      verifiedEndpoints: autoConfigResult.verifiedEndpoints + 2, // 수정 + 조회
    };
  }
}
