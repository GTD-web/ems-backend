import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('EvaluationPeriodManagement GET /evaluation-periods Endpoint (e2e)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터베이스 정리
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    // 각 테스트 후 데이터베이스 정리 (선택적)
    // await testSuite.cleanupAfterTest();
  });

  describe('GET /admin/evaluation-periods', () => {
    it('빈 목록을 페이징으로 조회해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });

    it('다양한 평가 기간을 페이징으로 조회해야 한다', async () => {
      // Given: 7개의 다양한 평가 기간 생성 (겹치지 않는 날짜로 설정)
      const periods = [
        {
          name: '2022년 하반기 평가',
          startDate: '2022-07-01',
          peerEvaluationDeadline: '2022-12-31',
          description: '2022년 하반기 종합 평가',
          maxSelfEvaluationRate: 100,
          gradeRanges: [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 85, maxRange: 94 },
            { grade: 'B', minRange: 70, maxRange: 84 },
          ],
        },
        {
          name: '2023년 상반기 평가',
          startDate: '2023-01-01',
          peerEvaluationDeadline: '2023-06-30',
          description: '2023년 상반기 성과 평가',
          maxSelfEvaluationRate: 110,
          gradeRanges: [
            { grade: 'S', minRange: 90, maxRange: 100 },
            { grade: 'A', minRange: 80, maxRange: 89 },
            { grade: 'B', minRange: 65, maxRange: 79 },
          ],
        },
        {
          name: '2023년 하반기 평가',
          startDate: '2023-07-01',
          peerEvaluationDeadline: '2023-12-31',
          description: '2023년 하반기 성과 평가',
          maxSelfEvaluationRate: 120,
          gradeRanges: [
            { grade: 'S', minRange: 92, maxRange: 100 },
            { grade: 'A', minRange: 82, maxRange: 91 },
            { grade: 'B', minRange: 68, maxRange: 81 },
            { grade: 'C', minRange: 50, maxRange: 67 },
          ],
        },
        {
          name: '2024년 1분기 평가',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '2024년 1분기 성과 평가',
          maxSelfEvaluationRate: 115,
          gradeRanges: [
            { grade: 'S', minRange: 93, maxRange: 100 },
            { grade: 'A', minRange: 83, maxRange: 92 },
            { grade: 'B', minRange: 70, maxRange: 82 },
          ],
        },
        {
          name: '2024년 2분기 평가',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '2024년 2분기 성과 평가',
          maxSelfEvaluationRate: 105,
          gradeRanges: [
            { grade: 'S', minRange: 88, maxRange: 100 },
            { grade: 'A', minRange: 75, maxRange: 87 },
            { grade: 'B', minRange: 60, maxRange: 74 },
          ],
        },
        {
          name: '2024년 3분기 평가',
          startDate: '2024-07-01',
          peerEvaluationDeadline: '2024-09-30',
          description: '2024년 3분기 성과 평가',
          maxSelfEvaluationRate: 125,
          gradeRanges: [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 85, maxRange: 94 },
            { grade: 'B', minRange: 72, maxRange: 84 },
            { grade: 'C', minRange: 55, maxRange: 71 },
          ],
        },
        {
          name: '2024년 4분기 평가',
          startDate: '2024-10-01',
          peerEvaluationDeadline: '2024-12-31',
          description: '2024년 4분기 성과 평가',
          maxSelfEvaluationRate: 130,
          gradeRanges: [
            { grade: 'S', minRange: 90, maxRange: 100 },
            { grade: 'A', minRange: 78, maxRange: 89 },
            { grade: 'B', minRange: 65, maxRange: 77 },
          ],
        },
      ];

      // 평가 기간들을 순차적으로 생성
      const createdPeriods: any[] = [];
      for (const period of periods) {
        const createResponse = await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
        createdPeriods.push(createResponse.body);
      }

      // When & Then: 첫 번째 페이지 (3개 항목)
      const firstPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(firstPageResponse.body).toMatchObject({
        total: 7,
        page: 1,
        limit: 3,
      });
      expect(firstPageResponse.body.items).toHaveLength(3);

      // 두 번째 페이지 (3개 항목)
      const secondPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 2, limit: 3 })
        .expect(200);

      expect(secondPageResponse.body).toMatchObject({
        total: 7,
        page: 2,
        limit: 3,
      });
      expect(secondPageResponse.body.items).toHaveLength(3);

      // 세 번째 페이지 (1개 항목)
      const thirdPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 3, limit: 3 })
        .expect(200);

      expect(thirdPageResponse.body).toMatchObject({
        total: 7,
        page: 3,
        limit: 3,
      });
      expect(thirdPageResponse.body.items).toHaveLength(1);

      // 각 페이지의 항목들이 중복되지 않는지 확인
      const firstPageIds = firstPageResponse.body.items.map(
        (item: any) => item.id,
      );
      const secondPageIds = secondPageResponse.body.items.map(
        (item: any) => item.id,
      );
      const thirdPageIds = thirdPageResponse.body.items.map(
        (item: any) => item.id,
      );

      const allIds = [...firstPageIds, ...secondPageIds, ...thirdPageIds];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(7); // 모든 ID가 고유해야 함

      // 큰 페이지 크기로 전체 조회
      const allItemsResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(allItemsResponse.body.items).toHaveLength(7);
      expect(allItemsResponse.body.total).toBe(7);

      // 생성된 데이터의 내용 검증 (일부)
      const foundPeriod = allItemsResponse.body.items.find(
        (item: any) => item.name === '2024년 4분기 평가',
      );
      expect(foundPeriod).toBeDefined();
      expect(foundPeriod.description).toBe('2024년 4분기 성과 평가');
      expect(foundPeriod.maxSelfEvaluationRate).toBe(130);
    });

    it('페이지 범위를 벗어난 요청 시 빈 목록을 반환해야 한다', async () => {
      // Given: 2개의 평가 기간만 생성
      const periods = [
        {
          name: '테스트 평가 1',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '테스트용 평가 1',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '테스트 평가 2',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '테스트용 평가 2',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
      ];

      for (const period of periods) {
        await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
      }

      // When & Then: 존재하지 않는 페이지 요청
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 5, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        items: [],
        total: 2,
        page: 5,
        limit: 10,
      });
    });

    it('다양한 페이지 크기로 조회가 가능해야 한다', async () => {
      // Given: 5개의 평가 기간 생성
      const periods = Array.from({ length: 5 }, (_, index) => ({
        name: `테스트 평가 ${index + 1}`,
        startDate: `2024-0${index + 1}-01`,
        peerEvaluationDeadline: `2024-0${index + 1}-28`,
        description: `테스트용 평가 ${index + 1}`,
        maxSelfEvaluationRate: 100 + index * 5,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      }));

      for (const period of periods) {
        await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
      }

      // When & Then: 다양한 페이지 크기로 조회
      // 페이지 크기 1
      const size1Response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(size1Response.body.items).toHaveLength(1);
      expect(size1Response.body.total).toBe(5);

      // 페이지 크기 2
      const size2Response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(size2Response.body.items).toHaveLength(2);
      expect(size2Response.body.total).toBe(5);

      // 페이지 크기 10 (전체보다 큰 크기)
      const size10Response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(size10Response.body.items).toHaveLength(5);
      expect(size10Response.body.total).toBe(5);
    });

    it('잘못된 페이지 번호로 조회 시 적절한 응답을 반환해야 한다', async () => {
      // Given: 기본 평가 기간 생성
      const createData = {
        name: '페이지 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '페이지 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      // When & Then: 음수 페이지 번호
      const negativePageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: -1, limit: 10 });

      // 400 (Bad Request) 또는 200 (OK - 기본값으로 처리) 중 하나여야 함
      expect([200, 400]).toContain(negativePageResponse.status);

      // 0 페이지 번호
      const zeroPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 0, limit: 10 });

      expect([200, 400]).toContain(zeroPageResponse.status);
    });

    it('잘못된 limit 값으로 조회 시 적절한 응답을 반환해야 한다', async () => {
      // Given: 기본 평가 기간 생성
      const createData = {
        name: 'Limit 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: 'Limit 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      // When & Then: 음수 limit
      const negativeLimitResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: -5 });

      expect([200, 400]).toContain(negativeLimitResponse.status);

      // 0 limit
      const zeroLimitResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 0 });

      expect([200, 400]).toContain(zeroLimitResponse.status);

      // 매우 큰 limit (1000)
      const largeLimitResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 1000 });

      expect([200, 400]).toContain(largeLimitResponse.status);
    });

    it('문자열 페이지 파라미터로 조회 시 적절한 응답을 반환해야 한다', async () => {
      // When & Then: 문자열 페이지 번호
      const stringPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 'abc', limit: 10 });

      expect([200, 400]).toContain(stringPageResponse.status);

      // 문자열 limit
      const stringLimitResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 'xyz' });

      expect([200, 400]).toContain(stringLimitResponse.status);

      // 소수점 페이지 번호
      const floatPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1.5, limit: 10 });

      expect([200, 400]).toContain(floatPageResponse.status);
    });

    it('쿼리 파라미터 없이 조회 시 기본값으로 처리되어야 한다', async () => {
      // Given: 기본 평가 기간 생성
      const createData = {
        name: '기본값 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '기본값 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      // When & Then: 쿼리 파라미터 없이 조회
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.limit).toBe('number');
    });

    it('삭제된 평가 기간은 목록에서 제외되어야 한다', async () => {
      // Given: 2개의 평가 기간 생성
      const periods = [
        {
          name: '삭제될 평가 기간',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '삭제 테스트용 평가 기간',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '유지될 평가 기간',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '유지 테스트용 평가 기간',
          maxSelfEvaluationRate: 110,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
      ];

      const createdPeriods: any[] = [];
      for (const period of periods) {
        const createResponse = await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
        createdPeriods.push(createResponse.body);
      }

      // 생성 후 목록 확인 (2개)
      const beforeDeleteResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(beforeDeleteResponse.body.total).toBe(2);
      expect(beforeDeleteResponse.body.items).toHaveLength(2);

      // When: 첫 번째 평가 기간 삭제
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${createdPeriods[0].id}`)
        .expect(200);

      // Then: 삭제 후 목록 확인 (1개)
      const afterDeleteResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(afterDeleteResponse.body.total).toBe(1);
      expect(afterDeleteResponse.body.items).toHaveLength(1);
      expect(afterDeleteResponse.body.items[0].name).toBe('유지될 평가 기간');
      expect(afterDeleteResponse.body.items[0].id).toBe(createdPeriods[1].id);

      // 삭제된 평가 기간이 목록에 없는지 확인
      const deletedPeriodExists = afterDeleteResponse.body.items.some(
        (item: any) => item.id === createdPeriods[0].id,
      );
      expect(deletedPeriodExists).toBe(false);
    });

    it('다양한 상태의 평가 기간이 모두 목록에 포함되어야 한다', async () => {
      // Given: 다양한 상태의 평가 기간 생성
      const periods = [
        {
          name: '대기 상태 평가',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '대기 상태 테스트용 평가 기간',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '진행 중 평가',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '진행 중 테스트용 평가 기간',
          maxSelfEvaluationRate: 110,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '완료된 평가',
          startDate: '2024-07-01',
          peerEvaluationDeadline: '2024-09-30',
          description: '완료 테스트용 평가 기간',
          maxSelfEvaluationRate: 120,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
      ];

      const createdPeriods: any[] = [];
      for (const period of periods) {
        const createResponse = await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
        createdPeriods.push(createResponse.body);
      }

      // 두 번째 평가 기간 시작 (진행 중 상태로 변경)
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${createdPeriods[1].id}/start`)
        .expect(200);

      // 세 번째 평가 기간 시작 후 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${createdPeriods[2].id}/start`)
        .expect(200);

      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${createdPeriods[2].id}/complete`)
        .expect(200);

      // When & Then: 모든 상태의 평가 기간이 목록에 포함되는지 확인
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.total).toBe(3);
      expect(response.body.items).toHaveLength(3);

      // 각 상태별로 평가 기간이 존재하는지 확인
      const waitingPeriod = response.body.items.find(
        (item: any) => item.name === '대기 상태 평가',
      );
      const inProgressPeriod = response.body.items.find(
        (item: any) => item.name === '진행 중 평가',
      );
      const completedPeriod = response.body.items.find(
        (item: any) => item.name === '완료된 평가',
      );

      expect(waitingPeriod).toBeDefined();
      expect(waitingPeriod.status).toBe('waiting');

      expect(inProgressPeriod).toBeDefined();
      expect(inProgressPeriod.status).toBe('in-progress');

      expect(completedPeriod).toBeDefined();
      expect(completedPeriod.status).toBe('completed');
    });

    it('매우 큰 데이터셋에서도 페이징이 정상 작동해야 한다', async () => {
      // Given: 15개의 평가 기간 생성 (겹치지 않는 날짜로 설정)
      const periods = Array.from({ length: 15 }, (_, index) => {
        const year = 2020 + Math.floor(index / 4); // 4개씩 연도별로 분배
        const quarter = (index % 4) + 1; // 1~4분기
        const startMonth = (quarter - 1) * 3 + 1; // 1, 4, 7, 10월
        const endMonth = startMonth + 2; // 3, 6, 9, 12월

        return {
          name: `대용량 테스트 평가 ${String(index + 1).padStart(2, '0')}`,
          startDate: `${year}-${String(startMonth).padStart(2, '0')}-01`,
          peerEvaluationDeadline: `${year}-${String(endMonth).padStart(2, '0')}-28`,
          description: `대용량 테스트용 평가 기간 ${index + 1}`,
          maxSelfEvaluationRate: 100 + (index % 5) * 10,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        };
      });

      for (const period of periods) {
        await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
      }

      // When & Then: 다양한 페이지 크기로 페이징 테스트
      // 페이지 크기 5로 3페이지 조회
      const responses: any[] = [];
      for (let page = 1; page <= 3; page++) {
        const response = await testSuite
          .request()
          .get('/admin/evaluation-periods')
          .query({ page, limit: 5 })
          .expect(200);

        responses.push(response.body);
        expect(response.body.total).toBe(15);
        expect(response.body.page).toBe(page);
        expect(response.body.limit).toBe(5);
        expect(response.body.items).toHaveLength(5);
      }

      // 모든 페이지의 ID가 고유한지 확인
      const allIds = responses.flatMap((response) =>
        response.items.map((item: any) => item.id),
      );
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(15);

      // 마지막 페이지 (4페이지) 확인
      const lastPageResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 4, limit: 5 })
        .expect(200);

      expect(lastPageResponse.body.total).toBe(15);
      expect(lastPageResponse.body.items).toHaveLength(0); // 4페이지는 빈 페이지
    });

    it('특수한 이름을 가진 평가 기간도 정상 조회되어야 한다', async () => {
      // Given: 특수 문자가 포함된 이름의 평가 기간 생성
      const periods = [
        {
          name: '특수문자 테스트 !@#$%^&*()',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '특수 문자 포함 테스트',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '한글 평가 기간 테스트',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '한글 이름 테스트',
          maxSelfEvaluationRate: 110,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: 'English Evaluation Period',
          startDate: '2024-07-01',
          peerEvaluationDeadline: '2024-09-30',
          description: 'English name test',
          maxSelfEvaluationRate: 120,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
      ];

      for (const period of periods) {
        await testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
      }

      // When & Then: 특수 이름들이 모두 정상 조회되는지 확인
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.total).toBe(3);
      expect(response.body.items).toHaveLength(3);

      const names = response.body.items.map((item: any) => item.name);
      expect(names).toContain('특수문자 테스트 !@#$%^&*()');
      expect(names).toContain('한글 평가 기간 테스트');
      expect(names).toContain('English Evaluation Period');
    });
  });
});
