/**
 * 사용자 할당 정보 조회 (산출물 포함) E2E 테스트
 *
 * API: GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data
 *
 * 이 테스트는 WBS에 연결된 산출물이 제대로 반환되는지 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data (산출물 포함)', () => {
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

  describe('WBS 산출물 반환 검증', () => {
    let evaluationPeriodId: string;
    let employeeId: string;
    let wbsItemId: string;
    let deliverableIds: string[] = [];
    let inactiveDeliverableId: string;

    beforeAll(async () => {
      console.log('\n=== 테스트 데이터 준비 시작 ===');

      // 1. 시드 데이터 생성
      console.log('1. 시드 데이터 생성 중...');
      await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(`Failed to clear seed data: ${res.status}`);
          }
        });

      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send({
          scenario: 'full',
          clearExisting: true,
          dataScale: {
            departmentCount: 1,
            employeeCount: 5,
            projectCount: 1,
            wbsPerProject: 2,
          },
          evaluationConfig: {
            periodCount: 1,
          },
        })
        .expect(201);

      console.log('   ✓ 시드 데이터 생성 완료');

      // 2. 평가기간 조회
      const periods = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );
      evaluationPeriodId = periods[0].id;
      console.log(`   ✓ 평가기간 ID: ${evaluationPeriodId}`);

      // 3. 직원 조회 (프로젝트에 할당된 직원)
      const employees = await dataSource.query(
        `SELECT DISTINCT ea."employeeId" 
         FROM evaluation_project_assignment ea
         WHERE ea."periodId" = $1 AND ea."deletedAt" IS NULL
         LIMIT 1`,
        [evaluationPeriodId],
      );
      employeeId = employees[0].employeeId;
      console.log(`   ✓ 직원 ID: ${employeeId}`);

      // 4. WBS 조회 (해당 직원에게 할당된 WBS)
      const wbsAssignments = await dataSource.query(
        `SELECT wa."wbsItemId" 
         FROM evaluation_wbs_assignment wa
         WHERE wa."periodId" = $1 
         AND wa."employeeId" = $2 
         AND wa."deletedAt" IS NULL
         LIMIT 1`,
        [evaluationPeriodId, employeeId],
      );

      if (wbsAssignments.length === 0) {
        throw new Error('WBS 할당을 찾을 수 없습니다.');
      }

      wbsItemId = wbsAssignments[0].wbsItemId;
      console.log(`   ✓ WBS Item ID: ${wbsItemId}`);

      // 5. 산출물 생성 (3개)
      console.log('2. 산출물 생성 중...');

      const deliverableTypes = ['document', 'code', 'design'];
      const deliverableNames = [
        'ERD 설계서',
        '소스코드 패키지',
        'UI/UX 디자인 시안',
      ];
      const deliverableDescriptions = [
        '데이터베이스 스키마 설계 문서',
        '백엔드 API 소스코드',
        '사용자 인터페이스 디자인 파일',
      ];

      for (let i = 0; i < 3; i++) {
        const deliverableId = uuidv4();
        const now = new Date();

        await dataSource.query(
          `INSERT INTO deliverable 
           (id, name, description, type, "filePath", "employeeId", "wbsItemId", 
            "mappedDate", "mappedBy", "isActive", "createdAt", "updatedAt", "createdBy", version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            deliverableId,
            deliverableNames[i],
            deliverableDescriptions[i],
            deliverableTypes[i],
            `/uploads/${deliverableTypes[i]}_${i + 1}.pdf`,
            employeeId,
            wbsItemId,
            now,
            employeeId,
            true,
            now,
            now,
            employeeId,
            1,
          ],
        );

        deliverableIds.push(deliverableId);
        console.log(
          `   ✓ 산출물 생성: ${deliverableNames[i]} (${deliverableId})`,
        );
      }

      // 6. 비활성 산출물 생성 (반환되지 않아야 함)
      inactiveDeliverableId = uuidv4();
      const now2 = new Date();

      await dataSource.query(
        `INSERT INTO deliverable 
         (id, name, description, type, "isActive", "wbsItemId", 
          "createdAt", "updatedAt", "createdBy", version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          inactiveDeliverableId,
          '비활성 산출물',
          '이 산출물은 비활성 상태입니다.',
          'other',
          false, // isActive = false
          wbsItemId,
          now2,
          now2,
          employeeId,
          1,
        ],
      );
      console.log(`   ✓ 비활성 산출물 생성: ${inactiveDeliverableId}`);

      console.log('=== 테스트 데이터 준비 완료 ===\n');
    });

    it('할당 정보 조회 시 WBS에 연결된 활성 산출물 목록이 반환되어야 한다', async () => {
      console.log('\n[테스트 1] 산출물 목록 반환 검증');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      // 응답 구조 검증
      expect(response.body).toHaveProperty('evaluationPeriod');
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('summary');

      // 프로젝트 존재 확인
      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.projects.length).toBeGreaterThan(0);

      console.log(`  ✓ 프로젝트 수: ${response.body.projects.length}`);

      // WBS가 있는 프로젝트 찾기
      let foundWbsWithDeliverables = false;

      for (const project of response.body.projects) {
        expect(project).toHaveProperty('wbsList');
        expect(project.wbsList).toBeInstanceOf(Array);

        for (const wbs of project.wbsList) {
          // deliverables 필드가 존재하는지 확인
          expect(wbs).toHaveProperty('deliverables');
          expect(wbs.deliverables).toBeInstanceOf(Array);

          console.log(
            `  ✓ WBS: ${wbs.wbsName}, 산출물 수: ${wbs.deliverables.length}`,
          );

          // 우리가 생성한 WBS인지 확인
          if (wbs.wbsId === wbsItemId) {
            foundWbsWithDeliverables = true;

            // 최소 3개 이상의 활성 산출물이 반환되어야 함 (비활성 산출물은 제외)
            expect(wbs.deliverables.length).toBeGreaterThanOrEqual(3);

            console.log(
              `  ✓ 테스트 WBS 발견: ${wbs.wbsName} (${wbs.deliverables.length}개 산출물)`,
            );

            // 우리가 생성한 3개의 산출물 ID가 포함되어 있는지 확인
            const foundDeliverableIds = wbs.deliverables.map((d: any) => d.id);

            deliverableIds.forEach((id) => {
              expect(foundDeliverableIds).toContain(id);
            });

            console.log(`    ✓ 생성한 3개 산출물 ID 모두 포함 확인`);

            // 각 산출물 구조 검증
            wbs.deliverables.forEach((deliverable: any, index: number) => {
              expect(deliverable).toHaveProperty('id');
              expect(deliverable).toHaveProperty('name');
              expect(deliverable).toHaveProperty('type');
              expect(deliverable).toHaveProperty('isActive');
              expect(deliverable).toHaveProperty('createdAt');

              // 활성 상태인지 확인
              expect(deliverable.isActive).toBe(true);

              console.log(
                `    - 산출물 ${index + 1}: ${deliverable.name} (${deliverable.type})`,
              );
            });
          }
        }
      }

      expect(foundWbsWithDeliverables).toBe(true);
      console.log('  ✓ 산출물이 포함된 WBS 검증 완료\n');
    });

    it('산출물 필드가 올바른 구조를 가져야 한다', async () => {
      console.log('\n[테스트 2] 산출물 필드 구조 검증');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      // 우리가 생성한 WBS 찾기
      let targetWbs: any = null;

      for (const project of response.body.projects) {
        for (const wbs of project.wbsList) {
          if (wbs.wbsId === wbsItemId) {
            targetWbs = wbs;
            break;
          }
        }
        if (targetWbs) break;
      }

      expect(targetWbs).not.toBeNull();
      expect(targetWbs.deliverables.length).toBeGreaterThanOrEqual(3);

      // 우리가 생성한 산출물 중 하나 찾기
      const ourDeliverables = targetWbs.deliverables.filter((d: any) =>
        deliverableIds.includes(d.id),
      );
      expect(ourDeliverables.length).toBe(3);

      // 첫 번째 산출물의 모든 필드 검증
      const firstDeliverable = ourDeliverables[0];

      console.log('  검증 중인 산출물:', firstDeliverable.name);

      // 필수 필드
      expect(firstDeliverable).toHaveProperty('id');
      expect(typeof firstDeliverable.id).toBe('string');

      expect(firstDeliverable).toHaveProperty('name');
      expect(typeof firstDeliverable.name).toBe('string');
      expect(firstDeliverable.name.length).toBeGreaterThan(0);

      expect(firstDeliverable).toHaveProperty('type');
      expect([
        'document',
        'code',
        'design',
        'report',
        'presentation',
        'other',
      ]).toContain(firstDeliverable.type);

      expect(firstDeliverable).toHaveProperty('isActive');
      expect(typeof firstDeliverable.isActive).toBe('boolean');

      expect(firstDeliverable).toHaveProperty('createdAt');
      expect(new Date(firstDeliverable.createdAt)).toBeInstanceOf(Date);

      // 선택적 필드
      expect(firstDeliverable).toHaveProperty('description');
      if (firstDeliverable.description) {
        expect(typeof firstDeliverable.description).toBe('string');
      }

      expect(firstDeliverable).toHaveProperty('filePath');
      if (firstDeliverable.filePath) {
        expect(typeof firstDeliverable.filePath).toBe('string');
      }

      expect(firstDeliverable).toHaveProperty('employeeId');
      if (firstDeliverable.employeeId) {
        expect(typeof firstDeliverable.employeeId).toBe('string');
      }

      expect(firstDeliverable).toHaveProperty('mappedDate');
      if (firstDeliverable.mappedDate) {
        expect(new Date(firstDeliverable.mappedDate)).toBeInstanceOf(Date);
      }

      expect(firstDeliverable).toHaveProperty('mappedBy');
      if (firstDeliverable.mappedBy) {
        expect(typeof firstDeliverable.mappedBy).toBe('string');
      }

      console.log('  ✓ 모든 필드 구조 검증 완료');
      console.log(`    - id: ${firstDeliverable.id}`);
      console.log(`    - name: ${firstDeliverable.name}`);
      console.log(`    - type: ${firstDeliverable.type}`);
      console.log(
        `    - description: ${firstDeliverable.description || 'null'}`,
      );
      console.log(`    - filePath: ${firstDeliverable.filePath || 'null'}`);
      console.log(`    - isActive: ${firstDeliverable.isActive}`);
      console.log(`    - createdAt: ${firstDeliverable.createdAt}\n`);
    });

    it('산출물이 생성일 내림차순으로 정렬되어야 한다', async () => {
      console.log('\n[테스트 3] 산출물 정렬 순서 검증');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      // 우리가 생성한 WBS 찾기
      let targetWbs: any = null;

      for (const project of response.body.projects) {
        for (const wbs of project.wbsList) {
          if (wbs.wbsId === wbsItemId) {
            targetWbs = wbs;
            break;
          }
        }
        if (targetWbs) break;
      }

      expect(targetWbs).not.toBeNull();
      expect(targetWbs.deliverables.length).toBeGreaterThanOrEqual(3);

      // 정렬 순서 확인 (생성일 내림차순) - 전체 산출물 대상
      const deliverables = targetWbs.deliverables;

      for (let i = 0; i < deliverables.length - 1; i++) {
        const current = new Date(deliverables[i].createdAt);
        const next = new Date(deliverables[i + 1].createdAt);

        // 현재 항목의 createdAt >= 다음 항목의 createdAt (내림차순)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());

        console.log(
          `  ✓ ${deliverables[i].name} (${current.toISOString()}) >= ${deliverables[i + 1].name} (${next.toISOString()})`,
        );
      }

      console.log('  ✓ 산출물 정렬 순서 검증 완료\n');
    });

    it('모든 WBS가 deliverables 필드를 가져야 한다', async () => {
      console.log('\n[테스트 4] deliverables 필드 존재 검증');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      // 모든 WBS가 deliverables 필드를 가지는지 확인
      let totalWbs = 0;
      let wbsWithoutDeliverables = 0;

      for (const project of response.body.projects) {
        for (const wbs of project.wbsList) {
          totalWbs++;

          // deliverables 필드는 반드시 존재해야 함
          expect(wbs).toHaveProperty('deliverables');
          expect(wbs.deliverables).toBeInstanceOf(Array);

          if (wbs.wbsId !== wbsItemId) {
            // 다른 WBS의 산출물 개수 확인
            console.log(
              `  ✓ WBS: ${wbs.wbsName}, 산출물: ${wbs.deliverables.length}개`,
            );

            if (wbs.deliverables.length === 0) {
              wbsWithoutDeliverables++;
            }
          }
        }
      }

      console.log(`  ✓ 전체 WBS 수: ${totalWbs}개`);
      console.log(`  ✓ 산출물이 없는 WBS: ${wbsWithoutDeliverables}개`);
      console.log('  ✓ deliverables 필드 존재 검증 완료\n');
    });

    it('비활성 산출물은 반환되지 않아야 한다', async () => {
      console.log('\n[테스트 5] 비활성 산출물 제외 검증');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.OK);

      // 모든 산출물이 활성 상태인지 확인
      for (const project of response.body.projects) {
        for (const wbs of project.wbsList) {
          for (const deliverable of wbs.deliverables) {
            expect(deliverable.isActive).toBe(true);
            console.log(`  ✓ ${deliverable.name}: isActive = true`);
          }
        }
      }

      // 우리가 생성한 WBS에서 비활성 산출물이 제외되었는지 확인
      let targetWbs: any = null;

      for (const project of response.body.projects) {
        for (const wbs of project.wbsList) {
          if (wbs.wbsId === wbsItemId) {
            targetWbs = wbs;
            break;
          }
        }
        if (targetWbs) break;
      }

      // 우리가 생성한 활성 산출물 3개가 모두 포함되어 있어야 함 (비활성 1개는 제외)
      const ourActiveDeliverables = targetWbs.deliverables.filter((d: any) =>
        deliverableIds.includes(d.id),
      );
      expect(ourActiveDeliverables.length).toBe(3);

      // 비활성 산출물 ID는 포함되지 않아야 함
      const foundIds = targetWbs.deliverables.map((d: any) => d.id);
      expect(foundIds).not.toContain(inactiveDeliverableId);

      console.log(
        `  ✓ 비활성 산출물 제외 확인: 생성한 활성 산출물 3개만 포함\n`,
      );
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 평가기간 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      console.log('\n[에러 테스트 1] 잘못된 평가기간 ID');

      const invalidPeriodId = uuidv4();
      const employeeId = uuidv4();

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${invalidPeriodId}/employees/${employeeId}/assigned-data`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log(`  ✓ 404 에러 반환 확인\n`);
    });

    it('잘못된 직원 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      console.log('\n[에러 테스트 2] 잘못된 직원 ID');

      // 실제 평가기간 ID 조회
      const periods = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (periods.length === 0) {
        console.log('  ⚠ 평가기간이 없어 테스트 스킵\n');
        return;
      }

      const evaluationPeriodId = periods[0].id;
      const invalidEmployeeId = uuidv4();

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${invalidEmployeeId}/assigned-data`,
        )
        .expect(HttpStatus.NOT_FOUND);

      console.log(`  ✓ 404 에러 반환 확인\n`);
    });

    it('유효하지 않은 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
      console.log('\n[에러 테스트 3] 유효하지 않은 UUID 형식');

      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/invalid-uuid/employees/invalid-uuid/assigned-data`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log(`  ✓ 400 에러 반환 확인\n`);
    });
  });
});
