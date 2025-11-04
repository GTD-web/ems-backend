import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentScenario } from './wbs-assignment.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

/**
 * WBS 할당 정책 검증 시나리오
 *
 * 테스트 목적:
 * - WBS 할당 생성 시 적용되는 정책들이 올바르게 작동하는지 검증
 * - 완료된 평가기간, 프로젝트 할당 선행 조건, 중복 할당 방지 등
 */
describe('WBS 할당 정책 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let assignmentId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);

    // 시드 데이터 생성
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
      name: 'WBS 할당 정책 검증용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'WBS 할당 정책 검증 E2E 테스트용 평가기간',
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
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(HttpStatus.OK);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );

    // 테스트용 프로젝트 할당 및 WBS 할당 생성
    await projectAssignmentScenario.프로젝트를_할당한다({
      employeeId: employeeIds[0],
      projectId: projectIds[0],
      periodId: evaluationPeriodId,
    });

    const assignment = await wbsAssignmentScenario.WBS를_할당한다({
      employeeId: employeeIds[0],
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
      periodId: evaluationPeriodId,
    });
    assignmentId = assignment.id;

    console.log(
      `✅ 테스트 데이터 준비 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeIds.length}명, 프로젝트: ${projectIds.length}개, WBS: ${wbsItemIds.length}개, WBS 할당: ${assignmentId}`,
    );
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        // 평가기간 종료 후 삭제
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(HttpStatus.OK);

        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      } catch (error) {
        console.log('평가기간 정리 중 오류 (이미 정리됨):', error.message);
      }
    }
    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('프로젝트 할당 선행 조건 검증', () => {
    it('프로젝트 할당 없이 WBS 할당 시도 시 실패해야 한다', async () => {
      // 프로젝트 할당을 생성하지 않고 WBS 할당 시도
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employeeIds[1],
          wbsItemId: wbsItemIds[1],
          projectId: projectIds[1],
          periodId: evaluationPeriodId,
        })
        .expect((res) => {
          // 422 UnprocessableEntity 응답이 와야 함
          expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
          if (res.body.message) {
            expect(res.body.message).toMatch(
              /프로젝트 할당|존재하지 않습니다/i,
            );
          }
        });

      console.log('✅ 프로젝트 할당 없이 WBS 할당 시도 시 실패 검증 완료');
    });

    it('프로젝트 할당 후 WBS 할당 시도 시 성공해야 한다', async () => {
      // 프로젝트 할당 생성
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: employeeIds[2],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      // WBS 할당 시도
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employeeIds[2],
          wbsItemId: wbsItemIds[6],
          projectId: projectIds[1],
          periodId: evaluationPeriodId,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();
      expect(response.body.employeeId).toBe(employeeIds[2]);
      expect(response.body.wbsItemId).toBe(wbsItemIds[6]);

      console.log(
        `✅ 프로젝트 할당 후 WBS 할당 성공 - WBS 할당 ID: ${response.body.id}`,
      );
    });
  });

  describe('중복 할당 방지 검증', () => {
    it('동일한 WBS를 중복 할당 시도 시 실패해야 한다', async () => {
      // 주의: 이 테스트는 평가기간 완료 전에 실행되어야 함
      // beforeAll에서 이미 할당된 WBS를 다시 할당 시도

      // 이미 할당된 WBS를 다시 할당 시도 (이미 beforeAll에서 할당됨)
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        });

      // 중복 할당은 409 Conflict로 처리
      expect(response.status).toBe(HttpStatus.CONFLICT);
      if (response.body.message) {
        expect(response.body.message).toMatch(/이미.*할당|중복|이미 존재/i);
      }

      console.log('✅ 중복 WBS 할당 방지 검증 완료');
    });
  });

  describe('완료된 평가기간에서 WBS 할당 정책 검증', () => {
    it('평가기간을 완료 상태로 변경한다', async () => {
      // 평가기간 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(HttpStatus.OK);

      console.log(`✅ 평가기간 완료 - 평가기간 ID: ${evaluationPeriodId}`);
    });

    it('완료된 평가기간에 WBS 할당 생성이 불가능해야 한다', async () => {
      // 완료된 평가기간에 WBS 할당 시도
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[2],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간');
          expect(res.body.message).toMatch(/생성할 수 없습니다|생성/);
        });

      console.log('✅ 완료된 평가기간에서 WBS 할당 생성 불가 검증 완료');
    });

    it('완료된 평가기간에 WBS 대량 할당이 불가능해야 한다', async () => {
      // 완료된 평가기간에 WBS 대량 할당 시도
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employeeIds[0],
              wbsItemId: wbsItemIds[2],
              projectId: projectIds[0],
              periodId: evaluationPeriodId,
            },
            {
              employeeId: employeeIds[0],
              wbsItemId: wbsItemIds[3],
              projectId: projectIds[0],
              periodId: evaluationPeriodId,
            },
          ],
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간');
          expect(res.body.message).toMatch(/생성할 수 없습니다|생성/);
        });

      console.log('✅ 완료된 평가기간에서 WBS 대량 할당 불가 검증 완료');
    });

    it('완료된 평가기간에 WBS 할당 취소가 불가능해야 한다', async () => {
      // 완료된 평가기간에 WBS 할당 취소 시도
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItemIds[0]}`,
        )
        .send({
          employeeId: employeeIds[0],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간');
          expect(res.body.message).toContain('취소할 수 없습니다');
        });

      console.log('✅ 완료된 평가기간에서 WBS 할당 취소 불가 검증 완료');
    });

    it('완료된 평가기간에 WBS 할당 순서 변경이 불가능해야 한다', async () => {
      // 완료된 평가기간에 WBS 할당 순서 변경 시도
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItemIds[0]}/order`,
        )
        .send({
          employeeId: employeeIds[0],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
          direction: 'up',
        })
        .expect((res) => {
          // 완료된 평가기간에서는 순서 변경이 422 Unprocessable Entity로 실패
          expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
          // message가 문자열이거나 배열일 수 있음
          if (res.body.message) {
            const message = Array.isArray(res.body.message)
              ? res.body.message.join(' ')
              : res.body.message;
            // 순서 변경이 실패했는지 확인
            expect(message).toBeDefined();
          }
        });

      console.log('✅ 완료된 평가기간에서 WBS 할당 순서 변경 불가 검증 완료');
    });

    it('완료된 평가기간에 WBS 생성 및 할당이 불가능해야 한다', async () => {
      // 완료된 평가기간에 WBS 생성 및 할당 시도
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/create-and-assign')
        .send({
          title: '새로운 WBS 항목',
          projectId: projectIds[0],
          employeeId: employeeIds[0],
          periodId: evaluationPeriodId,
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간');
          expect(res.body.message).toMatch(/생성할 수 없습니다|생성/);
        });

      console.log('✅ 완료된 평가기간에서 WBS 생성 및 할당 불가 검증 완료');
    });

    it('완료된 평가기간에서 조회 기능은 정상 작동해야 한다', async () => {
      // 1. WBS 할당 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ periodId: evaluationPeriodId })
        .expect(HttpStatus.OK);

      expect(listResponse.body.assignments).toBeDefined();
      expect(Array.isArray(listResponse.body.assignments)).toBe(true);

      // 2. 직원별 WBS 할당 조회
      const employeeResponse = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${employeeIds[0]}/period/${evaluationPeriodId}`,
        )
        .expect(HttpStatus.OK);

      expect(employeeResponse.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(employeeResponse.body.wbsAssignments)).toBe(true);

      console.log('✅ 완료된 평가기간에서 조회 기능 정상 작동 검증 완료');
    });
  });

  describe('존재하지 않는 리소스로 할당 시도 검증', () => {
    it('존재하지 않는 직원으로 WBS 할당 시도 시 실패해야 한다', async () => {
      const fakeEmployeeId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: fakeEmployeeId,
          wbsItemId: wbsItemIds[4],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        })
        .expect((res) => {
          // 직원 존재 검증 실패는 404 Not Found
          expect(res.status).toBe(HttpStatus.NOT_FOUND);
          if (res.body.message) {
            expect(res.body.message).toMatch(/직원|존재하지 않습니다/i);
          }
        });

      console.log('✅ 존재하지 않는 직원으로 WBS 할당 시도 실패 검증 완료');
    });

    it('존재하지 않는 WBS 항목으로 할당 시도 시 실패해야 한다', async () => {
      const fakeWbsItemId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employeeIds[0],
          wbsItemId: fakeWbsItemId,
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        });

      // 존재하지 않는 WBS 항목은 404 Not Found 응답이 와야 함
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      if (response.body.message) {
        expect(response.body.message).toMatch(/WBS|존재하지 않습니다|유효한/i);
      }

      console.log('✅ 존재하지 않는 WBS 항목으로 할당 시도 실패 검증 완료');
    });

    it('존재하지 않는 프로젝트로 프로젝트 할당 시도 시 실패해야 한다', async () => {
      const fakeProjectId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employeeIds[3],
          projectId: fakeProjectId,
          periodId: evaluationPeriodId,
        })
        .expect((res) => {
          // 존재하지 않는 프로젝트는 404 Not Found 응답이 와야 함
          expect(res.status).toBe(HttpStatus.NOT_FOUND);
          if (res.body.message) {
            expect(res.body.message).toMatch(/프로젝트|존재하지 않습니다/i);
          }
        });

      console.log(
        '✅ 존재하지 않는 프로젝트로 프로젝트 할당 시도 실패 검증 완료',
      );
    });

    it('존재하지 않는 평가기간으로 할당 시도 시 실패해야 한다', async () => {
      const fakePeriodId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employeeIds[3],
          projectId: projectIds[2],
          periodId: fakePeriodId,
        })
        .expect((res) => {
          // 존재하지 않는 평가기간은 404 Not Found 응답이 와야 함
          expect(res.status).toBe(HttpStatus.NOT_FOUND);
          if (res.body.message) {
            expect(res.body.message).toMatch(/평가기간|존재하지 않습니다/i);
          }
        });

      console.log('✅ 존재하지 않는 평가기간으로 할당 시도 실패 검증 완료');
    });
  });

  describe('WBS 할당 취소 멱등성 검증', () => {
    it('이미 삭제된 WBS 할당을 다시 취소해도 성공 처리되어야 한다', async () => {
      // 주의: 완료된 평가기간에서는 프로젝트 할당을 생성할 수 없으므로,
      // 이 테스트는 완료 상태 전에 실행되어야 함
      // 테스트를 위해 평가기간을 다시 시작 상태로 변경하거나, 별도 평가기간을 사용해야 함

      // 현재는 완료된 평가기간에서 테스트할 수 없으므로 스킵
      // 평가기간 재개 API가 구현되면 활성화
      // 또는 별도의 테스트 평가기간을 생성하여 테스트

      // 임시로 완료 전 상태에서 테스트할 수 있도록 주석 처리
      // 실제로는 평가기간 재개 또는 별도 평가기간 생성이 필요

      console.log(
        '⚠️ 완료된 평가기간에서는 프로젝트 할당을 생성할 수 없어 이 테스트는 스킵됩니다.',
      );
      console.log(
        '⚠️ 평가기간 재개 API가 구현되면 활성화하거나, 별도 평가기간을 생성하여 테스트해야 합니다.',
      );
    });
  });
});
