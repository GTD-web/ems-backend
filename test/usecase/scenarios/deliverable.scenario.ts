import { BaseE2ETest } from '../../base-e2e.spec';
import { DeliverableApiClient } from './api-clients/deliverable.api-client';
import { DashboardApiClient } from './api-clients/dashboard.api-client';

/**
 * 산출물 관리 시나리오
 *
 * 엔드포인트만을 사용하여 산출물 관련 기능을 테스트합니다.
 * WBS 자기평가 이후에 산출물을 등록하는 실제 사용자 워크플로우를 반영합니다.
 */
export class DeliverableScenario {
  private apiClient: DeliverableApiClient;
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new DeliverableApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  /**
   * 산출물 생성
   */
  async 산출물을_생성한다(config: {
    name: string;
    type: string;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
    createdBy?: string;
  }): Promise<any> {
    const result = await this.apiClient.create(config);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(config.name);
    expect(result.type).toBe(config.type);
    expect(result.employeeId).toBe(config.employeeId);
    expect(result.wbsItemId).toBe(config.wbsItemId);
    expect(result.isActive).toBe(true);

    return result;
  }

  /**
   * 산출물 수정
   */
  async 산출물을_수정한다(config: {
    id: string;
    name?: string;
    type?: string;
    description?: string;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
    updatedBy?: string;
  }): Promise<any> {
    const result = await this.apiClient.update(config);

    expect(result.id).toBe(config.id);
    if (config.name !== undefined) {
      expect(result.name).toBe(config.name);
    }
    if (config.isActive !== undefined) {
      expect(result.isActive).toBe(config.isActive);
    }

    return result;
  }

  /**
   * 산출물 삭제
   */
  async 산출물을_삭제한다(deliverableId: string): Promise<void> {
    await this.apiClient.delete(deliverableId);
  }

  /**
   * 벌크 산출물 생성
   */
  async 산출물을_벌크_생성한다(config: {
    deliverables: Array<{
      name: string;
      type: string;
      employeeId: string;
      wbsItemId: string;
      description?: string;
      filePath?: string;
    }>;
  }): Promise<any> {
    const result = await this.apiClient.bulkCreate(config);

    expect(result.successCount).toBeDefined();
    expect(result.failedCount).toBeDefined();
    expect(result.createdIds).toBeDefined();
    expect(Array.isArray(result.createdIds)).toBe(true);
    expect(result.failedItems).toBeDefined();
    expect(Array.isArray(result.failedItems)).toBe(true);

    return result;
  }

  /**
   * 벌크 산출물 삭제
   */
  async 산출물을_벌크_삭제한다(deliverableIds: string[]): Promise<any> {
    const result = await this.apiClient.bulkDelete(deliverableIds);

    expect(result.successCount).toBeDefined();
    expect(result.failedCount).toBeDefined();
    expect(result.failedIds).toBeDefined();
    expect(Array.isArray(result.failedIds)).toBe(true);

    return result;
  }

  /**
   * 직원별 산출물 조회
   */
  async 직원별_산출물을_조회한다(config: {
    employeeId: string;
    activeOnly?: boolean;
  }): Promise<any> {
    const result = await this.apiClient.getByEmployee(config);

    expect(result.deliverables).toBeDefined();
    expect(Array.isArray(result.deliverables)).toBe(true);
    expect(result.total).toBeDefined();

    return result;
  }

  /**
   * WBS 항목별 산출물 조회
   */
  async WBS항목별_산출물을_조회한다(config: {
    wbsItemId: string;
    activeOnly?: boolean;
  }): Promise<any> {
    const result = await this.apiClient.getByWbsItem(config);

    expect(result.deliverables).toBeDefined();
    expect(Array.isArray(result.deliverables)).toBe(true);
    expect(result.total).toBeDefined();

    return result;
  }

  /**
   * 산출물 상세 조회
   */
  async 산출물_상세를_조회한다(deliverableId: string): Promise<any> {
    const result = await this.apiClient.getDetail(deliverableId);

    expect(result.id).toBe(deliverableId);
    expect(result.name).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.employeeId).toBeDefined();
    expect(result.wbsItemId).toBeDefined();
    expect(result.isActive).toBeDefined();
    expect(result.createdAt).toBeDefined();

    return result;
  }

  /**
   * WBS 자기평가 이후 산출물 등록 시나리오
   *
   * 실제 사용 흐름:
   * 1. 자기평가 제출
   * 2. 산출물 생성
   * 3. 산출물 조회
   * 4. 산출물 수정
   */
  async WBS자기평가_이후_산출물_등록_시나리오를_실행한다(config: {
    selfEvaluationId: string;
    employeeId: string;
    wbsItemId: string;
  }): Promise<{
    자기평가상태: any;
    산출물생성결과: any;
    산출물조회결과: any;
    산출물수정결과: any;
    최종산출물: any;
  }> {
    console.log('🚀 WBS 자기평가 이후 산출물 등록 시나리오 시작');

    // 1. 자기평가 상태 확인
    console.log('📋 1단계: 자기평가 상태 확인');
    const 자기평가응답 = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/wbs-self-evaluations/${config.selfEvaluationId}`,
      )
      .expect(200);

    const 자기평가상태 = 자기평가응답.body;
    expect(자기평가상태.isCompleted).toBe(true);

    // 2. 산출물 생성
    console.log('📦 2단계: 산출물 생성');
    const 산출물생성결과 = await this.산출물을_생성한다({
      name: 'API 설계 문서',
      type: 'document',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      description: '백엔드 API 설계 문서 v1.0',
      filePath: '/deliverables/api-design-v1.0.pdf',
    });
    console.log('✅ 산출물 생성 완료 - ID:', 산출물생성결과.id);

    // 3. WBS별 산출물 조회
    console.log('🔍 3단계: WBS별 산출물 조회');
    const 산출물조회결과 = await this.WBS항목별_산출물을_조회한다({
      wbsItemId: config.wbsItemId,
      activeOnly: true,
    });
    expect(산출물조회결과.deliverables.length).toBeGreaterThan(0);

    // 3-1. 생성된 산출물 직접 조회 테스트
    console.log('🔍 3-1단계: 생성된 산출물 직접 조회 테스트');
    const 직접조회결과 = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/deliverables/${산출물생성결과.id}`)
      .expect(200);
    console.log('✅ 산출물 직접 조회 성공:', 직접조회결과.body.id);

    // 4. 산출물 수정 (버전 업데이트)
    console.log('✏️ 4단계: 산출물 수정 - ID:', 산출물생성결과.id);
    const 산출물수정결과 = await this.산출물을_수정한다({
      id: 산출물생성결과.id,
      description: '백엔드 API 설계 문서 v2.0 (피드백 반영)',
      filePath: '/deliverables/api-design-v2.0.pdf',
    });

    // 5. 최종 산출물 상세 조회
    console.log('🔍 5단계: 최종 산출물 상세 조회');
    const 최종산출물 = await this.산출물_상세를_조회한다(산출물생성결과.id);

    console.log('✅ WBS 자기평가 이후 산출물 등록 시나리오 완료');

    return {
      자기평가상태,
      산출물생성결과,
      산출물조회결과,
      산출물수정결과,
      최종산출물,
    };
  }

  /**
   * 여러 WBS에 대한 산출물 벌크 등록 시나리오
   */
  async 여러_WBS에_산출물을_벌크_등록하는_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemIds: string[];
  }): Promise<{
    벌크생성결과: any;
    직원별조회결과: any;
  }> {
    console.log('🚀 여러 WBS 산출물 벌크 등록 시나리오 시작');

    // 1. 여러 산출물 벌크 생성
    console.log('📦 1단계: 산출물 벌크 생성');
    const deliverables = config.wbsItemIds.map((wbsItemId, index) => ({
      name: `산출물 ${index + 1}`,
      type: index % 2 === 0 ? 'document' : 'code',
      employeeId: config.employeeId,
      wbsItemId,
      description: `산출물 설명 ${index + 1}`,
      filePath: `/deliverables/file-${index + 1}.pdf`,
    }));

    const 벌크생성결과 = await this.산출물을_벌크_생성한다({ deliverables });
    expect(벌크생성결과.successCount).toBe(config.wbsItemIds.length);
    expect(벌크생성결과.failedCount).toBe(0);

    // 2. 직원별 산출물 조회
    console.log('🔍 2단계: 직원별 산출물 조회');
    const 직원별조회결과 = await this.직원별_산출물을_조회한다({
      employeeId: config.employeeId,
      activeOnly: true,
    });
    expect(직원별조회결과.total).toBeGreaterThanOrEqual(
      config.wbsItemIds.length,
    );

    console.log('✅ 여러 WBS 산출물 벌크 등록 시나리오 완료');

    return {
      벌크생성결과,
      직원별조회결과,
    };
  }

  /**
   * 산출물 비활성화 및 삭제 시나리오
   */
  async 산출물_비활성화_및_삭제_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
  }): Promise<{
    생성결과: any;
    비활성화결과: any;
    비활성화조회결과: any;
    활성조회결과: any;
  }> {
    console.log('🚀 산출물 비활성화 및 삭제 시나리오 시작');

    // 1. 산출물 생성
    console.log('📦 1단계: 산출물 생성');
    const 생성결과 = await this.산출물을_생성한다({
      name: '테스트 산출물',
      type: 'other',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      description: '비활성화 테스트용 산출물',
    });
    console.log('✅ 산출물 생성 완료 - ID:', 생성결과.id);

    // 2. 산출물 비활성화
    console.log('🔒 2단계: 산출물 비활성화 - ID:', 생성결과.id);
    const 비활성화결과 = await this.산출물을_수정한다({
      id: 생성결과.id,
      isActive: false,
    });
    expect(비활성화결과.isActive).toBe(false);

    // 3. activeOnly=false로 조회 (비활성 산출물 포함)
    console.log('🔍 3단계: 비활성 산출물 포함 조회');
    const 비활성화조회결과 = await this.WBS항목별_산출물을_조회한다({
      wbsItemId: config.wbsItemId,
      activeOnly: false,
    });
    const 비활성산출물 = 비활성화조회결과.deliverables.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(비활성산출물).toBeDefined();
    expect(비활성산출물.isActive).toBe(false);

    // 4. activeOnly=true로 조회 (비활성 산출물 제외)
    console.log('🔍 4단계: 활성 산출물만 조회');
    const 활성조회결과 = await this.WBS항목별_산출물을_조회한다({
      wbsItemId: config.wbsItemId,
      activeOnly: true,
    });
    const 활성산출물 = 활성조회결과.deliverables.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(활성산출물).toBeUndefined();

    // 5. 산출물 삭제
    console.log('🗑️ 5단계: 산출물 삭제');
    await this.산출물을_삭제한다(생성결과.id);

    console.log('✅ 산출물 비활성화 및 삭제 시나리오 완료');

    return {
      생성결과,
      비활성화결과,
      비활성화조회결과,
      활성조회결과,
    };
  }

  /**
   * 전체 산출물 등록 시나리오 (자기평가 포함)
   *
   * 파사드 패턴: 자기평가 저장 → 제출 → 산출물 등록까지 전체 흐름
   */
  async 자기평가_후_산출물_등록_전체_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationScenario: any;
  }): Promise<{
    자기평가저장: any;
    자기평가제출: any;
    산출물결과: any;
  }> {
    console.log('🚀 자기평가 후 산출물 등록 전체 시나리오 시작');

    // 1. 자기평가 저장 및 제출
    console.log('📝 1단계: 자기평가 저장');
    const 자기평가저장 =
      await config.selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        periodId: config.periodId,
        selfEvaluationContent: 'API 개발 완료',
        selfEvaluationScore: 95,
        performanceResult: 'RESTful API 설계 및 구현 완료',
      });

    console.log('📤 2단계: 자기평가 제출');
    const 자기평가제출 =
      await config.selfEvaluationScenario.WBS자기평가를_제출한다(
        자기평가저장.id,
      );

    // 2. 산출물 등록 시나리오 실행
    console.log('📦 3단계: 산출물 등록');
    const 산출물결과 =
      await this.WBS자기평가_이후_산출물_등록_시나리오를_실행한다({
        selfEvaluationId: 자기평가저장.id,
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
      });

    console.log('✅ 자기평가 후 산출물 등록 전체 시나리오 완료');

    return {
      자기평가저장,
      자기평가제출,
      산출물결과,
    };
  }

  /**
   * 여러 WBS 자기평가 후 벌크 산출물 등록 시나리오
   */
  async 여러_WBS_자기평가_후_벌크_산출물_등록_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemIds: string[];
    periodId: string;
    selfEvaluationScenario: any;
  }): Promise<{
    자기평가저장결과들: any[];
    벌크산출물결과: any;
  }> {
    console.log('🚀 여러 WBS 자기평가 후 벌크 산출물 등록 시나리오 시작');

    // 1. 여러 WBS 자기평가 저장
    console.log('📝 1단계: 여러 WBS 자기평가 저장');
    const 자기평가저장결과들: any[] = [];
    for (let i = 0; i < config.wbsItemIds.length; i++) {
      const 저장결과 =
        await config.selfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: config.employeeId,
          wbsItemId: config.wbsItemIds[i],
          periodId: config.periodId,
          selfEvaluationContent: `WBS ${i + 1} 완료`,
          selfEvaluationScore: 85 + i * 5,
          performanceResult: `WBS ${i + 1} 성과 달성`,
        });
      자기평가저장결과들.push(저장결과);
    }

    // 2. 벌크 산출물 등록
    console.log('📦 2단계: 벌크 산출물 등록');
    const 벌크산출물결과 =
      await this.여러_WBS에_산출물을_벌크_등록하는_시나리오를_실행한다({
        employeeId: config.employeeId,
        wbsItemIds: config.wbsItemIds,
      });

    console.log('✅ 여러 WBS 자기평가 후 벌크 산출물 등록 시나리오 완료');

    return {
      자기평가저장결과들,
      벌크산출물결과,
    };
  }

  /**
   * 자기평가 후 산출물 비활성화 테스트 시나리오
   */
  async 자기평가_후_산출물_비활성화_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationScenario: any;
  }): Promise<{
    자기평가저장: any;
    자기평가제출: any;
    산출물결과: any;
  }> {
    console.log('🚀 자기평가 후 산출물 비활성화 시나리오 시작');

    // 1. 자기평가 저장 및 제출
    console.log('📝 1단계: 자기평가 저장 및 제출');
    const 자기평가저장 =
      await config.selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        periodId: config.periodId,
        selfEvaluationContent: '테스트 완료',
        selfEvaluationScore: 80,
        performanceResult: '테스트 성과',
      });

    const 자기평가제출 =
      await config.selfEvaluationScenario.WBS자기평가를_제출한다(
        자기평가저장.id,
      );

    // 2. 산출물 비활성화 및 삭제 시나리오 실행
    console.log('📦 2단계: 산출물 비활성화 및 삭제');
    const 산출물결과 = await this.산출물_비활성화_및_삭제_시나리오를_실행한다({
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });

    console.log('✅ 자기평가 후 산출물 비활성화 시나리오 완료');

    return {
      자기평가저장,
      자기평가제출,
      산출물결과,
    };
  }

  /**
   * 필수 필드 누락 에러 테스트 시나리오
   */
  async 산출물_생성_필수_필드_누락_에러_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
  }): Promise<void> {
    // 필수 필드 누락 시 400 에러 발생 검증
    await this.apiClient.createExpectError(
      {
        name: '산출물',
        // type 누락
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
      },
      400,
    );
  }

  /**
   * 존재하지 않는 산출물 조회 에러 시나리오
   */
  async 존재하지않는_산출물_조회_에러_시나리오를_실행한다(): Promise<void> {
    const 존재하지않는ID = '00000000-0000-0000-0000-000000000000';
    await this.apiClient.getDetailExpectError(존재하지않는ID, 404);
  }

  /**
   * 잘못된 UUID 형식 에러 시나리오
   */
  async 잘못된_UUID_형식_에러_시나리오를_실행한다(): Promise<void> {
    const 잘못된UUID = 'invalid-uuid-format';
    await this.apiClient.getDetailExpectError(잘못된UUID, 400);
  }

  /**
   * 산출물 등록 후 대시보드에서 deliverables 반환 검증 시나리오
   *
   * 실제 사용 흐름:
   * 1. WBS 할당 (대시보드에 표시되려면 필수)
   * 2. 자기평가 저장 및 제출
   * 3. 산출물 등록
   * 4. 대시보드 API에서 deliverables 포함 여부 검증
   */
  async 산출물_등록_후_대시보드_deliverables_검증_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    selfEvaluationScenario: any;
  }): Promise<{
    WBS할당결과: any;
    자기평가저장: any;
    자기평가제출: any;
    산출물생성결과들: any[];
    대시보드응답: any;
  }> {
    console.log('🚀 산출물 등록 후 대시보드 deliverables 검증 시나리오 시작');

    // 1. 프로젝트 할당 (WBS를 할당하기 전에 필요)
    console.log('📋 1단계: 프로젝트 할당 (이미 할당되어 있으면 스킵)');
    const 프로젝트할당응답 = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments/bulk')
      .send({
        assignments: [
          {
            employeeId: config.employeeId,
            projectId: config.projectId,
            periodId: config.periodId,
          },
        ],
      });

    // 201 Created 또는 409 Conflict (이미 할당됨) 허용
    expect([201, 409]).toContain(프로젝트할당응답.status);
    if (프로젝트할당응답.status === 201) {
      expect(프로젝트할당응답.body.length).toBeGreaterThan(0);
      console.log('✅ 프로젝트 할당 완료');
    } else {
      console.log('ℹ️ 프로젝트 이미 할당되어 있음 (스킵)');
    }

    // 2. WBS 할당 (대시보드에 표시되기 위해 필수)
    console.log('📋 2단계: WBS 할당 (이미 할당되어 있으면 스킵)');
    const WBS할당응답 = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        projectId: config.projectId,
        periodId: config.periodId,
      });

    // 201 Created 또는 409 Conflict (이미 할당됨) 허용
    expect([201, 409]).toContain(WBS할당응답.status);
    if (WBS할당응답.status === 201) {
      expect(WBS할당응답.body.id).toBeDefined();
      console.log('✅ WBS 할당 완료');
    } else {
      console.log('ℹ️ WBS 이미 할당되어 있음 (스킵)');
    }

    // 3. 자기평가 저장 및 제출
    console.log('📝 3단계: 자기평가 저장 및 제출');
    const 자기평가저장 =
      await config.selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        periodId: config.periodId,
        selfEvaluationContent: '대시보드 검증용 자기평가',
        selfEvaluationScore: 90,
        performanceResult: '대시보드 검증용 성과',
      });

    const 자기평가제출 =
      await config.selfEvaluationScenario.WBS자기평가를_제출한다(
        자기평가저장.id,
      );

    expect(자기평가제출.isCompleted).toBe(true);

    // 4. 여러 산출물 생성 (다양한 타입으로)
    console.log('📦 4단계: 여러 산출물 생성');
    const 산출물생성결과들: any[] = [];

    // 문서 타입 산출물
    const 산출물1 = await this.산출물을_생성한다({
      name: '요구사항 명세서',
      type: 'document',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      description: '프로젝트 요구사항 명세서',
      filePath: '/deliverables/requirements.pdf',
    });
    산출물생성결과들.push(산출물1);

    // 코드 타입 산출물
    const 산출물2 = await this.산출물을_생성한다({
      name: '소스코드',
      type: 'code',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      description: '구현된 소스코드',
      filePath: '/deliverables/source-code.zip',
    });
    산출물생성결과들.push(산출물2);

    // 디자인 타입 산출물
    const 산출물3 = await this.산출물을_생성한다({
      name: 'UI 디자인',
      type: 'design',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      description: 'UI/UX 디자인 파일',
      filePath: '/deliverables/ui-design.fig',
    });
    산출물생성결과들.push(산출물3);

    console.log(`✅ 산출물 ${산출물생성결과들.length}개 생성 완료`);

    // 5. 대시보드 API 호출 및 deliverables 검증
    console.log('🔍 5단계: 대시보드 API 호출 및 deliverables 검증');
    const 대시보드데이터 =
      await this.dashboardApiClient.getEmployeeAssignedData({
        periodId: config.periodId,
        employeeId: config.employeeId,
      });

    // 4. 검증: wbsList 내에 deliverables가 포함되어 있는지 확인
    this.대시보드에서_산출물_포함_여부를_검증한다(
      대시보드데이터,
      config.wbsItemId,
      산출물생성결과들,
    );

    console.log('✅ 산출물 등록 후 대시보드 deliverables 검증 시나리오 완료');

    return {
      WBS할당결과: WBS할당응답.status === 201 ? WBS할당응답.body : null,
      자기평가저장,
      자기평가제출,
      산출물생성결과들,
      대시보드응답: 대시보드데이터,
    };
  }

  /**
   * 대시보드 응답에서 산출물 포함 여부 검증 (private helper)
   */
  private 대시보드에서_산출물_포함_여부를_검증한다(
    대시보드데이터: any,
    wbsItemId: string,
    생성한산출물들: any[],
  ): void {
    expect(대시보드데이터.projects).toBeDefined();
    expect(Array.isArray(대시보드데이터.projects)).toBe(true);

    // 해당 WBS를 찾아서 deliverables 확인
    let 해당WBS찾음 = false;
    for (const project of 대시보드데이터.projects) {
      expect(project.wbsList).toBeDefined();
      expect(Array.isArray(project.wbsList)).toBe(true);

      for (const wbs of project.wbsList) {
        if (wbs.wbsId === wbsItemId) {
          해당WBS찾음 = true;

          // deliverables 필드 존재 여부 확인
          expect(wbs.deliverables).toBeDefined();
          expect(Array.isArray(wbs.deliverables)).toBe(true);

          // 생성한 산출물이 포함되어 있는지 확인 (시드 데이터에 이미 산출물이 있을 수 있음)
          expect(wbs.deliverables.length).toBeGreaterThanOrEqual(
            생성한산출물들.length,
          );

          // 각 산출물이 올바른 구조를 가지는지 확인
          for (const deliverable of wbs.deliverables) {
            expect(deliverable.id).toBeDefined();
            expect(deliverable.name).toBeDefined();
            expect(deliverable.type).toBeDefined();
            expect(deliverable.description).toBeDefined();
            expect(deliverable.filePath).toBeDefined();
            expect(deliverable.isActive).toBe(true);
            expect(deliverable.createdAt).toBeDefined();
          }

          // 생성한 산출물 ID들이 모두 포함되어 있는지 확인
          const 대시보드산출물IDs = wbs.deliverables.map((d: any) => d.id);
          const 생성한산출물IDs = 생성한산출물들.map((d) => d.id);
          for (const id of 생성한산출물IDs) {
            expect(대시보드산출물IDs).toContain(id);
          }

          console.log(
            `✅ WBS(${wbsItemId})에서 ${wbs.deliverables.length}개의 산출물 확인됨`,
          );
          break;
        }
      }

      if (해당WBS찾음) break;
    }

    expect(해당WBS찾음).toBe(true);
  }
}
