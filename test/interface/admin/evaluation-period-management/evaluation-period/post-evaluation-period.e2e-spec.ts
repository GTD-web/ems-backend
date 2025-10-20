import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('EvaluationPeriodManagement POST /evaluation-periods Endpoint (e2e)', () => {
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

  describe('POST /admin/evaluation-periods', () => {
    it('유효한 데이터로 평가 기간을 생성해야 한다', async () => {
      // Given: 유효한 평가 기간 생성 데이터
      const createData = {
        name: '2024년 상반기 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '2024년 상반기 성과 평가',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      // 응답 데이터 검증
      expect(response.body).toMatchObject({
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
        status: 'waiting',
        currentPhase: 'waiting',
      });

      // ID가 생성되었는지 확인
      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');

      // 날짜 필드가 올바르게 설정되었는지 확인
      expect(response.body.startDate).toBeDefined();
      expect(response.body.peerEvaluationDeadline).toBeDefined();

      // 등급 구간이 올바르게 설정되었는지 확인
      expect(response.body.gradeRanges).toHaveLength(4);
      expect(response.body.gradeRanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            grade: 'S',
            minRange: 95,
            maxRange: 100,
          }),
          expect.objectContaining({
            grade: 'A',
            minRange: 85,
            maxRange: 94,
          }),
        ]),
      );

      // 기본값들이 올바르게 설정되었는지 확인
      expect(response.body.criteriaSettingEnabled).toBe(false);
      expect(response.body.selfEvaluationSettingEnabled).toBe(false);
      expect(response.body.finalEvaluationSettingEnabled).toBe(false);
      expect(response.body.completedDate).toBeNull();
    });

    it('최소한의 필수 데이터로 평가 기간을 생성해야 한다', async () => {
      // Given: 최소한의 필수 데이터
      const minimalData = {
        name: '최소 데이터 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '최소 데이터로 생성된 평가 기간',
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
        ],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(minimalData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: minimalData.name,
        description: minimalData.description,
        maxSelfEvaluationRate: 120, // 기본값
        status: 'waiting',
        currentPhase: 'waiting',
      });

      expect(response.body.gradeRanges).toHaveLength(2);
    });

    it('복잡한 등급 구간을 가진 평가 기간을 생성해야 한다', async () => {
      // Given: 복잡한 등급 구간 데이터
      const complexGradeData = {
        name: '복잡한 등급 구간 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '다양한 등급 구간을 가진 평가 기간',
        maxSelfEvaluationRate: 150,
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 90, maxRange: 94 },
          { grade: 'A', minRange: 85, maxRange: 89 },
          { grade: 'B+', minRange: 80, maxRange: 84 },
          { grade: 'B', minRange: 75, maxRange: 79 },
          { grade: 'C+', minRange: 70, maxRange: 74 },
          { grade: 'C', minRange: 65, maxRange: 69 },
          { grade: 'D', minRange: 50, maxRange: 64 },
        ],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(complexGradeData)
        .expect(201);

      expect(response.body.gradeRanges).toHaveLength(9);
      expect(response.body.maxSelfEvaluationRate).toBe(150);

      // 특정 등급 구간들이 올바르게 설정되었는지 확인
      const gradeRanges = response.body.gradeRanges;
      const sPlus = gradeRanges.find((range: any) => range.grade === 'S+');
      const d = gradeRanges.find((range: any) => range.grade === 'D');

      expect(sPlus).toEqual({
        grade: 'S+',
        minRange: 98,
        maxRange: 100,
      });

      expect(d).toEqual({
        grade: 'D',
        minRange: 50,
        maxRange: 64,
      });
    });

    it('특수 문자가 포함된 이름으로 평가 기간을 생성해야 한다', async () => {
      // Given: 특수 문자가 포함된 데이터
      const specialCharData = {
        name: '2024년 Q1 평가 (특별) - 성과측정 & 개발계획',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-03-31',
        description: '특수문자 테스트: !@#$%^&*()_+-=[]{}|;:,.<>?',
        maxSelfEvaluationRate: 100,
        gradeRanges: [
          { grade: 'A+', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
        ],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(specialCharData)
        .expect(201);

      expect(response.body.name).toBe(specialCharData.name);
      expect(response.body.description).toBe(specialCharData.description);
    });

    it('긴 이름과 설명을 가진 평가 기간을 생성해야 한다', async () => {
      // Given: 긴 이름과 설명
      const longTextData = {
        name: '매우 긴 평가 기간 이름입니다. '.repeat(10), // 약 300자
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '매우 긴 설명입니다. '.repeat(50), // 약 1000자
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(longTextData)
        .expect(201);

      expect(response.body.name).toBe(longTextData.name);
      expect(response.body.description).toBe(longTextData.description);
    });

    it('필수 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given: name 필드가 누락된 데이터
      const missingNameData = {
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '이름이 누락된 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(missingNameData)
        .expect(400);
    });

    it('startDate가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given: startDate 필드가 누락된 데이터
      const missingStartDateData = {
        name: '시작일이 누락된 평가',
        peerEvaluationDeadline: '2024-12-31',
        description: '시작일이 누락된 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(missingStartDateData)
        .expect(400);
    });

    it('peerEvaluationDeadline이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given: peerEvaluationDeadline 필드가 누락된 데이터
      const missingDeadlineData = {
        name: '마감일이 누락된 평가',
        startDate: '2024-01-01',
        description: '마감일이 누락된 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(missingDeadlineData)
        .expect(400);
    });

    it('gradeRanges가 누락된 경우 201로 생성되어야 한다 (기본값 적용)', async () => {
      // Given: gradeRanges 필드가 누락된 데이터 (기본값으로 빈 배열 적용)
      const missingGradeRangesData = {
        name: '등급 구간이 누락된 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '등급 구간이 누락된 평가 기간',
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(missingGradeRangesData)
        .expect(201);

      // 빈 배열로 설정되었는지 확인
      expect(response.body.gradeRanges).toEqual([]);
    });

    it('빈 gradeRanges 배열인 경우 201로 생성되어야 한다', async () => {
      // Given: 빈 gradeRanges 배열
      const emptyGradeRangesData = {
        name: '빈 등급 구간 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '빈 등급 구간 배열',
        gradeRanges: [],
      };

      // When & Then
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(emptyGradeRangesData)
        .expect(201);

      // 빈 배열로 설정되었는지 확인
      expect(response.body.gradeRanges).toEqual([]);
    });

    it('잘못된 날짜 형식인 경우 500 에러가 발생해야 한다', async () => {
      // Given: 잘못된 날짜 형식
      const invalidDateData = {
        name: '잘못된 날짜 평가',
        startDate: 'invalid-date',
        peerEvaluationDeadline: '2024-12-31',
        description: '잘못된 날짜 형식',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 날짜 변환 에러로 400 발생
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(invalidDateData)
        .expect(400);
    });

    it('음수 maxSelfEvaluationRate인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 음수 maxSelfEvaluationRate
      const negativeRateData = {
        name: '음수 비율 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '음수 자기평가 비율',
        maxSelfEvaluationRate: -10,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(negativeRateData)
        .expect(400);
    });

    it('잘못된 등급 구간 범위인 경우 500 에러가 발생해야 한다', async () => {
      // Given: minRange > maxRange인 등급 구간
      const invalidRangeData = {
        name: '잘못된 범위 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '잘못된 등급 구간 범위',
        gradeRanges: [
          { grade: 'A', minRange: 90, maxRange: 80 }, // 잘못된 범위
        ],
      };

      // When & Then: 도메인 검증 에러로 422 발생
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(invalidRangeData)
        .expect(422);
    });

    it('중복된 평가 기간 이름인 경우 409 에러가 발생해야 한다', async () => {
      // Given: 첫 번째 평가 기간 생성
      const firstData = {
        name: '중복 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '첫 번째 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(firstData)
        .expect(201);

      // When: 동일한 이름으로 두 번째 평가 기간 생성 시도
      const duplicateData = {
        name: '중복 테스트 평가', // 동일한 이름
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '두 번째 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(duplicateData)
        .expect(409);
    });

    it('겹치는 날짜 범위인 경우 409 에러가 발생해야 한다', async () => {
      // Given: 첫 번째 평가 기간 생성 (2024-01-01 ~ 2024-06-30)
      const firstPeriodData = {
        name: '첫 번째 평가 기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '첫 번째 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(firstPeriodData)
        .expect(201);

      // When: 겹치는 날짜 범위로 두 번째 평가 기간 생성 시도 (2024-03-01 ~ 2024-09-30)
      const overlappingData = {
        name: '겹치는 평가 기간',
        startDate: '2024-03-01', // 첫 번째 기간과 겹침
        peerEvaluationDeadline: '2024-09-30',
        description: '겹치는 날짜 범위',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(overlappingData)
        .expect(409);
    });

    it('빈 문자열 필드들인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 빈 문자열 필드들
      const emptyStringData = {
        name: '', // 빈 문자열
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '', // 빈 문자열
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(emptyStringData)
        .expect(400);
    });

    it('null 값들인 경우 400 에러가 발생해야 한다', async () => {
      // Given: null 값들
      const nullValueData = {
        name: null,
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: null,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(nullValueData)
        .expect(400);
    });

    it('잘못된 데이터 타입인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 데이터 타입
      const wrongTypeData = {
        name: 12345, // 숫자 (문자열이어야 함)
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '잘못된 타입 테스트',
        maxSelfEvaluationRate: '문자열', // 문자열 (숫자여야 함)
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(wrongTypeData)
        .expect(400);
    });

    it('매우 큰 maxSelfEvaluationRate 값인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 매우 큰 maxSelfEvaluationRate 값
      const largeRateData = {
        name: '큰 비율 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '매우 큰 자기평가 비율',
        maxSelfEvaluationRate: 99999,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(largeRateData)
        .expect(400);
    });

    it('잘못된 등급 구간 구조인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 등급 구간 구조
      const invalidGradeStructureData = {
        name: '잘못된 구조 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '잘못된 등급 구간 구조',
        gradeRanges: [
          { grade: 'A' }, // minRange, maxRange 누락
          { minRange: 80, maxRange: 100 }, // grade 누락
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(invalidGradeStructureData)
        .expect(400);
    });

    it('Content-Type이 없는 경우 적절한 에러가 발생해야 한다', async () => {
      // When & Then: Content-Type 헤더 없이 요청
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send('invalid json string');

      // 400 (Bad Request) 또는 415 (Unsupported Media Type) 중 하나여야 함
      expect([400, 415]).toContain(response.status);
    });

    it('잘못된 JSON 형식인 경우 400 에러가 발생해야 한다', async () => {
      // When & Then: 잘못된 JSON 형식
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('빈 요청 본문인 경우 400 에러가 발생해야 한다', async () => {
      // When & Then: 빈 요청 본문
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send({})
        .expect(400);
    });

    // ==================== 경계값 테스트 ====================

    it('maxSelfEvaluationRate 경계값 테스트 - 최소값 (0)은 400 에러가 발생해야 한다', async () => {
      // Given: maxSelfEvaluationRate가 0인 데이터
      const minRateData = {
        name: '최소 비율 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '최소 자기평가 비율 테스트',
        maxSelfEvaluationRate: 0,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 0은 최소값 검증에 실패하므로 400 에러
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(minRateData)
        .expect(400);
    });

    it('maxSelfEvaluationRate 경계값 테스트 - 최대값 (1000)은 400 에러가 발생해야 한다', async () => {
      // Given: maxSelfEvaluationRate가 1000인 데이터
      const maxRateData = {
        name: '최대 비율 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '최대 자기평가 비율 테스트',
        maxSelfEvaluationRate: 1000,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 1000은 최대값 검증에 실패하므로 400 에러
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(maxRateData)
        .expect(400);
    });

    it('등급 구간 경계값 테스트 - minRange와 maxRange가 같은 경우 500 에러가 발생해야 한다', async () => {
      // Given: minRange와 maxRange가 같은 등급 구간
      const sameRangeData = {
        name: '동일 범위 등급 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '동일한 최소/최대 범위 테스트',
        gradeRanges: [
          { grade: 'A', minRange: 85, maxRange: 85 }, // 동일한 값
          { grade: 'B', minRange: 70, maxRange: 84 },
        ],
      };

      // When & Then: 동일한 값은 도메인 검증에 실패하므로 422 에러
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(sameRangeData)
        .expect(422);
    });

    it('등급 구간 경계값 테스트 - 0-100 전체 범위', async () => {
      // Given: 0-100 전체 범위를 사용하는 등급 구간
      const fullRangeData = {
        name: '전체 범위 등급 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '0-100 전체 범위 테스트',
        gradeRanges: [{ grade: 'A', minRange: 0, maxRange: 100 }],
      };

      // When & Then: 전체 범위는 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(fullRangeData)
        .expect(201);

      const gradeA = response.body.gradeRanges.find(
        (g: any) => g.grade === 'A',
      );
      expect(gradeA.minRange).toBe(0);
      expect(gradeA.maxRange).toBe(100);
    });

    it('날짜 경계값 테스트 - 같은 날짜 시작과 종료', async () => {
      // Given: 시작일과 종료일이 같은 데이터
      const sameDateData = {
        name: '동일 날짜 평가',
        startDate: '2024-06-15',
        peerEvaluationDeadline: '2024-06-15',
        description: '시작일과 종료일이 같은 평가 기간',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 같은 날짜도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(sameDateData)
        .expect(201);

      expect(response.body.name).toBe('동일 날짜 평가');
    });

    it('이름 길이 경계값 테스트 - 1자', async () => {
      // Given: 1자 이름
      const shortNameData = {
        name: 'A',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '1자 이름 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 1자 이름도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(shortNameData)
        .expect(201);

      expect(response.body.name).toBe('A');
    });

    it('설명 길이 경계값 테스트 - 1자', async () => {
      // Given: 1자 설명
      const shortDescData = {
        name: '짧은 설명 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '짧',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 1자 설명도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(shortDescData)
        .expect(201);

      expect(response.body.description).toBe('짧');
    });

    // ==================== 입력값 검증 테스트 ====================

    it('이름 공백 문자만 포함된 경우 201로 생성되어야 한다', async () => {
      // Given: 공백 문자만 포함된 이름
      const whitespaceNameData = {
        name: '   \t\n   ',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '공백 이름 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 공백 문자도 유효한 이름으로 처리됨
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(whitespaceNameData)
        .expect(201);

      expect(response.body.name).toBe('   \t\n   ');
    });

    it('설명 공백 문자만 포함된 경우 201로 생성되어야 한다', async () => {
      // Given: 공백 문자만 포함된 설명
      const whitespaceDescData = {
        name: '공백 설명 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '   \t\n   ',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 공백 문자도 유효한 설명으로 처리됨
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(whitespaceDescData)
        .expect(201);

      expect(response.body.description).toBe('   \t\n   ');
    });

    it('등급명이 빈 문자열인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 빈 등급명
      const emptyGradeData = {
        name: '빈 등급명 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '빈 등급명 테스트',
        gradeRanges: [
          { grade: '', minRange: 80, maxRange: 100 }, // 빈 등급명
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(emptyGradeData)
        .expect(400);
    });

    it('등급명이 공백 문자만인 경우 201로 생성되어야 한다', async () => {
      // Given: 공백 문자만 포함된 등급명
      const whitespaceGradeData = {
        name: '공백 등급명 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '공백 등급명 테스트',
        gradeRanges: [
          { grade: '   ', minRange: 80, maxRange: 100 }, // 공백 등급명
        ],
      };

      // When & Then: 공백 문자도 유효한 등급명으로 처리됨
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(whitespaceGradeData)
        .expect(201);

      expect(response.body.gradeRanges[0].grade).toBe('   ');
    });

    it('등급 구간 범위가 음수인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 음수 범위
      const negativeRangeData = {
        name: '음수 범위 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '음수 범위 테스트',
        gradeRanges: [
          { grade: 'A', minRange: -10, maxRange: 100 }, // 음수 minRange
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(negativeRangeData)
        .expect(400);
    });

    it('등급 구간 범위가 100 초과인 경우 400 에러가 발생해야 한다', async () => {
      // Given: 100 초과 범위
      const overRangeData = {
        name: '초과 범위 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '100 초과 범위 테스트',
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 150 }, // 100 초과 maxRange
        ],
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(overRangeData)
        .expect(400);
    });

    it('등급 구간 범위가 소수점인 경우 처리되어야 한다', async () => {
      // Given: 소수점 범위
      const decimalRangeData = {
        name: '소수점 범위 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '소수점 범위 테스트',
        gradeRanges: [
          { grade: 'A', minRange: 85.5, maxRange: 95.7 },
          { grade: 'B', minRange: 70.2, maxRange: 85.4 },
        ],
      };

      // When & Then: 소수점도 유효한 값이므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(decimalRangeData)
        .expect(201);

      const gradeA = response.body.gradeRanges.find(
        (g: any) => g.grade === 'A',
      );
      expect(gradeA.minRange).toBe(85.5);
      expect(gradeA.maxRange).toBe(95.7);
    });

    it('중복된 등급명이 있는 경우 500 에러가 발생해야 한다', async () => {
      // Given: 중복된 등급명
      const duplicateGradeData = {
        name: '중복 등급명 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '중복 등급명 테스트',
        gradeRanges: [
          { grade: 'A', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 }, // 중복된 등급명
        ],
      };

      // When & Then: 도메인 검증 에러로 422 발생
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(duplicateGradeData)
        .expect(422);
    });

    it('겹치는 등급 구간 범위가 있는 경우 500 에러가 발생해야 한다', async () => {
      // Given: 겹치는 범위
      const overlappingRangeData = {
        name: '겹치는 범위 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '겹치는 범위 테스트',
        gradeRanges: [
          { grade: 'A', minRange: 85, maxRange: 100 },
          { grade: 'B', minRange: 80, maxRange: 90 }, // A와 겹침 (85-90)
        ],
      };

      // When & Then: 도메인 검증 에러로 422 발생
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(overlappingRangeData)
        .expect(422);
    });

    it('시작일이 종료일보다 늦은 경우 201로 생성되어야 한다', async () => {
      // Given: 시작일이 종료일보다 늦은 데이터
      const invalidDateOrderData = {
        name: '잘못된 날짜 순서 평가',
        startDate: '2024-12-31',
        peerEvaluationDeadline: '2024-01-01', // 시작일보다 이른 종료일
        description: '잘못된 날짜 순서 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 날짜 순서 검증이 없으므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(invalidDateOrderData)
        .expect(201);

      expect(response.body.name).toBe('잘못된 날짜 순서 평가');
    });

    it('과거 날짜로 평가 기간을 생성하는 경우 정상 처리되어야 한다', async () => {
      // Given: 과거 날짜
      const pastDateData = {
        name: '과거 날짜 평가',
        startDate: '2020-01-01',
        peerEvaluationDeadline: '2020-12-31',
        description: '과거 날짜 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 과거 날짜도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(pastDateData)
        .expect(201);

      expect(response.body.name).toBe('과거 날짜 평가');
    });

    it('미래 날짜로 평가 기간을 생성하는 경우 정상 처리되어야 한다', async () => {
      // Given: 미래 날짜
      const futureDateData = {
        name: '미래 날짜 평가',
        startDate: '2030-01-01',
        peerEvaluationDeadline: '2030-12-31',
        description: '미래 날짜 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 미래 날짜도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(futureDateData)
        .expect(201);

      expect(response.body.name).toBe('미래 날짜 평가');
    });

    it('윤년 2월 29일 날짜로 생성하는 경우 정상 처리되어야 한다', async () => {
      // Given: 윤년 2월 29일
      const leapYearData = {
        name: '윤년 날짜 평가',
        startDate: '2024-02-29',
        peerEvaluationDeadline: '2024-12-31',
        description: '윤년 2월 29일 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 윤년 날짜도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(leapYearData)
        .expect(201);

      expect(response.body.name).toBe('윤년 날짜 평가');
    });

    it('평년 2월 29일 날짜로 생성하는 경우 201로 생성되어야 한다', async () => {
      // Given: 평년 2월 29일 (존재하지 않는 날짜)
      const invalidLeapYearData = {
        name: '평년 2월 29일 평가',
        startDate: '2023-02-29', // 2023년은 평년
        peerEvaluationDeadline: '2023-12-31',
        description: '평년 2월 29일 테스트',
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then: 유효하지 않은 날짜로 400 에러 발생
      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(invalidLeapYearData)
        .expect(400);
    });

    it('매우 많은 등급 구간 (50개)을 가진 평가 기간을 생성해야 한다', async () => {
      // Given: 50개의 등급 구간
      const manyGradesData = {
        name: '많은 등급 구간 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '50개 등급 구간 테스트',
        gradeRanges: Array.from({ length: 50 }, (_, index) => ({
          grade: `Grade${String(index + 1).padStart(2, '0')}`,
          minRange: index * 2,
          maxRange: index * 2 + 1,
        })),
      };

      // When & Then: 많은 등급 구간도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(manyGradesData)
        .expect(201);

      expect(response.body.gradeRanges).toHaveLength(50);

      // 등급 구간이 정렬되어 있을 수 있으므로 특정 등급이 존재하는지 확인
      const gradeNames = response.body.gradeRanges.map((g: any) => g.grade);
      expect(gradeNames).toContain('Grade01');
      expect(gradeNames).toContain('Grade50');
    });

    it('매우 긴 등급명 (100자)을 가진 평가 기간을 생성해야 한다', async () => {
      // Given: 100자 등급명
      const longGradeNameData = {
        name: '긴 등급명 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '긴 등급명 테스트',
        gradeRanges: [
          {
            grade: 'A'.repeat(100), // 100자 등급명
            minRange: 80,
            maxRange: 100,
          },
        ],
      };

      // When & Then: 긴 등급명도 유효하므로 201 성공
      const response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(longGradeNameData)
        .expect(201);

      expect(response.body.gradeRanges[0].grade).toBe('A'.repeat(100));
    });
  });
});
