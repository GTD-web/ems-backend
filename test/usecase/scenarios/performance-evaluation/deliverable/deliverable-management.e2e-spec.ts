import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DeliverableManagementScenario } from './deliverable-management.scenario';
import { DeliverableScenario } from '../../deliverable.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../../wbs-assignment/wbs-assignment.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';

/**
 * 산출물(Deliverable) 관리 시나리오 E2E 테스트
 *
 * README.md의 시나리오를 기반으로 작성되었습니다.
 */
describe('산출물 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let deliverableManagementScenario: DeliverableManagementScenario;
  let deliverableScenario: DeliverableScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    deliverableManagementScenario = new DeliverableManagementScenario(testSuite);
    deliverableScenario = new DeliverableScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 3,
      wbsPerProject: 5,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '산출물 관리 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '산출물 관리 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(HttpStatus.CREATED);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      if (evaluationPeriodId) {
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(HttpStatus.OK)
          .catch(() => {
            // 정리 API가 없으면 무시
          });

        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      }
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  describe('산출물 기본 관리', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemId: string;

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemId = wbsItemIds[0];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
      });
    });

    describe('산출물 생성 (신규 생성)', () => {
      it('산출물을 생성하고 대시보드 API를 검증한다', async () => {
        // Given & When - 산출물 생성 및 대시보드 검증
        const { 생성결과, 대시보드검증결과 } =
          await deliverableManagementScenario.산출물을_생성하고_대시보드를_검증한다({
            name: 'API 설계 문서',
            type: 'document',
            employeeId: testEmployeeId,
            wbsItemId: testWbsItemId,
            projectId: testProjectId,
            periodId: evaluationPeriodId,
            description: 'RESTful API 설계 문서 v1.0',
            filePath: '/uploads/documents/api-design-v1.pdf',
          });

        // Then - 생성 검증
        expect(생성결과.id).toBeDefined();
        expect(생성결과.name).toBe('API 설계 문서');
        expect(생성결과.type).toBe('document');
        expect(생성결과.employeeId).toBe(testEmployeeId);
        expect(생성결과.wbsItemId).toBe(testWbsItemId);
        expect(생성결과.isActive).toBe(true);
        expect(생성결과.mappedDate).toBeDefined();
        expect(생성결과.createdAt).toBeDefined();

        // 대시보드 검증 결과 확인
        expect(대시보드검증결과.생성된산출물).toBeDefined();
        expect(대시보드검증결과.생성된산출물.description).toBe(
          'RESTful API 설계 문서 v1.0',
        );
        expect(대시보드검증결과.생성된산출물.filePath).toBe(
          '/uploads/documents/api-design-v1.pdf',
        );
      });
    });

    describe('산출물 수정', () => {
      it('산출물을 수정하고 대시보드 API를 검증한다', async () => {
        // Given - 산출물 생성
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: 'API 설계 문서',
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          description: '초기 설명',
          filePath: '/uploads/documents/api-design-v1.pdf',
        });

        // When - 산출물 수정 및 대시보드 검증
        const { 수정결과, 대시보드검증결과, 상세조회결과 } =
          await deliverableManagementScenario.산출물을_수정하고_대시보드를_검증한다({
            id: 생성결과.id,
            employeeId: testEmployeeId,
            wbsItemId: testWbsItemId,
            projectId: testProjectId,
            periodId: evaluationPeriodId,
            name: 'API 설계 문서 v2',
            description: '수정된 설명',
            type: 'code',
            filePath: '/uploads/documents/api-design-v2.pdf',
            isActive: false,
          });

        // Then - 수정 검증
        expect(수정결과.id).toBe(생성결과.id);
        expect(수정결과.name).toBe('API 설계 문서 v2');
        expect(수정결과.description).toBe('수정된 설명');
        expect(수정결과.type).toBe('code');
        expect(수정결과.filePath).toBe('/uploads/documents/api-design-v2.pdf');
        expect(수정결과.isActive).toBe(false);
        expect(수정결과.updatedAt).toBeDefined();
        expect(수정결과.version).toBeGreaterThan(생성결과.version);

        // isActive=false인 산출물은 대시보드에서 제외되어야 함
        const 수정된산출물 = 대시보드검증결과.해당WBS.deliverables?.find(
          (d: any) => d.id === 생성결과.id,
        );
        expect(수정된산출물).toBeUndefined(); // 비활성화된 산출물은 조회되지 않음

        // 상세 조회 검증
        expect(상세조회결과.name).toBe('API 설계 문서 v2');
        expect(상세조회결과.description).toBe('수정된 설명');
        expect(상세조회결과.updatedAt).toBeDefined();
        expect(상세조회결과.version).toBeGreaterThan(생성결과.version);
      });
    });

    describe('산출물 삭제 (소프트 삭제)', () => {
      it('산출물을 삭제하고 대시보드 API를 검증한다', async () => {
        // Given - 산출물 생성
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: '삭제 테스트 산출물',
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
        });

        // When - 산출물 삭제 및 대시보드 검증
        await deliverableManagementScenario.산출물을_삭제하고_대시보드를_검증한다({
          id: 생성결과.id,
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

        // Then - 산출물 상세 조회 시 404 에러 확인
        await testSuite
          .request()
          .get(`/admin/performance-evaluation/deliverables/${생성결과.id}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('산출물 비활성화', () => {
      it('산출물을 비활성화하고 대시보드 API를 검증한다', async () => {
        // Given - 산출물 생성
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: '비활성화 테스트 산출물',
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
        });

        // When - 산출물 비활성화 및 대시보드 검증
        const {
          비활성화결과,
          대시보드검증결과,
          활성조회결과,
          전체조회결과,
          상세조회결과,
        } =
          await deliverableManagementScenario.산출물을_비활성화하고_대시보드를_검증한다(
            {
              id: 생성결과.id,
              employeeId: testEmployeeId,
              wbsItemId: testWbsItemId,
              projectId: testProjectId,
              periodId: evaluationPeriodId,
            },
          );

        // Then - 비활성화 검증
        expect(비활성화결과.isActive).toBe(false);

        // 비활성화된 산출물은 대시보드에서 제외되어야 함
        const 비활성화된산출물 =
          대시보드검증결과.해당WBS.deliverables?.find(
            (d: any) => d.id === 생성결과.id,
          );
        expect(비활성화된산출물).toBeUndefined();

        // activeOnly=true로 조회 시 비활성화된 산출물 제외 확인
        expect(
          활성조회결과.deliverables.some((d: any) => d.id === 생성결과.id),
        ).toBe(false);

        // activeOnly=false로 조회 시 비활성화된 산출물 포함 확인
        const 비활성산출물 = 전체조회결과.deliverables.find(
          (d: any) => d.id === 생성결과.id,
        );
        expect(비활성산출물).toBeDefined();
        expect(비활성산출물.isActive).toBe(false);

        // 산출물 상세 조회 시 비활성화된 산출물도 조회 가능 확인
        expect(상세조회결과.isActive).toBe(false);
      });
    });
  });

  describe('산출물 목록 및 상세 조회', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemId: string;
    let 생성된산출물Ids: string[];

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemId = wbsItemIds[0];
      생성된산출물Ids = [];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
      });

      // 여러 산출물 생성
      for (let i = 0; i < 3; i++) {
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: `산출물 ${i + 1}`,
          type: i % 2 === 0 ? 'document' : 'code',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          description: `산출물 ${i + 1} 설명`,
          filePath: `/uploads/file-${i + 1}.pdf`,
        });
        생성된산출물Ids.push(생성결과.id);
      }
    });

    describe('직원별 산출물 조회', () => {
      it('직원별 산출물 목록을 조회한다', async () => {
        // When - 직원별 산출물 조회
        const 조회결과 =
          await deliverableManagementScenario.직원별_산출물을_조회한다({
            employeeId: testEmployeeId,
            activeOnly: true,
          });

        // Then - 조회 검증
        expect(조회결과.deliverables).toBeDefined();
        expect(Array.isArray(조회결과.deliverables)).toBe(true);
        expect(조회결과.total).toBeDefined();
        expect(조회결과.total).toBeGreaterThanOrEqual(3);

        // 응답 구조 검증
        for (const deliverable of 조회결과.deliverables) {
          expect(deliverable.id).toBeDefined();
          expect(deliverable.name).toBeDefined();
          expect(deliverable.type).toBeDefined();
          expect(deliverable.employeeId).toBe(testEmployeeId);
          expect(deliverable.wbsItemId).toBeDefined();
          expect(deliverable.isActive).toBe(true);
          expect(deliverable.createdAt).toBeDefined();
        }

        // 생성한 산출물이 모두 포함되어 있는지 확인
        const 조회된IDs = 조회결과.deliverables.map((d: any) => d.id);
        for (const id of 생성된산출물Ids) {
          expect(조회된IDs).toContain(id);
        }
      });
    });

    describe('WBS 항목별 산출물 조회', () => {
      it('WBS 항목별 산출물 목록을 조회한다', async () => {
        // When - WBS 항목별 산출물 조회
        const 조회결과 =
          await deliverableManagementScenario.WBS항목별_산출물을_조회한다({
            wbsItemId: testWbsItemId,
            activeOnly: true,
          });

        // Then - 조회 검증
        expect(조회결과.deliverables).toBeDefined();
        expect(Array.isArray(조회결과.deliverables)).toBe(true);
        expect(조회결과.total).toBeDefined();
        expect(조회결과.total).toBeGreaterThanOrEqual(3);

        // 응답 구조 검증
        for (const deliverable of 조회결과.deliverables) {
          expect(deliverable.id).toBeDefined();
          expect(deliverable.name).toBeDefined();
          expect(deliverable.type).toBeDefined();
          expect(deliverable.wbsItemId).toBe(testWbsItemId);
          expect(deliverable.employeeId).toBeDefined();
          expect(deliverable.isActive).toBe(true);
          expect(deliverable.createdAt).toBeDefined();
        }

        // 생성일시 내림차순 정렬 확인
        let 이전생성일시: Date | null = null;
        for (const deliverable of 조회결과.deliverables) {
          const 생성일시 = new Date(deliverable.createdAt);
          if (이전생성일시) {
            expect(생성일시.getTime()).toBeLessThanOrEqual(
              이전생성일시.getTime(),
            );
          }
          이전생성일시 = 생성일시;
        }
      });
    });

    describe('산출물 상세 조회', () => {
      it('산출물 상세정보를 조회한다', async () => {
        // Given - 생성된 산출물 ID
        const 산출물Id = 생성된산출물Ids[0];

        // When - 산출물 상세 조회
        const 상세조회결과 =
          await deliverableManagementScenario.산출물_상세를_조회한다(산출물Id);

        // Then - 조회 검증
        expect(상세조회결과.id).toBe(산출물Id);
        expect(상세조회결과.name).toBeDefined();
        expect(상세조회결과.description).toBeDefined();
        expect(상세조회결과.type).toBeDefined();
        expect(상세조회결과.filePath).toBeDefined();
        expect(상세조회결과.employeeId).toBe(testEmployeeId);
        expect(상세조회결과.wbsItemId).toBe(testWbsItemId);
        expect(상세조회결과.mappedDate).toBeDefined();
        expect(상세조회결과.mappedBy).toBeDefined();
        expect(상세조회결과.isActive).toBeDefined();
        expect(상세조회결과.createdAt).toBeDefined();
        expect(상세조회결과.updatedAt).toBeDefined();
        expect(상세조회결과.deletedAt).toBeDefined(); // null일 수 있음
        expect(상세조회결과.createdBy).toBeDefined();
        expect(상세조회결과.updatedBy).toBeDefined();
        expect(상세조회결과.version).toBeDefined();
      });

      it('존재하지 않는 산출물 조회 시 404 에러가 발생한다', async () => {
        // Given - 존재하지 않는 ID
        const 존재하지않는ID = '00000000-0000-0000-0000-000000000000';

        // When & Then - 404 에러 확인
        await testSuite
          .request()
          .get(`/admin/performance-evaluation/deliverables/${존재하지않는ID}`)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('잘못된 UUID 형식으로 조회 시 400 에러가 발생한다', async () => {
        // Given - 잘못된 UUID 형식
        const 잘못된UUID = 'invalid-uuid-format';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .get(`/admin/performance-evaluation/deliverables/${잘못된UUID}`)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('산출물 벌크 작업', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemIds: string[];

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemIds = [wbsItemIds[0], wbsItemIds[1], wbsItemIds[2]];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당 (여러 개)
      for (const wbsItemId of testWbsItemIds) {
        await wbsAssignmentScenario.WBS를_할당한다({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
          wbsItemId,
          projectId: testProjectId,
        });
      }
    });

    describe('벌크 산출물 생성', () => {
      it('여러 산출물을 한 번에 생성하고 대시보드 API를 검증한다', async () => {
        // Given - 벌크 생성할 산출물 목록
        const deliverables = testWbsItemIds.map((wbsItemId, index) => ({
          name: `벌크 산출물 ${index + 1}`,
          type: index % 2 === 0 ? 'document' : 'code',
          employeeId: testEmployeeId,
          wbsItemId,
          description: `벌크 산출물 ${index + 1} 설명`,
          filePath: `/uploads/bulk-file-${index + 1}.pdf`,
        }));

        // When - 벌크 산출물 생성 및 대시보드 검증
        const { 벌크생성결과, 대시보드검증결과 } =
          await deliverableManagementScenario.벌크_산출물을_생성하고_대시보드를_검증한다(
            {
              deliverables,
              employeeId: testEmployeeId,
              projectId: testProjectId,
              periodId: evaluationPeriodId,
            },
          );

        // Then - 벌크 생성 검증
        expect(벌크생성결과.successCount).toBe(testWbsItemIds.length);
        expect(벌크생성결과.failedCount).toBe(0);
        expect(벌크생성결과.createdIds).toBeDefined();
        expect(벌크생성결과.createdIds.length).toBe(testWbsItemIds.length);
        expect(벌크생성결과.failedItems).toBeDefined();
        expect(Array.isArray(벌크생성결과.failedItems)).toBe(true);

        // 각 WBS에 생성된 산출물이 포함되어 있는지 확인
        expect(대시보드검증결과.WBS별검증결과.length).toBe(testWbsItemIds.length);
        for (let i = 0; i < testWbsItemIds.length; i++) {
          const WBS검증결과 = 대시보드검증결과.WBS별검증결과[i];
          expect(WBS검증결과.생성된산출물).toBeDefined();
          expect(WBS검증결과.생성된산출물.name).toBe(`벌크 산출물 ${i + 1}`);
          expect(WBS검증결과.WBS산출물조회.total).toBeGreaterThanOrEqual(1);
        }
      });
    });

    describe('벌크 산출물 삭제', () => {
      it('여러 산출물을 한 번에 삭제하고 대시보드 API를 검증한다', async () => {
        // Given - 여러 산출물 생성
        const deliverables = testWbsItemIds.map((wbsItemId, index) => ({
          name: `삭제 테스트 산출물 ${index + 1}`,
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId,
        }));

        const 벌크생성결과 =
          await deliverableManagementScenario.산출물을_벌크_생성한다({
            deliverables,
          });

        // When - 벌크 산출물 삭제 및 대시보드 검증
        const { 벌크삭제결과, 대시보드검증결과 } =
          await deliverableManagementScenario.벌크_산출물을_삭제하고_대시보드를_검증한다(
            {
              deliverableIds: 벌크생성결과.createdIds,
              employeeId: testEmployeeId,
              wbsItemIds: testWbsItemIds,
              projectId: testProjectId,
              periodId: evaluationPeriodId,
            },
          );

        // Then - 벌크 삭제 검증
        expect(벌크삭제결과.successCount).toBe(testWbsItemIds.length);
        expect(벌크삭제결과.failedCount).toBe(0);
        expect(벌크삭제결과.failedIds).toBeDefined();
        expect(Array.isArray(벌크삭제결과.failedIds)).toBe(true);

        // 삭제된 산출물이 모든 WBS의 deliverables 배열에서 제외되는지 확인
        expect(대시보드검증결과.WBS별검증결과.length).toBe(testWbsItemIds.length);
        for (const WBS검증결과 of 대시보드검증결과.WBS별검증결과) {
          // 삭제된 산출물이 포함되지 않는지 확인
          for (const 삭제된ID of 벌크생성결과.createdIds) {
            const 삭제된산출물 = WBS검증결과.해당WBS.deliverables?.find(
              (d: any) => d.id === 삭제된ID,
            );
            expect(삭제된산출물).toBeUndefined();

            expect(
              WBS검증결과.WBS산출물조회.deliverables.some(
                (d: any) => d.id === 삭제된ID,
              ),
            ).toBe(false);
          }
        }
      });
    });
  });

  describe('산출물 대시보드 일관성 검증', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemId: string;

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemId = wbsItemIds[0];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
      });
    });

    it('산출물 생성 후 여러 엔드포인트의 일관성을 검증한다', async () => {
      // Given - 산출물 생성
      const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
        name: '일관성 검증 산출물',
        type: 'document',
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        description: '일관성 검증 설명',
        filePath: '/uploads/consistency-test.pdf',
      });

      // When - 여러 엔드포인트 일관성 검증
      const { 대시보드산출물, WBS산출물, 직원산출물, 상세조회결과 } =
        await deliverableManagementScenario.산출물_일관성을_검증한다({
          deliverableId: 생성결과.id,
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

      // Then - 일관성 검증
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
    });

    it('산출물 수정 후 여러 엔드포인트의 일관성을 검증한다', async () => {
      // Given - 산출물 생성 및 수정
      const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
        name: '수정 전 산출물',
        type: 'document',
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
      });

      await deliverableManagementScenario.산출물을_수정한다({
        id: 생성결과.id,
        name: '수정 후 산출물',
        type: 'code',
        description: '수정된 설명',
      });

      // When - 여러 엔드포인트 일관성 검증
      const { 상세조회결과, WBS산출물 } =
        await deliverableManagementScenario.산출물_일관성을_검증한다({
          deliverableId: 생성결과.id,
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

      // Then - 일관성 검증
      expect(상세조회결과.name).toBe('수정 후 산출물');
      expect(상세조회결과.type).toBe('code');
      expect(상세조회결과.description).toBe('수정된 설명');
      expect(상세조회결과.updatedAt).toBeDefined();

      if (WBS산출물) {
        expect(WBS산출물.name).toBe('수정 후 산출물');
        expect(WBS산출물.type).toBe('code');
      }
    });
  });

  describe('산출물 상태 변경 및 필터링 검증', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemId: string;
    let 생성된산출물Id: string;

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemId = wbsItemIds[0];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
      });
    });

    it('전체 상태 전환 흐름을 검증한다: 생성 → 활성 → 비활성 → 활성 → 삭제', async () => {
      // Given & When - 상태 전환 검증
      const { 생성결과, 비활성화결과, 재활성화결과, 삭제전상태 } =
        await deliverableManagementScenario.산출물_상태_전환을_검증한다({
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
          name: '상태 전환 테스트 산출물',
          type: 'document',
        });

      생성된산출물Id = 생성결과.id;

      // Then - 상태 전환 검증
      expect(생성결과.isActive).toBe(true);
      expect(비활성화결과.isActive).toBe(false);
      expect(재활성화결과.isActive).toBe(true);
      expect(삭제전상태.isActive).toBe(true);

      // 삭제 후 상세 조회 시 404 에러 확인
      await testSuite
        .request()
        .get(`/admin/performance-evaluation/deliverables/${생성된산출물Id}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('여러 직원의 산출물 독립성 검증', () => {
    let employee1Id: string;
    let employee2Id: string;
    let testProjectId: string;
    let wbsItemId1: string;
    let wbsItemId2: string;

    beforeEach(async () => {
      employee1Id = employeeIds[0];
      employee2Id = employeeIds[1];
      testProjectId = projectIds[0];
      wbsItemId1 = wbsItemIds[0];
      wbsItemId2 = wbsItemIds[1];

      // 각 직원에 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employee1Id,
        projectId: testProjectId,
      });

      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employee2Id,
        projectId: testProjectId,
      });

      // 각 직원에 WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employee1Id,
        wbsItemId: wbsItemId1,
        projectId: testProjectId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employee2Id,
        wbsItemId: wbsItemId2,
        projectId: testProjectId,
      });
    });

    it('직원별로 독립적인 산출물 관리가 가능하다', async () => {
      // Given & When - 직원별 독립성 검증
      const { 직원1산출물, 직원2산출물, 직원1할당데이터, 직원2할당데이터 } =
        await deliverableManagementScenario.직원별_독립성을_검증한다({
          employee1Id,
          employee2Id,
          wbsItemId1,
          wbsItemId2,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

      // Then - 직원별 독립성 검증
      // 직원 1의 산출물은 직원 1의 할당 데이터에만 포함
      const 직원1프로젝트 = 직원1할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );
      const 직원1WBS = 직원1프로젝트.wbsList.find(
        (w: any) => w.wbsId === wbsItemId1,
      );
      const 직원1산출물확인 = 직원1WBS.deliverables.find(
        (d: any) => d.id === 직원1산출물.id,
      );
      expect(직원1산출물확인).toBeDefined();

      // 직원 2의 산출물은 직원 2의 할당 데이터에만 포함
      const 직원2프로젝트 = 직원2할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );
      const 직원2WBS = 직원2프로젝트.wbsList.find(
        (w: any) => w.wbsId === wbsItemId2,
      );
      const 직원2산출물확인 = 직원2WBS.deliverables.find(
        (d: any) => d.id === 직원2산출물.id,
      );
      expect(직원2산출물확인).toBeDefined();

      // 직원 1의 할당 데이터에는 직원 2의 산출물이 포함되지 않음
      const 직원1WBS업데이트 = 직원1프로젝트.wbsList.find(
        (w: any) => w.wbsId === wbsItemId1,
      );
      const 직원2산출물이직원1에있음 = 직원1WBS업데이트.deliverables?.find(
        (d: any) => d.id === 직원2산출물.id,
      );
      expect(직원2산출물이직원1에있음).toBeUndefined();

      // 직원 2의 할당 데이터에는 직원 1의 산출물이 포함되지 않음
      const 직원1산출물이직원2에있음 = 직원2WBS.deliverables?.find(
        (d: any) => d.id === 직원1산출물.id,
      );
      expect(직원1산출물이직원2에있음).toBeUndefined();
    });
  });

  describe('여러 WBS의 산출물 독립성 검증', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let wbsItemId1: string;
    let wbsItemId2: string;

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      wbsItemId1 = wbsItemIds[0];
      wbsItemId2 = wbsItemIds[1];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // 여러 WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: wbsItemId1,
        projectId: testProjectId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: wbsItemId2,
        projectId: testProjectId,
      });
    });

    it('WBS별로 독립적인 산출물 관리가 가능하다', async () => {
      // Given & When - WBS별 독립성 검증
      const { WBS1산출물, WBS2산출물, 할당데이터 } =
        await deliverableManagementScenario.WBS별_독립성을_검증한다({
          employeeId: testEmployeeId,
          wbsItemId1,
          wbsItemId2,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

      // Then - WBS별 독립성 검증
      const 프로젝트 = 할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );

      const WBS1 = 프로젝트.wbsList.find((w: any) => w.wbsId === wbsItemId1);
      expect(
        WBS1.deliverables.some((d: any) => d.id === WBS1산출물.id),
      ).toBe(true);
      expect(
        WBS1.deliverables.some((d: any) => d.id === WBS2산출물.id),
      ).toBe(false);

      const WBS2 = 프로젝트.wbsList.find((w: any) => w.wbsId === wbsItemId2);
      expect(
        WBS2.deliverables.some((d: any) => d.id === WBS2산출물.id),
      ).toBe(true);
      expect(
        WBS2.deliverables.some((d: any) => d.id === WBS1산출물.id),
      ).toBe(false);
    });
  });

  describe('산출물 정렬 및 필터링 검증', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemId: string;
    let 생성된산출물Ids: string[];

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemId = wbsItemIds[0];
      생성된산출물Ids = [];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
      });
    });

    it('여러 산출물 생성 및 정렬 검증을 수행한다', async () => {
      // Given & When - 산출물 정렬 검증
      const { 생성된산출물들, 정렬검증결과 } =
        await deliverableManagementScenario.산출물_정렬을_검증한다({
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

      생성된산출물Ids = 생성된산출물들.map((d: any) => d.id);

      // Then - 정렬 검증
      expect(정렬검증결과.WBS산출물조회.deliverables.length).toBeGreaterThanOrEqual(
        3,
      );

      // 가장 최근에 생성된 산출물이 배열의 첫 번째에 있는지 확인
      const 첫번째산출물 = 정렬검증결과.WBS산출물조회.deliverables[0];
      expect(첫번째산출물.id).toBe(생성된산출물들[2].id); // 가장 최근 생성

      // 대시보드에서도 정렬 확인
      const 첫번째산출물대시보드 = 정렬검증결과.해당WBS.deliverables[0];
      expect(첫번째산출물대시보드.id).toBe(생성된산출물들[2].id);
    });

    it('활성/비활성 산출물 필터링 검증을 수행한다', async () => {
      // Given & When - 산출물 필터링 검증
      const {
        활성산출물1,
        활성산출물2,
        활성조회결과,
        전체조회결과,
        대시보드검증결과,
      } = await deliverableManagementScenario.산출물_필터링을_검증한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // Then - 필터링 검증
      expect(
        활성조회결과.deliverables.some((d: any) => d.id === 활성산출물1.id),
      ).toBe(true);
      expect(
        활성조회결과.deliverables.some((d: any) => d.id === 활성산출물2.id),
      ).toBe(false);
      expect(활성조회결과.total).toBeGreaterThanOrEqual(1);

      expect(
        전체조회결과.deliverables.some((d: any) => d.id === 활성산출물1.id),
      ).toBe(true);
      expect(
        전체조회결과.deliverables.some((d: any) => d.id === 활성산출물2.id),
      ).toBe(true);
      expect(전체조회결과.total).toBeGreaterThanOrEqual(2);

      // 대시보드는 활성 산출물만 포함
      expect(
        대시보드검증결과.해당WBS.deliverables.some(
          (d: any) => d.id === 활성산출물1.id,
        ),
      ).toBe(true);
      expect(
        대시보드검증결과.해당WBS.deliverables.some(
          (d: any) => d.id === 활성산출물2.id,
        ),
      ).toBe(false);
    });
  });

  describe('산출물 에러 케이스', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemId: string;

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemId = wbsItemIds[0];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
      });
    });

    describe('산출물 생성 에러', () => {
      it('필수 필드 누락 시 400 에러가 발생한다', async () => {
        // Given & When & Then - 필수 필드 누락 에러 시나리오 실행
        await deliverableScenario.산출물_생성_필수_필드_누락_에러_시나리오를_실행한다({
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
        });
      });

      it('잘못된 타입 값으로 생성 시 400 에러가 발생한다', async () => {
        // Given - 잘못된 타입 값
        const 잘못된타입 = 'invalid-type';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .post('/admin/performance-evaluation/deliverables')
          .send({
            name: '테스트 산출물',
            type: 잘못된타입,
            employeeId: testEmployeeId,
            wbsItemId: testWbsItemId,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('빈 이름으로 생성 시 400 에러가 발생한다', async () => {
        // Given - 빈 이름
        const 빈이름 = '';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .post('/admin/performance-evaluation/deliverables')
          .send({
            name: 빈이름,
            type: 'document',
            employeeId: testEmployeeId,
            wbsItemId: testWbsItemId,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('존재하지 않는 직원 ID로 생성 시 400 에러가 발생한다', async () => {
        // Given - 존재하지 않는 직원 ID
        const 존재하지않는직원ID = '00000000-0000-0000-0000-000000000000';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .post('/admin/performance-evaluation/deliverables')
          .send({
            name: '테스트 산출물',
            type: 'document',
            employeeId: 존재하지않는직원ID,
            wbsItemId: testWbsItemId,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('존재하지 않는 WBS 항목 ID로 생성 시 400 에러가 발생한다', async () => {
        // Given - 존재하지 않는 WBS 항목 ID
        const 존재하지않는WBSID = '00000000-0000-0000-0000-000000000000';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .post('/admin/performance-evaluation/deliverables')
          .send({
            name: '테스트 산출물',
            type: 'document',
            employeeId: testEmployeeId,
            wbsItemId: 존재하지않는WBSID,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('산출물 수정 에러', () => {
      let 생성된산출물Id: string;

      beforeEach(async () => {
        // 산출물 생성
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: '수정 테스트 산출물',
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
        });
        생성된산출물Id = 생성결과.id;
      });

      it('존재하지 않는 산출물 수정 시 404 에러가 발생한다', async () => {
        // Given - 존재하지 않는 산출물 ID
        const 존재하지않는ID = '00000000-0000-0000-0000-000000000000';

        // When & Then - 404 에러 확인
        await testSuite
          .request()
          .patch(`/admin/performance-evaluation/deliverables/${존재하지않는ID}`)
          .send({
            name: '수정된 이름',
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('잘못된 UUID 형식으로 수정 시 400 에러가 발생한다', async () => {
        // Given - 잘못된 UUID 형식
        const 잘못된UUID = 'invalid-uuid-format';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/deliverables/${잘못된UUID}`,
          )
          .send({
            name: '수정된 이름',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('잘못된 타입 값으로 수정 시 400 에러가 발생한다', async () => {
        // Given - 잘못된 타입 값
        const 잘못된타입 = 'invalid-type';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/deliverables/${생성된산출물Id}`,
          )
          .send({
            type: 잘못된타입,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('산출물 삭제 에러', () => {
      it('존재하지 않는 산출물 삭제 시 404 에러가 발생한다', async () => {
        // Given - 존재하지 않는 산출물 ID
        const 존재하지않는ID = '00000000-0000-0000-0000-000000000000';

        // When & Then - 404 에러 확인
        await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/deliverables/${존재하지않는ID}`,
          )
          .expect(HttpStatus.NOT_FOUND);
      });

      it('잘못된 UUID 형식으로 삭제 시 400 에러가 발생한다', async () => {
        // Given - 잘못된 UUID 형식
        const 잘못된UUID = 'invalid-uuid-format';

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/deliverables/${잘못된UUID}`,
          )
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('산출물 조회 에러', () => {
      it('존재하지 않는 산출물 조회 시 404 에러가 발생한다', async () => {
        // Given & When & Then - 존재하지 않는 산출물 조회 에러 시나리오 실행
        await deliverableScenario.존재하지않는_산출물_조회_에러_시나리오를_실행한다();
      });

      it('잘못된 UUID 형식으로 조회 시 400 에러가 발생한다', async () => {
        // Given & When & Then - 잘못된 UUID 형식 에러 시나리오 실행
        await deliverableScenario.잘못된_UUID_형식_에러_시나리오를_실행한다();
      });
    });

    describe('벌크 산출물 작업 에러', () => {
      it('빈 배열로 벌크 생성 시 400 에러가 발생한다', async () => {
        // Given - 빈 배열
        const 빈배열 = [];

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .post('/admin/performance-evaluation/deliverables/bulk')
          .send({
            deliverables: 빈배열,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('유효하지 않은 데이터가 포함된 벌크 생성 시 부분 실패한다', async () => {
        // Given - 유효한 데이터와 유효하지 않은 데이터 혼합
        const deliverables = [
          {
            name: '유효한 산출물',
            type: 'document',
            employeeId: testEmployeeId,
            wbsItemId: testWbsItemId,
          },
          {
            name: '유효하지 않은 산출물',
            type: '', // 빈 문자열로 유효하지 않은 값
            employeeId: testEmployeeId,
            wbsItemId: testWbsItemId,
          },
        ];

        // When - 벌크 생성
        const 벌크생성결과 =
          await deliverableManagementScenario.산출물을_벌크_생성한다({
            deliverables,
          });

        // Then - 부분 실패 검증
        expect(벌크생성결과.successCount).toBe(1);
        expect(벌크생성결과.failedCount).toBe(1);
        expect(벌크생성결과.createdIds.length).toBe(1);
        expect(벌크생성결과.failedItems.length).toBe(1);
      });

      it('빈 배열로 벌크 삭제 시 400 에러가 발생한다', async () => {
        // Given - 빈 배열
        const 빈배열: string[] = [];

        // When & Then - 400 에러 확인
        await testSuite
          .request()
          .delete('/admin/performance-evaluation/deliverables/bulk')
          .send({
            deliverableIds: 빈배열,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('존재하지 않는 ID가 포함된 벌크 삭제 시 부분 실패한다', async () => {
        // Given - 유효한 산출물 생성
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: '벌크 삭제 테스트 산출물',
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
        });

        // 존재하지 않는 ID와 유효한 ID 혼합
        const 존재하지않는ID = '00000000-0000-0000-0000-000000000000';
        const deliverableIds = [생성결과.id, 존재하지않는ID];

        // When - 벌크 삭제
        const 벌크삭제결과 =
          await deliverableManagementScenario.산출물을_벌크_삭제한다(
            deliverableIds,
          );

        // Then - 부분 실패 검증
        expect(벌크삭제결과.successCount).toBe(1);
        expect(벌크삭제결과.failedCount).toBe(1);
        expect(벌크삭제결과.failedIds.length).toBe(1);
        expect(벌크삭제결과.failedIds[0].id).toBe(존재하지않는ID);
      });
    });
  });

  describe('모든 산출물 삭제', () => {
    let testEmployeeId: string;
    let testProjectId: string;
    let testWbsItemIds: string[];

    beforeEach(async () => {
      testEmployeeId = employeeIds[0];
      testProjectId = projectIds[0];
      testWbsItemIds = [wbsItemIds[0], wbsItemIds[1], wbsItemIds[2]];

      // 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
      });

      // WBS 할당 (여러 개)
      for (const wbsItemId of testWbsItemIds) {
        await wbsAssignmentScenario.WBS를_할당한다({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
          wbsItemId,
          projectId: testProjectId,
        });
      }
    });

    it('여러 산출물이 있을 때 모두 삭제할 수 있어야 한다', async () => {
      // Given - 여러 산출물 생성
      const 생성된산출물Ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        const 생성결과 = await deliverableManagementScenario.산출물을_생성한다({
          name: `모든 산출물 삭제 테스트 ${i + 1}`,
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemIds[i % testWbsItemIds.length],
        });
        생성된산출물Ids.push(생성결과.id);
      }

      // When - 모든 산출물 삭제
      const 삭제결과 = await testSuite
        .request()
        .delete('/admin/performance-evaluation/deliverables/all')
        .expect(HttpStatus.OK);

      // Then - 삭제 결과 검증
      expect(삭제결과.body.successCount).toBe(5);
      expect(삭제결과.body.failedCount).toBe(0);
      expect(삭제결과.body.failedIds).toBeDefined();
      expect(Array.isArray(삭제결과.body.failedIds)).toBe(true);

      // 삭제된 산출물은 상세 조회 시 404 에러 발생
      for (const id of 생성된산출물Ids) {
        await testSuite
          .request()
          .get(`/admin/performance-evaluation/deliverables/${id}`)
          .expect(HttpStatus.NOT_FOUND);
      }
    });

    it('삭제 후 새로운 산출물 생성 및 조회가 가능해야 한다', async () => {
      // Given - 여러 산출물 생성
      for (let i = 0; i < 3; i++) {
        await deliverableManagementScenario.산출물을_생성한다({
          name: `삭제 전 산출물 ${i + 1}`,
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemIds[i % testWbsItemIds.length],
        });
      }

      // When - 모든 산출물 삭제
      await testSuite
        .request()
        .delete('/admin/performance-evaluation/deliverables/all')
        .expect(HttpStatus.OK);

      // Then - 새로운 산출물 생성 가능
      const 새산출물 = await deliverableManagementScenario.산출물을_생성한다({
        name: '삭제 후 새 산출물',
        type: 'code',
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemIds[0],
      });

      expect(새산출물.id).toBeDefined();
      expect(새산출물.name).toBe('삭제 후 새 산출물');

      // 상세 조회 가능
      const 상세조회 =
        await deliverableManagementScenario.산출물_상세를_조회한다(새산출물.id);

      expect(상세조회.id).toBe(새산출물.id);
    });

    it('산출물이 없을 때도 정상 처리되어야 한다', async () => {
      // Given - 산출물이 없는 상태

      // When & Then - 모든 산출물 삭제 (에러 없이 처리)
      const 삭제결과 = await testSuite
        .request()
        .delete('/admin/performance-evaluation/deliverables/all')
        .expect(HttpStatus.OK);

      expect(삭제결과.body.successCount).toBe(0);
      expect(삭제결과.body.failedCount).toBe(0);
      expect(삭제결과.body.failedIds).toEqual([]);
    });

    it('성공/실패 개수가 정확하게 반환되어야 한다', async () => {
      // Given - 여러 산출물 생성
      const 생성개수 = 10;
      for (let i = 0; i < 생성개수; i++) {
        await deliverableManagementScenario.산출물을_생성한다({
          name: `삭제 대상 산출물 ${i + 1}`,
          type: i % 2 === 0 ? 'document' : 'code',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemIds[i % testWbsItemIds.length],
        });
      }

      // When - 모든 산출물 삭제
      const 삭제결과 = await testSuite
        .request()
        .delete('/admin/performance-evaluation/deliverables/all')
        .expect(HttpStatus.OK);

      // Then - 성공/실패 개수 검증
      expect(삭제결과.body.successCount).toBe(생성개수);
      expect(삭제결과.body.failedCount).toBe(0);
    });

    it('삭제된 산출물은 조회 시 제외되어야 한다', async () => {
      // Given - 여러 산출물 생성
      for (let i = 0; i < 3; i++) {
        await deliverableManagementScenario.산출물을_생성한다({
          name: `조회 테스트 산출물 ${i + 1}`,
          type: 'document',
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemIds[i % testWbsItemIds.length],
        });
      }

      // 삭제 전 조회
      const 삭제전조회 =
        await deliverableManagementScenario.직원별_산출물을_조회한다({
          employeeId: testEmployeeId,
          activeOnly: true,
        });
      expect(삭제전조회.total).toBeGreaterThanOrEqual(3);

      // When - 모든 산출물 삭제
      await testSuite
        .request()
        .delete('/admin/performance-evaluation/deliverables/all')
        .expect(HttpStatus.OK);

      // Then - 삭제 후 조회 시 제외됨
      const 삭제후조회 =
        await deliverableManagementScenario.직원별_산출물을_조회한다({
          employeeId: testEmployeeId,
          activeOnly: true,
        });
      expect(삭제후조회.total).toBe(0);
      expect(삭제후조회.deliverables).toEqual([]);
    });
  });
});

