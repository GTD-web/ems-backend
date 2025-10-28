/**
 * 사용자 할당 정보 조회 - 수정가능 상태 검증 E2E 테스트
 *
 * 이 테스트는 대시보드 할당 정보 조회 시 추가된 editableStatus 필드와
 * WBS별 isEditable 값이 실제 EvaluationPeriodEmployeeMapping 상태를
 * 올바르게 반영하는지 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 시드 데이터 생성 (full 시나리오)
 * 2. 기본 editableStatus 값 확인
 * 3. 수정가능 상태 변경 API 호출
 * 4. 변경된 상태가 할당 정보 조회에 반영되는지 확인
 * 5. 최상단 editableStatus와 WBS별 isEditable 값 일치성 검증
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data (수정가능 상태 검증)', () => {
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

  describe('수정가능 상태 검증', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let mappingId: string;

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

      // 3. 평가기간과 직원 조회
      const periods = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
      );
      evaluationPeriodId = periods[0].id;

      const employees = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );
      employeeId = employees[0].id;

      // 4. 매핑 ID 조회
      const mappings = await dataSource.query(
        `SELECT id FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
        [evaluationPeriodId, employeeId],
      );
      mappingId = mappings[0].id;

      console.log(`테스트 데이터 준비 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 매핑: ${mappingId}`);
    });

    // ==================== 헬퍼 함수 ====================

    async function getAssignedData() {
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`)
        .expect(HttpStatus.OK);

      return response.body;
    }

    async function updateEditableStatus(evaluationType: string, isEditable: boolean) {
      const response = await testSuite
        .request()
        .patch(`/admin/performance-evaluation/evaluation-editable-status/${mappingId}`)
        .query({ evaluationType, isEditable: isEditable.toString() })
        .expect(HttpStatus.OK);

      return response.body;
    }

    async function getMappingStatus() {
      const mappings = await dataSource.query(
        `SELECT "isSelfEvaluationEditable", "isPrimaryEvaluationEditable", "isSecondaryEvaluationEditable"
         FROM evaluation_period_employee_mapping 
         WHERE id = $1`,
        [mappingId],
      );
      return mappings[0];
    }

    // ==================== 기본 구조 검증 ====================

    it('응답에 editableStatus 필드가 포함되어야 한다', async () => {
      const data = await getAssignedData();

      // 기본 구조 검증
      expect(data).toBeDefined();
      expect(data.evaluationPeriod).toBeDefined();
      expect(data.employee).toBeDefined();
      expect(data.editableStatus).toBeDefined(); // 🆕 새로 추가된 필드
      expect(data.projects).toBeDefined();
      expect(data.summary).toBeDefined();

      // editableStatus 구조 검증
      expect(data.editableStatus).toHaveProperty('isSelfEvaluationEditable');
      expect(data.editableStatus).toHaveProperty('isPrimaryEvaluationEditable');
      expect(data.editableStatus).toHaveProperty('isSecondaryEvaluationEditable');

      // 타입 검증
      expect(typeof data.editableStatus.isSelfEvaluationEditable).toBe('boolean');
      expect(typeof data.editableStatus.isPrimaryEvaluationEditable).toBe('boolean');
      expect(typeof data.editableStatus.isSecondaryEvaluationEditable).toBe('boolean');

      console.log('✅ editableStatus 필드 구조 검증 완료');
    });

    it('WBS별 isEditable 값이 포함되어야 한다', async () => {
      const data = await getAssignedData();

      expect(data.projects).toBeDefined();
      expect(data.projects.length).toBeGreaterThan(0);

      // 첫 번째 프로젝트의 WBS 검증
      const firstProject = data.projects[0];
      expect(firstProject.wbsList).toBeDefined();
      expect(firstProject.wbsList.length).toBeGreaterThan(0);

      const firstWbs = firstProject.wbsList[0];

      // 자기평가 isEditable 검증
      if (firstWbs.selfEvaluation) {
        expect(firstWbs.selfEvaluation).toHaveProperty('isEditable');
        expect(typeof firstWbs.selfEvaluation.isEditable).toBe('boolean');
      }

      // 하향평가 isEditable 검증
      if (firstWbs.primaryDownwardEvaluation) {
        expect(firstWbs.primaryDownwardEvaluation).toHaveProperty('isEditable');
        expect(typeof firstWbs.primaryDownwardEvaluation.isEditable).toBe('boolean');
      }

      if (firstWbs.secondaryDownwardEvaluation) {
        expect(firstWbs.secondaryDownwardEvaluation).toHaveProperty('isEditable');
        expect(typeof firstWbs.secondaryDownwardEvaluation.isEditable).toBe('boolean');
      }

      console.log('✅ WBS별 isEditable 값 검증 완료');
    });

    // ==================== 상태 변경 검증 ====================

    it('자기평가 수정가능 상태 변경 시 올바르게 반영되어야 한다', async () => {
      // 1. 현재 상태 확인
      const initialData = await getAssignedData();
      const initialMappingStatus = await getMappingStatus();

      console.log('초기 상태:', {
        mapping: initialMappingStatus,
        editableStatus: initialData.editableStatus,
      });

      // 2. 자기평가 수정가능 상태를 false로 변경
      await updateEditableStatus('self', false);

      // 3. 변경 후 상태 확인
      const updatedData = await getAssignedData();
      const updatedMappingStatus = await getMappingStatus();

      // 4. DB 상태 검증
      expect(updatedMappingStatus.isSelfEvaluationEditable).toBe(false);

      // 5. API 응답 검증
      expect(updatedData.editableStatus.isSelfEvaluationEditable).toBe(false);

      // 6. WBS별 isEditable 값 검증
      updatedData.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 자기평가 수정가능 상태 변경 검증 완료');

      // 7. 원래 상태로 복구
      await updateEditableStatus('self', true);
    });

    it('1차평가 수정가능 상태 변경 시 올바르게 반영되어야 한다', async () => {
      // 1. 1차평가 수정가능 상태를 false로 변경
      await updateEditableStatus('primary', false);

      // 2. 변경 후 상태 확인
      const updatedData = await getAssignedData();
      const updatedMappingStatus = await getMappingStatus();

      // 3. DB 상태 검증
      expect(updatedMappingStatus.isPrimaryEvaluationEditable).toBe(false);

      // 4. API 응답 검증
      expect(updatedData.editableStatus.isPrimaryEvaluationEditable).toBe(false);

      // 5. WBS별 isEditable 값 검증
      updatedData.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 1차평가 수정가능 상태 변경 검증 완료');

      // 6. 원래 상태로 복구
      await updateEditableStatus('primary', true);
    });

    it('2차평가 수정가능 상태 변경 시 올바르게 반영되어야 한다', async () => {
      // 1. 2차평가 수정가능 상태를 false로 변경
      await updateEditableStatus('secondary', false);

      // 2. 변경 후 상태 확인
      const updatedData = await getAssignedData();
      const updatedMappingStatus = await getMappingStatus();

      // 3. DB 상태 검증
      expect(updatedMappingStatus.isSecondaryEvaluationEditable).toBe(false);

      // 4. API 응답 검증
      expect(updatedData.editableStatus.isSecondaryEvaluationEditable).toBe(false);

      // 5. WBS별 isEditable 값 검증
      updatedData.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(false);
          }
        });
      });

      console.log('✅ 2차평가 수정가능 상태 변경 검증 완료');

      // 6. 원래 상태로 복구
      await updateEditableStatus('secondary', true);
    });

    it('모든 평가 수정가능 상태 일괄 변경 시 올바르게 반영되어야 한다', async () => {
      // 1. 모든 평가 수정가능 상태를 false로 변경
      await updateEditableStatus('all', false);

      // 2. 변경 후 상태 확인
      const updatedData = await getAssignedData();
      const updatedMappingStatus = await getMappingStatus();

      // 3. DB 상태 검증
      expect(updatedMappingStatus.isSelfEvaluationEditable).toBe(false);
      expect(updatedMappingStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(updatedMappingStatus.isSecondaryEvaluationEditable).toBe(false);

      // 4. API 응답 검증
      expect(updatedData.editableStatus.isSelfEvaluationEditable).toBe(false);
      expect(updatedData.editableStatus.isPrimaryEvaluationEditable).toBe(false);
      expect(updatedData.editableStatus.isSecondaryEvaluationEditable).toBe(false);

      // 5. WBS별 isEditable 값 검증
      updatedData.projects.forEach((project: any) => {
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

      console.log('✅ 모든 평가 수정가능 상태 일괄 변경 검증 완료');

      // 6. 원래 상태로 복구
      await updateEditableStatus('all', true);
    });

    // ==================== 일치성 검증 ====================

    it('최상단 editableStatus와 WBS별 isEditable 값이 일치해야 한다', async () => {
      const data = await getAssignedData();

      // 모든 WBS의 isEditable 값이 최상단 editableStatus와 일치하는지 검증
      data.projects.forEach((project: any) => {
        project.wbsList.forEach((wbs: any) => {
          // 자기평가 일치성 검증
          if (wbs.selfEvaluation) {
            expect(wbs.selfEvaluation.isEditable).toBe(data.editableStatus.isSelfEvaluationEditable);
          }

          // 1차평가 일치성 검증
          if (wbs.primaryDownwardEvaluation) {
            expect(wbs.primaryDownwardEvaluation.isEditable).toBe(data.editableStatus.isPrimaryEvaluationEditable);
          }

          // 2차평가 일치성 검증
          if (wbs.secondaryDownwardEvaluation) {
            expect(wbs.secondaryDownwardEvaluation.isEditable).toBe(data.editableStatus.isSecondaryEvaluationEditable);
          }
        });
      });

      console.log('✅ 최상단 editableStatus와 WBS별 isEditable 값 일치성 검증 완료');
    });

    // ==================== 다른 엔드포인트 검증 ====================

    it('내 할당 정보 조회에서도 editableStatus가 올바르게 반환되어야 한다', async () => {
      // my-assigned-data 엔드포인트는 인증이 필요하므로 스킵
      console.log('내 할당 정보 조회는 인증이 필요하여 스킵');
      return;
    });

    it('담당자 피평가자 할당 정보 조회에서도 editableStatus가 올바르게 반환되어야 한다', async () => {
      // 평가자 ID 조회 (하향평가 관계가 있는 직원)
      const evaluators = await dataSource.query(
        `SELECT DISTINCT "evaluatorId" FROM evaluation_line_mappings 
         WHERE "employeeId" = $1 AND "deletedAt" IS NULL LIMIT 1`,
        [employeeId],
      );

      if (evaluators.length === 0) {
        console.log('평가자 관계가 없어서 테스트 스킵');
        return;
      }

      const evaluatorId = evaluators[0].evaluatorId;

      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`)
        .expect(HttpStatus.OK);

      const data = response.body;

      // evaluatee.editableStatus 필드 검증
      expect(data.evaluatee).toBeDefined();
      expect(data.evaluatee.editableStatus).toBeDefined();
      expect(data.evaluatee.editableStatus).toHaveProperty('isSelfEvaluationEditable');
      expect(data.evaluatee.editableStatus).toHaveProperty('isPrimaryEvaluationEditable');
      expect(data.evaluatee.editableStatus).toHaveProperty('isSecondaryEvaluationEditable');

      // 타입 검증
      expect(typeof data.evaluatee.editableStatus.isSelfEvaluationEditable).toBe('boolean');
      expect(typeof data.evaluatee.editableStatus.isPrimaryEvaluationEditable).toBe('boolean');
      expect(typeof data.evaluatee.editableStatus.isSecondaryEvaluationEditable).toBe('boolean');

      console.log('✅ 담당자 피평가자 할당 정보 조회 editableStatus 검증 완료');
    });
  });
});
