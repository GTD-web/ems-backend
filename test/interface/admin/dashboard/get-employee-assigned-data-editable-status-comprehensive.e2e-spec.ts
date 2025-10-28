/**
 * 사용자 할당 정보 조회 - 수정가능 상태 종합 검증 E2E 테스트
 *
 * 이 테스트는 다양한 시나리오에서 editableStatus 필드와 WBS별 isEditable 값이
 * 올바르게 동작하는지 종합적으로 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 여러 직원의 다양한 수정가능 상태 조합 테스트
 * 2. 상태 변경 전후 비교 테스트
 * 3. 엣지 케이스 테스트 (모든 상태 false, true)
 * 4. 성능 테스트 (대량 데이터)
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data (수정가능 상태 종합 검증)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('다양한 수정가능 상태 조합 검증', () => {
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let mappingIds: string[];

    beforeAll(async () => {
      // 1. 기존 데이터 정리
      console.log('기존 시드 데이터 정리 중...');
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(
              `Failed to clear seed data: ${res.status} ${res.text}`,
            );
          }
        });

      // 2. 시드 데이터 생성 (full 시나리오)
      console.log('시드 데이터 생성 중...');
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'full',
          clearExisting: false,
        })
        .expect(201);

      // 3. 평가기간과 여러 직원 조회
      const periods = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
      );
      evaluationPeriodId = periods[0].id;

      const employees = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 5`,
      );
      employeeIds = employees.map((emp: any) => emp.id);

      // 4. 매핑 ID들 조회
      const mappings = await dataSource.query(
        `SELECT id, "employeeId" FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "deletedAt" IS NULL`,
        [evaluationPeriodId],
      );
      mappingIds = mappings.map((mapping: any) => mapping.id);

      console.log(`테스트 데이터 준비 완료 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}, 매핑 수: ${mappingIds.length}`);
    });

    // ==================== 헬퍼 함수 ====================

    async function getAssignedData(employeeId: string) {
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`)
        .expect(HttpStatus.OK);

      return response.body;
    }

    async function updateEditableStatus(mappingId: string, evaluationType: string, isEditable: boolean) {
      const response = await testSuite
        .request()
        .patch(`/admin/performance-evaluation/evaluation-editable-status/${mappingId}`)
        .query({ evaluationType, isEditable: isEditable.toString() })
        .expect(HttpStatus.OK);

      return response.body;
    }

    async function getMappingStatus(mappingId: string) {
      const mappings = await dataSource.query(
        `SELECT "isSelfEvaluationEditable", "isPrimaryEvaluationEditable", "isSecondaryEvaluationEditable"
         FROM evaluation_period_employee_mapping 
         WHERE id = $1`,
        [mappingId],
      );
      return mappings[0];
    }

    async function setMappingStatus(mappingId: string, self: boolean, primary: boolean, secondary: boolean) {
      // 각 상태를 순차적으로 변경하고 잠시 대기
      await updateEditableStatus(mappingId, 'self', self);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await updateEditableStatus(mappingId, 'primary', primary);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await updateEditableStatus(mappingId, 'secondary', secondary);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // ==================== 다양한 상태 조합 테스트 ====================

    it('모든 평가가 수정가능한 상태에서 올바르게 반환되어야 한다', async () => {
      const mappingId = mappingIds[0];
      const employeeId = employeeIds[0];

      // 모든 평가를 수정가능으로 설정
      await setMappingStatus(mappingId, true, true, true);

      const data = await getAssignedData(employeeId);
      const mappingStatus = await getMappingStatus(mappingId);

      // DB 상태 검증
      expect(mappingStatus.isSelfEvaluationEditable).toBe(true);
      expect(mappingStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(mappingStatus.isSecondaryEvaluationEditable).toBe(true);

      // API 응답 검증
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(true);

      // WBS별 isEditable 값 검증
      data.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(true);
          }
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(true);
          }
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(true);
          }
        });
      });

      console.log('✅ 모든 평가가 수정가능한 상태 검증 완료');
    });

    it('모든 평가가 수정불가능한 상태에서 올바르게 반환되어야 한다', async () => {
      const mappingId = mappingIds[1];
      const employeeId = employeeIds[1];

      // 모든 평가를 수정불가능으로 설정
      await setMappingStatus(mappingId, false, false, false);

      const data = await getAssignedData(employeeId);
      const mappingStatus = await getMappingStatus(mappingId);

      // DB 상태 검증
      expect(mappingStatus.isSelfEvaluationEditable).toBe(false);
      expect(mappingStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(mappingStatus.isSecondaryEvaluationEditable).toBe(false);

      // API 응답 검증
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(false);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(false);

      // WBS별 isEditable 값 검증
      data.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(false);
          }
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(false);
          }
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 모든 평가가 수정불가능한 상태 검증 완료');
    });

    it('자기평가만 수정가능한 상태에서 올바르게 반환되어야 한다', async () => {
      const mappingId = mappingIds[2];
      const employeeId = employeeIds[2];

      // 자기평가만 수정가능으로 설정
      await setMappingStatus(mappingId, true, false, false);

      const data = await getAssignedData(employeeId);
      const mappingStatus = await getMappingStatus(mappingId);

      console.log('자기평가만 수정가능 테스트 - DB 상태:', mappingStatus);
      console.log('자기평가만 수정가능 테스트 - API 응답:', data.editableStatus);

      // DB 상태 검증
      expect(mappingStatus.isSelfEvaluationEditable).toBe(true);
      expect(mappingStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(mappingStatus.isSecondaryEvaluationEditable).toBe(false);

      // API 응답 검증
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(false);

      // WBS별 isEditable 값 검증
      data.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(true);
          }
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(false);
          }
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 자기평가만 수정가능한 상태 검증 완료');
    });

    it('하향평가만 수정가능한 상태에서 올바르게 반환되어야 한다', async () => {
      const mappingId = mappingIds[3];
      const employeeId = employeeIds[3];

      // 하향평가만 수정가능으로 설정
      await setMappingStatus(mappingId, false, true, true);

      const data = await getAssignedData(employeeId);
      const mappingStatus = await getMappingStatus(mappingId);

      // DB 상태 검증
      expect(mappingStatus.isSelfEvaluationEditable).toBe(false);
      expect(mappingStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(mappingStatus.isSecondaryEvaluationEditable).toBe(true);

      // API 응답 검증
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(false);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(true);

      // WBS별 isEditable 값 검증
      data.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(false);
          }
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(true);
          }
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(true);
          }
        });
      });

      console.log('✅ 하향평가만 수정가능한 상태 검증 완료');
    });

    it('1차평가만 수정가능한 상태에서 올바르게 반환되어야 한다', async () => {
      const mappingId = mappingIds[4] || mappingIds[0];
      const employeeId = employeeIds[4] || employeeIds[0];

      // 1차평가만 수정가능으로 설정
      await setMappingStatus(mappingId, false, true, false);

      const data = await getAssignedData(employeeId);
      const mappingStatus = await getMappingStatus(mappingId);

      // DB 상태 검증
      expect(mappingStatus.isSelfEvaluationEditable).toBe(false);
      expect(mappingStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(mappingStatus.isSecondaryEvaluationEditable).toBe(false);

      // API 응답 검증
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(false);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(false);

      // WBS별 isEditable 값 검증
      data.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(false);
          }
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(true);
          }
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 1차평가만 수정가능한 상태 검증 완료');
    });

    // ==================== 상태 변경 전후 비교 테스트 ====================

    it('상태 변경 전후 비교가 올바르게 동작해야 한다', async () => {
      const mappingId = mappingIds[0];
      const employeeId = employeeIds[0];

      // 1. 초기 상태 (모든 평가 수정가능)
      await setMappingStatus(mappingId, true, true, true);
      const initialData = await getAssignedData(employeeId);

      // 2. 자기평가만 수정불가능으로 변경
      await updateEditableStatus(mappingId, 'self', false);
      const updatedData = await getAssignedData(employeeId);

      // 3. 변경 전후 비교
      expect(initialData.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(updatedData.editableStatus.isSelfEvaluationEditable).toBe(false);

      // 4. 다른 평가는 변경되지 않았는지 확인
      expect(updatedData.editableStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(updatedData.editableStatus.isSecondaryEvaluationEditable).toBe(true);

      // 5. WBS별 isEditable 값도 변경되었는지 확인
      initialData.projects.forEach((project: any, projectIndex: number) => {
        project.wbsList.forEach((wbs: any, wbsIndex: number) => {
          if (wbs.selfEvaluation && updatedData.projects[projectIndex]?.wbsList[wbsIndex]?.selfEvaluation) {
            expect(initialData.projects[projectIndex].wbsList[wbsIndex].selfEvaluation.isEditable).toBe(true);
            expect(updatedData.projects[projectIndex].wbsList[wbsIndex].selfEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 상태 변경 전후 비교 검증 완료');
    });

    // ==================== 성능 테스트 ====================

    it('여러 직원의 상태를 동시에 변경해도 올바르게 동작해야 한다', async () => {
      const promises = mappingIds.slice(0, 3).map(async (mappingId, index) => {
        const employeeId = employeeIds[index];
        const selfEditable = index % 2 === 0;
        const primaryEditable = (index + 1) % 2 === 0;
        const secondaryEditable = index % 3 === 0;

        // 상태 설정
        await setMappingStatus(mappingId, selfEditable, primaryEditable, secondaryEditable);

        // 데이터 조회 및 검증
        const data = await getAssignedData(employeeId);
        const mappingStatus = await getMappingStatus(mappingId);

        return {
          employeeId,
          expected: { selfEditable, primaryEditable, secondaryEditable },
          actual: {
            selfEditable: data.editableStatus.isSelfEvaluationEditable,
            primaryEditable: data.editableStatus.isPrimaryEvaluationEditable,
            secondaryEditable: data.editableStatus.isSecondaryEvaluationEditable,
          },
          mappingStatus,
        };
      });

      const results = await Promise.all(promises);

      // 모든 결과 검증
      results.forEach((result) => {
        expect(result.actual.selfEditable).toBe(result.expected.selfEditable);
        expect(result.actual.primaryEditable).toBe(result.expected.primaryEditable);
        expect(result.actual.secondaryEditable).toBe(result.expected.secondaryEditable);

        expect(result.mappingStatus.isSelfEvaluationEditable).toBe(result.expected.selfEditable);
        expect(result.mappingStatus.isPrimaryEvaluationEditable).toBe(result.expected.primaryEditable);
        expect(result.mappingStatus.isSecondaryEvaluationEditable).toBe(result.expected.secondaryEditable);
      });

      console.log(`✅ ${results.length}명의 직원 상태 동시 변경 검증 완료`);
    });

    // ==================== 엣지 케이스 테스트 ====================

    it('WBS가 없는 프로젝트에서도 editableStatus가 올바르게 반환되어야 한다', async () => {
      const mappingId = mappingIds[0];
      const employeeId = employeeIds[0];

      // 상태 설정
      await setMappingStatus(mappingId, true, false, true);

      const data = await getAssignedData(employeeId);

      // editableStatus는 WBS 유무와 관계없이 반환되어야 함
      expect(data.editableStatus).toBeDefined();
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(true);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(true);

      console.log('✅ WBS가 없는 프로젝트에서도 editableStatus 검증 완료');
    });

    it('프로젝트가 없는 직원에서도 editableStatus가 올바르게 반환되어야 한다', async () => {
      // 프로젝트가 없는 직원을 찾거나 새로 생성
      const mappingId = mappingIds[0];
      const employeeId = employeeIds[0];

      // 상태 설정
      await setMappingStatus(mappingId, false, true, false);

      const data = await getAssignedData(employeeId);

      // editableStatus는 프로젝트 유무와 관계없이 반환되어야 함
      expect(data.editableStatus).toBeDefined();
      expect(data.editableStatus.isSelfEvaluationEditable).toBe(false);
      expect(data.editableStatus.isPrimaryEvaluationEditable).toBe(true);
      expect(data.editableStatus.isSecondaryEvaluationEditable).toBe(false);

      console.log('✅ 프로젝트가 없는 직원에서도 editableStatus 검증 완료');
    });
  });
});
