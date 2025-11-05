import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DeliverableScenario } from '../../deliverable.scenario';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';

/**
 * 산출물 관리 시나리오
 *
 * deliverable-management.e2e-spec.ts에서 사용하는 복잡한 시나리오 메서드들을 제공합니다.
 * 기본 기능은 DeliverableScenario에서 위임합니다.
 */
export class DeliverableManagementScenario {
  private deliverableScenario: DeliverableScenario;
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.deliverableScenario = new DeliverableScenario(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  /**
   * 산출물 생성 및 대시보드 검증
   */
  async 산출물을_생성하고_대시보드를_검증한다(config: {
    name: string;
    type: string;
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    description?: string;
    filePath?: string;
  }): Promise<{
    생성결과: any;
    대시보드검증결과: any;
  }> {
    // 산출물 생성
    const 생성결과 = await this.deliverableScenario.산출물을_생성한다({
      name: config.name,
      type: config.type,
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      description: config.description,
      filePath: config.filePath,
    });

    // 대시보드 API 검증
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    expect(프로젝트).toBeDefined();

    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );
    expect(해당WBS).toBeDefined();
    expect(해당WBS.deliverables).toBeDefined();
    expect(Array.isArray(해당WBS.deliverables)).toBe(true);

    const 생성된산출물 = 해당WBS.deliverables.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(생성된산출물).toBeDefined();
    expect(생성된산출물.id).toBe(생성결과.id);
    expect(생성된산출물.name).toBe(config.name);
    expect(생성된산출물.type).toBe(config.type);
    expect(생성된산출물.employeeId).toBe(config.employeeId);
    expect(생성된산출물.isActive).toBe(true);

    // WBS 항목별 산출물 조회 검증
    const WBS산출물조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
      });
    expect(
      WBS산출물조회.deliverables.some((d: any) => d.id === 생성결과.id),
    ).toBe(true);

    // 직원별 산출물 조회 검증
    const 직원산출물조회 =
      await this.deliverableScenario.직원별_산출물을_조회한다({
        employeeId: config.employeeId,
      });
    expect(
      직원산출물조회.deliverables.some((d: any) => d.id === 생성결과.id),
    ).toBe(true);

    return {
      생성결과,
      대시보드검증결과: {
        할당데이터,
        프로젝트,
        해당WBS,
        생성된산출물,
        WBS산출물조회,
        직원산출물조회,
      },
    };
  }

  /**
   * 산출물 수정 및 대시보드 검증
   */
  async 산출물을_수정하고_대시보드를_검증한다(config: {
    id: string;
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    name?: string;
    type?: string;
    description?: string;
    filePath?: string;
    isActive?: boolean;
  }): Promise<{
    수정결과: any;
    대시보드검증결과: any;
    상세조회결과: any;
  }> {
    // 산출물 수정
    const 수정결과 = await this.deliverableScenario.산출물을_수정한다({
      id: config.id,
      name: config.name,
      type: config.type,
      description: config.description,
      filePath: config.filePath,
      isActive: config.isActive,
    });

    // 대시보드 API 수정 후 검증
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );

    // isActive=false인 경우 대시보드에서 제외 확인
    if (config.isActive === false) {
      const 수정된산출물 = 해당WBS.deliverables?.find(
        (d: any) => d.id === config.id,
      );
      expect(수정된산출물).toBeUndefined();
    }

    // 산출물 상세 조회 검증
    const 상세조회결과 = await this.deliverableScenario.산출물_상세를_조회한다(
      config.id,
    );

    return {
      수정결과,
      대시보드검증결과: { 할당데이터, 프로젝트, 해당WBS },
      상세조회결과,
    };
  }

  /**
   * 산출물 삭제 및 대시보드 검증
   */
  async 산출물을_삭제하고_대시보드를_검증한다(config: {
    id: string;
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<void> {
    // 산출물 삭제
    await this.deliverableScenario.산출물을_삭제한다(config.id);

    // 대시보드 API 삭제 후 검증
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );

    // 삭제된 산출물은 대시보드에서 제외되어야 함
    const 삭제된산출물 = 해당WBS.deliverables?.find(
      (d: any) => d.id === config.id,
    );
    expect(삭제된산출물).toBeUndefined();

    // WBS 항목별 산출물 조회 검증 (삭제된 산출물 제외)
    const WBS산출물조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
      });
    expect(
      WBS산출물조회.deliverables.some((d: any) => d.id === config.id),
    ).toBe(false);

    // 직원별 산출물 조회 검증 (삭제된 산출물 제외)
    const 직원산출물조회 =
      await this.deliverableScenario.직원별_산출물을_조회한다({
        employeeId: config.employeeId,
      });
    expect(
      직원산출물조회.deliverables.some((d: any) => d.id === config.id),
    ).toBe(false);
  }

  /**
   * 산출물 비활성화 및 대시보드 검증
   */
  async 산출물을_비활성화하고_대시보드를_검증한다(config: {
    id: string;
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    비활성화결과: any;
    대시보드검증결과: any;
    활성조회결과: any;
    전체조회결과: any;
    상세조회결과: any;
  }> {
    // 산출물 비활성화
    const 비활성화결과 = await this.deliverableScenario.산출물을_수정한다({
      id: config.id,
      isActive: false,
    });

    expect(비활성화결과.isActive).toBe(false);

    // 대시보드 API 비활성화 후 검증
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );

    // 비활성화된 산출물은 대시보드에서 제외되어야 함
    const 비활성화된산출물 = 해당WBS.deliverables?.find(
      (d: any) => d.id === config.id,
    );
    expect(비활성화된산출물).toBeUndefined();

    // activeOnly=true로 조회 시 비활성화된 산출물 제외 확인
    const 활성조회결과 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: true,
      });
    expect(
      활성조회결과.deliverables.some((d: any) => d.id === config.id),
    ).toBe(false);

    // activeOnly=false로 조회 시 비활성화된 산출물 포함 확인
    const 전체조회결과 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: false,
      });
    const 비활성산출물 = 전체조회결과.deliverables.find(
      (d: any) => d.id === config.id,
    );
    expect(비활성산출물).toBeDefined();
    expect(비활성산출물.isActive).toBe(false);

    // 산출물 상세 조회 시 비활성화된 산출물도 조회 가능 확인
    const 상세조회결과 = await this.deliverableScenario.산출물_상세를_조회한다(
      config.id,
    );
    expect(상세조회결과.isActive).toBe(false);

    return {
      비활성화결과,
      대시보드검증결과: { 할당데이터, 프로젝트, 해당WBS },
      활성조회결과,
      전체조회결과,
      상세조회결과,
    };
  }

  /**
   * 벌크 산출물 생성 및 대시보드 검증
   */
  async 벌크_산출물을_생성하고_대시보드를_검증한다(config: {
    deliverables: Array<{
      name: string;
      type: string;
      employeeId: string;
      wbsItemId: string;
      description?: string;
      filePath?: string;
    }>;
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    벌크생성결과: any;
    대시보드검증결과: any;
  }> {
    // 벌크 산출물 생성
    const 벌크생성결과 = await this.deliverableScenario.산출물을_벌크_생성한다({
      deliverables: config.deliverables,
    });

    // 대시보드 API 벌크 생성 후 검증
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );

    // 각 WBS에 생성된 산출물이 포함되어 있는지 확인
    const WBS별검증결과: any[] = [];
    for (let i = 0; i < config.deliverables.length; i++) {
      const wbsItemId = config.deliverables[i].wbsItemId;
      const 해당WBS = 프로젝트.wbsList.find(
        (w: any) => w.wbsId === wbsItemId,
      );
      expect(해당WBS).toBeDefined();
      expect(해당WBS.deliverables).toBeDefined();

      const 생성된산출물 = 해당WBS.deliverables.find(
        (d: any) => d.id === 벌크생성결과.createdIds[i],
      );
      expect(생성된산출물).toBeDefined();
      expect(생성된산출물.name).toBe(config.deliverables[i].name);

      // WBS 항목별 산출물 조회 검증
      const WBS산출물조회 =
        await this.deliverableScenario.WBS항목별_산출물을_조회한다({
          wbsItemId,
        });
      expect(WBS산출물조회.total).toBeGreaterThanOrEqual(1);
      expect(
        WBS산출물조회.deliverables.some(
          (d: any) => d.id === 벌크생성결과.createdIds[i],
        ),
      ).toBe(true);

      WBS별검증결과.push({
        wbsItemId,
        해당WBS,
        생성된산출물,
        WBS산출물조회,
      });
    }

    return {
      벌크생성결과,
      대시보드검증결과: { 할당데이터, 프로젝트, WBS별검증결과 },
    };
  }

  /**
   * 벌크 산출물 삭제 및 대시보드 검증
   */
  async 벌크_산출물을_삭제하고_대시보드를_검증한다(config: {
    deliverableIds: string[];
    employeeId: string;
    wbsItemIds: string[];
    projectId: string;
    periodId: string;
  }): Promise<{
    벌크삭제결과: any;
    대시보드검증결과: any;
  }> {
    // 벌크 산출물 삭제
    const 벌크삭제결과 = await this.deliverableScenario.산출물을_벌크_삭제한다(
      config.deliverableIds,
    );

    // 대시보드 API 벌크 삭제 후 검증
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );

    // 삭제된 산출물이 모든 WBS의 deliverables 배열에서 제외되는지 확인
    const WBS별검증결과: any[] = [];
    for (const wbsItemId of config.wbsItemIds) {
      const 해당WBS = 프로젝트.wbsList.find(
        (w: any) => w.wbsId === wbsItemId,
      );
      expect(해당WBS).toBeDefined();

      // 삭제된 산출물이 포함되지 않는지 확인
      for (const 삭제된ID of config.deliverableIds) {
        const 삭제된산출물 = 해당WBS.deliverables?.find(
          (d: any) => d.id === 삭제된ID,
        );
        expect(삭제된산출물).toBeUndefined();
      }

      // WBS 항목별 산출물 조회 검증
      const WBS산출물조회 =
        await this.deliverableScenario.WBS항목별_산출물을_조회한다({
          wbsItemId,
        });
      for (const 삭제된ID of config.deliverableIds) {
        expect(
          WBS산출물조회.deliverables.some((d: any) => d.id === 삭제된ID),
        ).toBe(false);
      }

      WBS별검증결과.push({
        wbsItemId,
        해당WBS,
        WBS산출물조회,
      });
    }

    return {
      벌크삭제결과,
      대시보드검증결과: { 할당데이터, 프로젝트, WBS별검증결과 },
    };
  }

  /**
   * 여러 엔드포인트 일관성 검증
   */
  async 산출물_일관성을_검증한다(config: {
    deliverableId: string;
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    대시보드산출물: any;
    WBS산출물: any;
    직원산출물: any;
    상세조회결과: any;
  }> {
    // 여러 엔드포인트에서 산출물 조회
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );
    const 대시보드산출물 = 해당WBS.deliverables.find(
      (d: any) => d.id === config.deliverableId,
    );

    const WBS산출물조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
      });
    const WBS산출물 = WBS산출물조회.deliverables.find(
      (d: any) => d.id === config.deliverableId,
    );

    const 직원산출물조회 =
      await this.deliverableScenario.직원별_산출물을_조회한다({
        employeeId: config.employeeId,
      });
    const 직원산출물 = 직원산출물조회.deliverables.find(
      (d: any) => d.id === config.deliverableId,
    );

    const 상세조회결과 = await this.deliverableScenario.산출물_상세를_조회한다(
      config.deliverableId,
    );

    // 일관성 검증
    if (대시보드산출물) {
      expect(대시보드산출물.id).toBe(상세조회결과.id);
      expect(대시보드산출물.name).toBe(상세조회결과.name);
      expect(대시보드산출물.type).toBe(상세조회결과.type);
    }

    if (WBS산출물) {
      expect(WBS산출물.id).toBe(상세조회결과.id);
      expect(WBS산출물.name).toBe(상세조회결과.name);
      expect(WBS산출물.type).toBe(상세조회결과.type);
    }

    if (직원산출물) {
      expect(직원산출물.id).toBe(상세조회결과.id);
      expect(직원산출물.name).toBe(상세조회결과.name);
      expect(직원산출물.type).toBe(상세조회결과.type);
    }

    return {
      대시보드산출물,
      WBS산출물,
      직원산출물,
      상세조회결과,
    };
  }

  /**
   * 산출물 상태 전환 검증 (생성 → 활성 → 비활성 → 활성 → 삭제)
   */
  async 산출물_상태_전환을_검증한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    name: string;
    type: string;
  }): Promise<{
    생성결과: any;
    비활성화결과: any;
    재활성화결과: any;
    삭제전상태: any;
  }> {
    // 1단계: 산출물 생성 (활성 상태)
    const 생성결과 = await this.deliverableScenario.산출물을_생성한다({
      name: config.name,
      type: config.type,
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });

    expect(생성결과.isActive).toBe(true);

    // 대시보드에서 활성 산출물 확인
    const 할당데이터1 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });
    const 프로젝트1 = 할당데이터1.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS1 = 프로젝트1.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );
    const 활성산출물1 = 해당WBS1.deliverables.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(활성산출물1).toBeDefined();
    expect(활성산출물1.isActive).toBe(true);

    // activeOnly=true로 조회 시 포함 확인
    const 활성조회1 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: true,
      });
    expect(
      활성조회1.deliverables.some((d: any) => d.id === 생성결과.id),
    ).toBe(true);

    // 2단계: 산출물 비활성화 (활성 → 비활성)
    const 비활성화결과 = await this.deliverableScenario.산출물을_수정한다({
      id: 생성결과.id,
      isActive: false,
    });

    // 대시보드에서 비활성화된 산출물 제외 확인
    const 할당데이터2 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });
    const 프로젝트2 = 할당데이터2.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS2 = 프로젝트2.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );
    const 비활성산출물 = 해당WBS2.deliverables?.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(비활성산출물).toBeUndefined();

    // activeOnly=true로 조회 시 제외 확인
    const 활성조회2 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: true,
      });
    expect(
      활성조회2.deliverables.some((d: any) => d.id === 생성결과.id),
    ).toBe(false);

    // activeOnly=false로 조회 시 포함 확인
    const 전체조회 = await this.deliverableScenario.WBS항목별_산출물을_조회한다(
      {
        wbsItemId: config.wbsItemId,
        activeOnly: false,
      },
    );
    const 비활성산출물조회 = 전체조회.deliverables.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(비활성산출물조회).toBeDefined();
    expect(비활성산출물조회.isActive).toBe(false);

    // 상세 조회 시 isActive=false 확인
    const 상세조회 = await this.deliverableScenario.산출물_상세를_조회한다(
      생성결과.id,
    );
    expect(상세조회.isActive).toBe(false);

    // 3단계: 산출물 활성화 (비활성 → 활성)
    const 재활성화결과 = await this.deliverableScenario.산출물을_수정한다({
      id: 생성결과.id,
      isActive: true,
    });

    // 대시보드에서 활성화된 산출물 포함 확인
    const 할당데이터3 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });
    const 프로젝트3 = 할당데이터3.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS3 = 프로젝트3.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );
    const 재활성화산출물 = 해당WBS3.deliverables.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(재활성화산출물).toBeDefined();
    expect(재활성화산출물.isActive).toBe(true);

    // activeOnly=true로 조회 시 포함 확인
    const 활성조회3 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: true,
      });
    expect(
      활성조회3.deliverables.some((d: any) => d.id === 생성결과.id),
    ).toBe(true);

    // 4단계: 삭제 전 상태 확인
    const 삭제전상태 = await this.deliverableScenario.산출물_상세를_조회한다(
      생성결과.id,
    );
    expect(삭제전상태.isActive).toBe(true);

    // 5단계: 산출물 삭제
    await this.deliverableScenario.산출물을_삭제한다(생성결과.id);

    // 대시보드에서 삭제된 산출물 제외 확인
    const 할당데이터4 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });
    const 프로젝트4 = 할당데이터4.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS4 = 프로젝트4.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );
    const 삭제된산출물 = 해당WBS4.deliverables?.find(
      (d: any) => d.id === 생성결과.id,
    );
    expect(삭제된산출물).toBeUndefined();

    // WBS 항목별 산출물 조회 시 제외 확인
    const 삭제후조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
      });
    expect(
      삭제후조회.deliverables.some((d: any) => d.id === 생성결과.id),
    ).toBe(false);

    return {
      생성결과,
      비활성화결과,
      재활성화결과,
      삭제전상태,
    };
  }

  /**
   * 직원별 독립성 검증
   */
  async 직원별_독립성을_검증한다(config: {
    employee1Id: string;
    employee2Id: string;
    wbsItemId1: string;
    wbsItemId2: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    직원1산출물: any;
    직원2산출물: any;
    직원1할당데이터: any;
    직원2할당데이터: any;
  }> {
    // 직원 1의 산출물 생성
    const 직원1산출물 = await this.deliverableScenario.산출물을_생성한다({
      name: '직원 1 산출물',
      type: 'document',
      employeeId: config.employee1Id,
      wbsItemId: config.wbsItemId1,
    });

    // 각 직원의 할당 데이터 조회
    const 직원1할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData(
      {
        periodId: config.periodId,
        employeeId: config.employee1Id,
      },
    );

    const 직원2할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData(
      {
        periodId: config.periodId,
        employeeId: config.employee2Id,
      },
    );

    // 직원 1의 산출물은 직원 1의 할당 데이터에만 포함
    const 직원1프로젝트 = 직원1할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 직원1WBS = 직원1프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId1,
    );
    const 직원1산출물확인 = 직원1WBS.deliverables.find(
      (d: any) => d.id === 직원1산출물.id,
    );
    expect(직원1산출물확인).toBeDefined();

    // 직원 2의 할당 데이터에는 직원 1의 산출물이 포함되지 않음
    const 직원2프로젝트 = 직원2할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 직원2WBS = 직원2프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId2,
    );
    const 직원1산출물이직원2에있음 = 직원2WBS.deliverables?.find(
      (d: any) => d.id === 직원1산출물.id,
    );
    expect(직원1산출물이직원2에있음).toBeUndefined();

    // 직원 2의 산출물 생성
    const 직원2산출물 = await this.deliverableScenario.산출물을_생성한다({
      name: '직원 2 산출물',
      type: 'code',
      employeeId: config.employee2Id,
      wbsItemId: config.wbsItemId2,
    });

    // 직원 2의 산출물은 직원 2의 할당 데이터에만 포함
    const 직원2할당데이터업데이트 =
      await this.dashboardApiClient.getEmployeeAssignedData({
        periodId: config.periodId,
        employeeId: config.employee2Id,
      });
    const 직원2프로젝트업데이트 = 직원2할당데이터업데이트.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 직원2WBS업데이트 = 직원2프로젝트업데이트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId2,
    );
    const 직원2산출물확인 = 직원2WBS업데이트.deliverables.find(
      (d: any) => d.id === 직원2산출물.id,
    );
    expect(직원2산출물확인).toBeDefined();

    // 직원 1의 할당 데이터에는 직원 2의 산출물이 포함되지 않음
    const 직원1할당데이터업데이트 =
      await this.dashboardApiClient.getEmployeeAssignedData({
        periodId: config.periodId,
        employeeId: config.employee1Id,
      });
    const 직원1프로젝트업데이트 = 직원1할당데이터업데이트.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 직원1WBS업데이트 = 직원1프로젝트업데이트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId1,
    );
    const 직원2산출물이직원1에있음 = 직원1WBS업데이트.deliverables?.find(
      (d: any) => d.id === 직원2산출물.id,
    );
    expect(직원2산출물이직원1에있음).toBeUndefined();

    return {
      직원1산출물,
      직원2산출물,
      직원1할당데이터: 직원1할당데이터업데이트,
      직원2할당데이터: 직원2할당데이터업데이트,
    };
  }

  /**
   * WBS별 독립성 검증
   */
  async WBS별_독립성을_검증한다(config: {
    employeeId: string;
    wbsItemId1: string;
    wbsItemId2: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    WBS1산출물: any;
    WBS2산출물: any;
    할당데이터: any;
  }> {
    // WBS 1의 산출물 생성
    const WBS1산출물 = await this.deliverableScenario.산출물을_생성한다({
      name: 'WBS 1 산출물',
      type: 'document',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId1,
    });

    // WBS별 산출물 조회
    const WBS1산출물조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId1,
      });

    const WBS2산출물조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId2,
      });

    // WBS 1의 산출물은 WBS 1에만 포함
    expect(
      WBS1산출물조회.deliverables.some((d: any) => d.id === WBS1산출물.id),
    ).toBe(true);

    // WBS 2의 산출물 목록에는 WBS 1의 산출물이 포함되지 않음
    expect(
      WBS2산출물조회.deliverables.some((d: any) => d.id === WBS1산출물.id),
    ).toBe(false);

    // 대시보드에서 WBS별 산출물 확인
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );

    const WBS1 = 프로젝트.wbsList.find((w: any) => w.wbsId === config.wbsItemId1);
    const WBS1산출물확인 = WBS1.deliverables.find(
      (d: any) => d.id === WBS1산출물.id,
    );
    expect(WBS1산출물확인).toBeDefined();

    const WBS2 = 프로젝트.wbsList.find((w: any) => w.wbsId === config.wbsItemId2);
    const WBS1산출물이WBS2에있음 = WBS2.deliverables?.find(
      (d: any) => d.id === WBS1산출물.id,
    );
    expect(WBS1산출물이WBS2에있음).toBeUndefined();

    // WBS 2의 산출물 생성
    const WBS2산출물 = await this.deliverableScenario.산출물을_생성한다({
      name: 'WBS 2 산출물',
      type: 'code',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId2,
    });

    // WBS 2의 산출물은 WBS 2에만 포함
    const WBS2산출물조회업데이트 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId2,
      });
    expect(
      WBS2산출물조회업데이트.deliverables.some(
        (d: any) => d.id === WBS2산출물.id,
      ),
    ).toBe(true);

    // WBS 1의 산출물 목록은 변경되지 않음
    const WBS1산출물조회업데이트 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId1,
      });
    expect(
      WBS1산출물조회업데이트.deliverables.some(
        (d: any) => d.id === WBS1산출물.id,
      ),
    ).toBe(true);
    expect(
      WBS1산출물조회업데이트.deliverables.some(
        (d: any) => d.id === WBS2산출물.id,
      ),
    ).toBe(false);

    // 대시보드에서 각 WBS별 산출물 확인
    const 할당데이터업데이트 =
      await this.dashboardApiClient.getEmployeeAssignedData({
        periodId: config.periodId,
        employeeId: config.employeeId,
      });

    const 프로젝트업데이트 = 할당데이터업데이트.projects.find(
      (p: any) => p.projectId === config.projectId,
    );

    const WBS1업데이트 = 프로젝트업데이트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId1,
    );
    expect(
      WBS1업데이트.deliverables.some((d: any) => d.id === WBS1산출물.id),
    ).toBe(true);
    expect(
      WBS1업데이트.deliverables.some((d: any) => d.id === WBS2산출물.id),
    ).toBe(false);

    const WBS2업데이트 = 프로젝트업데이트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId2,
    );
    expect(
      WBS2업데이트.deliverables.some((d: any) => d.id === WBS2산출물.id),
    ).toBe(true);
    expect(
      WBS2업데이트.deliverables.some((d: any) => d.id === WBS1산출물.id),
    ).toBe(false);

    return {
      WBS1산출물,
      WBS2산출물,
      할당데이터: 할당데이터업데이트,
    };
  }

  /**
   * 산출물 정렬 검증
   */
  async 산출물_정렬을_검증한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    생성된산출물들: any[];
    정렬검증결과: any;
  }> {
    // 여러 산출물 생성 (시간 간격을 두고)
    const 생성된산출물들: any[] = [];

    const 산출물1 = await this.deliverableScenario.산출물을_생성한다({
      name: '산출물 1',
      type: 'document',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });
    생성된산출물들.push(산출물1);

    // 약간의 시간 간격 (생성일시 차이를 위해)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const 산출물2 = await this.deliverableScenario.산출물을_생성한다({
      name: '산출물 2',
      type: 'code',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });
    생성된산출물들.push(산출물2);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const 산출물3 = await this.deliverableScenario.산출물을_생성한다({
      name: '산출물 3',
      type: 'design',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });
    생성된산출물들.push(산출물3);

    // WBS 항목별 산출물 조회
    const WBS산출물조회 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
      });

    // 정렬 검증 (생성일시 내림차순)
    expect(WBS산출물조회.deliverables.length).toBeGreaterThanOrEqual(3);

    let 이전생성일시: Date | null = null;
    for (const deliverable of WBS산출물조회.deliverables) {
      const 생성일시 = new Date(deliverable.createdAt);
      if (이전생성일시) {
        expect(생성일시.getTime()).toBeLessThanOrEqual(
          이전생성일시.getTime(),
        );
      }
      이전생성일시 = 생성일시;
    }

    // 가장 최근에 생성된 산출물이 배열의 첫 번째에 있는지 확인
    const 첫번째산출물 = WBS산출물조회.deliverables[0];
    expect(첫번째산출물.id).toBe(산출물3.id); // 가장 최근 생성

    // 대시보드에서도 정렬 확인
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );

    let 이전생성일시대시보드: Date | null = null;
    for (const deliverable of 해당WBS.deliverables) {
      const 생성일시 = new Date(deliverable.createdAt);
      if (이전생성일시대시보드) {
        expect(생성일시.getTime()).toBeLessThanOrEqual(
          이전생성일시대시보드.getTime(),
        );
      }
      이전생성일시대시보드 = 생성일시;
    }

    // 가장 최근에 생성된 산출물이 배열의 첫 번째에 있는지 확인
    const 첫번째산출물대시보드 = 해당WBS.deliverables[0];
    expect(첫번째산출물대시보드.id).toBe(산출물3.id);

    return {
      생성된산출물들,
      정렬검증결과: {
        WBS산출물조회,
        할당데이터,
        프로젝트,
        해당WBS,
      },
    };
  }

  /**
   * 산출물 필터링 검증
   */
  async 산출물_필터링을_검증한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    활성산출물1: any;
    활성산출물2: any;
    활성조회결과: any;
    전체조회결과: any;
    대시보드검증결과: any;
  }> {
    // 활성 산출물 2개 생성
    const 활성산출물1 = await this.deliverableScenario.산출물을_생성한다({
      name: '활성 산출물 1',
      type: 'document',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });

    const 활성산출물2 = await this.deliverableScenario.산출물을_생성한다({
      name: '활성 산출물 2',
      type: 'code',
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    });

    // 산출물 2 비활성화
    await this.deliverableScenario.산출물을_수정한다({
      id: 활성산출물2.id,
      isActive: false,
    });

    // activeOnly=true로 조회
    const 활성조회결과 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: true,
      });

    // 필터링 검증
    expect(
      활성조회결과.deliverables.some((d: any) => d.id === 활성산출물1.id),
    ).toBe(true);
    expect(
      활성조회결과.deliverables.some((d: any) => d.id === 활성산출물2.id),
    ).toBe(false);
    expect(활성조회결과.total).toBeGreaterThanOrEqual(1);

    // activeOnly=false로 조회
    const 전체조회결과 =
      await this.deliverableScenario.WBS항목별_산출물을_조회한다({
        wbsItemId: config.wbsItemId,
        activeOnly: false,
      });

    // 필터링 검증
    expect(
      전체조회결과.deliverables.some((d: any) => d.id === 활성산출물1.id),
    ).toBe(true);
    expect(
      전체조회결과.deliverables.some((d: any) => d.id === 활성산출물2.id),
    ).toBe(true);
    expect(전체조회결과.total).toBeGreaterThanOrEqual(2);

    // 대시보드에서도 필터링 확인
    const 할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    const 프로젝트 = 할당데이터.projects.find(
      (p: any) => p.projectId === config.projectId,
    );
    const 해당WBS = 프로젝트.wbsList.find(
      (w: any) => w.wbsId === config.wbsItemId,
    );

    // 대시보드는 활성 산출물만 포함
    expect(
      해당WBS.deliverables.some((d: any) => d.id === 활성산출물1.id),
    ).toBe(true);
    expect(
      해당WBS.deliverables.some((d: any) => d.id === 활성산출물2.id),
    ).toBe(false);

    return {
      활성산출물1,
      활성산출물2,
      활성조회결과,
      전체조회결과,
      대시보드검증결과: { 할당데이터, 프로젝트, 해당WBS },
    };
  }

  /**
   * 기본 메서드들 위임 (DeliverableScenario)
   */
  async 산출물을_생성한다(config: {
    name: string;
    type: string;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
  }): Promise<any> {
    return this.deliverableScenario.산출물을_생성한다(config);
  }

  async 산출물을_수정한다(config: {
    id: string;
    name?: string;
    type?: string;
    description?: string;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
  }): Promise<any> {
    return this.deliverableScenario.산출물을_수정한다(config);
  }

  async 산출물을_삭제한다(deliverableId: string): Promise<void> {
    return this.deliverableScenario.산출물을_삭제한다(deliverableId);
  }

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
    return this.deliverableScenario.산출물을_벌크_생성한다(config);
  }

  async 산출물을_벌크_삭제한다(deliverableIds: string[]): Promise<any> {
    return this.deliverableScenario.산출물을_벌크_삭제한다(deliverableIds);
  }

  async 직원별_산출물을_조회한다(config: {
    employeeId: string;
    activeOnly?: boolean;
  }): Promise<any> {
    return this.deliverableScenario.직원별_산출물을_조회한다(config);
  }

  async WBS항목별_산출물을_조회한다(config: {
    wbsItemId: string;
    activeOnly?: boolean;
  }): Promise<any> {
    return this.deliverableScenario.WBS항목별_산출물을_조회한다(config);
  }

  async 산출물_상세를_조회한다(deliverableId: string): Promise<any> {
    return this.deliverableScenario.산출물_상세를_조회한다(deliverableId);
  }
}

