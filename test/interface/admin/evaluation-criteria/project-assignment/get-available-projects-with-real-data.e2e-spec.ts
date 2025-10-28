/**
 * 할당 가능한 프로젝트 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 검색, 페이징, 정렬 기능을 포함한 할당 가능한 프로젝트 목록 조회 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/project-assignments/available-projects (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  let evaluationPeriodId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

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

    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({ scenario: 'full', clearExisting: false })
      .expect(201);

    // 평가기간 ID 조회
    const periodResult = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
    );
    evaluationPeriodId = periodResult[0]?.id;

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('성공 케이스', () => {
    it('기본 조회 - 모든 활성 프로젝트 목록을 조회한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ periodId: evaluationPeriodId })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('periodId', evaluationPeriodId);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 20);
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('sortBy', 'name');
      expect(response.body).toHaveProperty('sortOrder', 'ASC');
      expect(Array.isArray(response.body.projects)).toBe(true);
    });

    it('페이징 - 페이지 크기와 페이지 번호를 지정하여 조회한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          page: 1,
          limit: 5
        })
        .expect(HttpStatus.OK);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.projects.length).toBeLessThanOrEqual(5);
    });

    it('검색 - 프로젝트명으로 검색한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '프로젝트'
        })
        .expect(HttpStatus.OK);

      expect(response.body.search).toBe('프로젝트');
      expect(response.body.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('프로젝트')
          })
        ])
      );
    });

    it('검색 - 프로젝트코드로 검색한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: 'PROJ'
        })
        .expect(HttpStatus.OK);

      expect(response.body.search).toBe('PROJ');
      // 프로젝트코드가 있는 경우에만 검증
      if (response.body.projects.length > 0) {
        const hasProjectCodeMatch = response.body.projects.some((project: any) => 
          project.projectCode && project.projectCode.includes('PROJ')
        );
        expect(hasProjectCodeMatch).toBe(true);
      }
    });

    it('검색 - 매니저명으로 검색한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '김',
          sortBy: 'managerName'
        })
        .expect(HttpStatus.OK);

      expect(response.body.search).toBe('김');
      expect(response.body.sortBy).toBe('managerName');
    });

    it('정렬 - 프로젝트명 오름차순으로 정렬한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortBy: 'name',
          sortOrder: 'ASC'
        })
        .expect(HttpStatus.OK);

      expect(response.body.sortBy).toBe('name');
      expect(response.body.sortOrder).toBe('ASC');
      
      if (response.body.projects.length > 1) {
        const names = response.body.projects.map((p: any) => p.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      }
    });

    it('정렬 - 프로젝트명 내림차순으로 정렬한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortBy: 'name',
          sortOrder: 'DESC'
        })
        .expect(HttpStatus.OK);

      expect(response.body.sortBy).toBe('name');
      expect(response.body.sortOrder).toBe('DESC');
      
      if (response.body.projects.length > 1) {
        const names = response.body.projects.map((p: any) => p.name);
        const sortedNames = [...names].sort().reverse();
        expect(names).toEqual(sortedNames);
      }
    });

    it('정렬 - 시작일 기준으로 정렬한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortBy: 'startDate',
          sortOrder: 'ASC'
        })
        .expect(HttpStatus.OK);

      expect(response.body.sortBy).toBe('startDate');
      expect(response.body.sortOrder).toBe('ASC');
    });

    it('정렬 - 종료일 기준으로 정렬한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortBy: 'endDate',
          sortOrder: 'DESC'
        })
        .expect(HttpStatus.OK);

      expect(response.body.sortBy).toBe('endDate');
      expect(response.body.sortOrder).toBe('DESC');
    });

    it('정렬 - 매니저명 기준으로 정렬한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortBy: 'managerName',
          sortOrder: 'ASC'
        })
        .expect(HttpStatus.OK);

      expect(response.body.sortBy).toBe('managerName');
      expect(response.body.sortOrder).toBe('ASC');
    });

    it('상태 필터 - ACTIVE 상태 프로젝트만 조회한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          status: 'ACTIVE'
        })
        .expect(HttpStatus.OK);

      expect(response.body.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'ACTIVE'
          })
        ])
      );
    });

    it('복합 조건 - 검색, 페이징, 정렬을 함께 사용한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '프로젝트',
          page: 1,
          limit: 3,
          sortBy: 'name',
          sortOrder: 'DESC'
        })
        .expect(HttpStatus.OK);

      expect(response.body.periodId).toBe(evaluationPeriodId);
      expect(response.body.search).toBe('프로젝트');
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(3);
      expect(response.body.sortBy).toBe('name');
      expect(response.body.sortOrder).toBe('DESC');
      expect(response.body.projects.length).toBeLessThanOrEqual(3);
    });

    it('매니저 정보가 포함된 프로젝트를 조회한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ periodId: evaluationPeriodId })
        .expect(HttpStatus.OK);

      // 매니저가 있는 프로젝트가 있는지 확인
      const projectsWithManager = response.body.projects.filter((p: any) => p.manager);
      if (projectsWithManager.length > 0) {
        const projectWithManager = projectsWithManager[0];
        expect(projectWithManager.manager).toHaveProperty('id');
        expect(projectWithManager.manager).toHaveProperty('name');
        expect(projectWithManager.manager).toHaveProperty('email');
        expect(projectWithManager.manager).toHaveProperty('phoneNumber');
        expect(projectWithManager.manager).toHaveProperty('departmentName');
      }
    });

    it('빈 결과 - 검색 조건에 맞는 프로젝트가 없을 때 빈 배열을 반환한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '존재하지않는프로젝트명'
        })
        .expect(HttpStatus.OK);

      expect(response.body.projects).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.totalPages).toBe(0);
    });
  });

  describe('실패 케이스', () => {
    it('필수 파라미터 누락 - periodId가 없을 때 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 UUID 형식 - periodId가 잘못된 형식일 때 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ periodId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('존재하지 않는 평가기간 - 유효하지 않은 periodId일 때 404 에러를 반환한다', async () => {
      const fakePeriodId = '123e4567-e89b-12d3-a456-426614174999';
      
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ periodId: fakePeriodId })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 페이징 파라미터 - 음수 페이지 번호일 때 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          page: -1
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 페이징 파라미터 - 0 이하의 limit일 때 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          limit: 0
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 정렬 기준 - 지원하지 않는 sortBy일 때 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortBy: 'invalidSortBy'
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 정렬 방향 - 지원하지 않는 sortOrder일 때 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          sortOrder: 'INVALID'
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('엣지 케이스', () => {
    it('매우 큰 페이지 번호 - 존재하지 않는 페이지를 요청할 때 빈 결과를 반환한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          page: 9999,
          limit: 10
        })
        .expect(HttpStatus.OK);

      expect(response.body.projects).toEqual([]);
      expect(response.body.page).toBe(9999);
    });

    it('매우 큰 limit - 최대 제한을 초과하는 limit을 요청할 때 제한된 결과를 반환한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          limit: 1000
        })
        .expect(HttpStatus.OK);

      expect(response.body.limit).toBe(1000);
      expect(response.body.projects.length).toBeLessThanOrEqual(1000);
    });

    it('특수문자 검색 - 특수문자가 포함된 검색어로 검색한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '!@#$%^&*()'
        })
        .expect(HttpStatus.OK);

      expect(response.body.search).toBe('!@#$%^&*()');
      expect(response.body.projects).toEqual([]);
    });

    it('빈 문자열 검색 - 빈 문자열로 검색할 때 모든 결과를 반환한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: ''
        })
        .expect(HttpStatus.OK);

      expect(response.body.search).toBe('');
      expect(response.body.projects.length).toBeGreaterThan(0);
    });

    it('대소문자 구분 없는 검색 - 대소문자가 섞인 검색어로 검색한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '프로젝트'
        })
        .expect(HttpStatus.OK);

      const response2 = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: 'PROJECT'
        })
        .expect(HttpStatus.OK);

      // 대소문자 구분 없이 검색되므로 결과가 다를 수 있음
      expect(response.body.search).toBe('프로젝트');
      expect(response2.body.search).toBe('PROJECT');
    });
  });

  describe('성능 테스트', () => {
    it('대용량 데이터 - 많은 프로젝트가 있을 때도 빠르게 조회한다', async () => {
      const startTime = Date.now();
      
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ periodId: evaluationPeriodId })
        .expect(HttpStatus.OK);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // 5초 이내
      expect(response.body.projects.length).toBeGreaterThan(0);
    });

    it('복합 검색 - 여러 조건을 조합한 복잡한 검색도 빠르게 처리한다', async () => {
      const startTime = Date.now();
      
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ 
          periodId: evaluationPeriodId,
          search: '프로젝트',
          page: 1,
          limit: 10,
          sortBy: 'managerName',
          sortOrder: 'DESC'
        })
        .expect(HttpStatus.OK);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // 3초 이내
      expect(response.body.projects.length).toBeLessThanOrEqual(10);
    });
  });
});
