import { BaseE2ETest } from '../../../../base-e2e.spec';
import { FinalEvaluationScenario } from './final-evaluation.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';

describe('최종평가 시나리오', () => {
  let testSuite: BaseE2ETest;
  let finalEvaluationScenario: FinalEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let employeeId: string;
  let otherEmployeeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    finalEvaluationScenario = new FinalEvaluationScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    employeeId = employeeIds[0];
    otherEmployeeId = employeeIds[1];

    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '최종평가 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '최종평가 E2E 테스트용 평가기간',
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
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);
  });

  describe('시나리오 1: 최종평가 저장 (Upsert)', () => {
    it('기본 최종평가를 저장(생성)할 수 있어야 한다', async () => {
      // When
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // Then
      expect(저장결과.id).toBeDefined();
      expect(저장결과.message).toBeDefined();
      expect(저장결과.message).toContain('성공적으로');

      // 조회로 검증
      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      expect(상세정보.id).toBe(저장결과.id);
      expect(상세정보.evaluationGrade).toBe('A');
      expect(상세정보.jobGrade).toBe('T2');
      expect(상세정보.jobDetailedGrade).toBe('n');
      expect(상세정보.isConfirmed).toBe(false);
      expect(상세정보.confirmedAt).toBeNull();
      expect(상세정보.confirmedBy).toBeNull();
    });

    it('최종평가 의견을 포함하여 저장할 수 있어야 한다', async () => {
      // When
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
        finalComments: '전반적으로 우수한 성과를 보였습니다.',
      });

      // Then
      expect(저장결과.id).toBeDefined();

      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      expect(상세정보.finalComments).toBe(
        '전반적으로 우수한 성과를 보였습니다.',
      );
    });

    it('이미 존재하는 평가를 수정(Upsert)할 수 있어야 한다', async () => {
      // Given - 초기 저장
      const 초기저장 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'n',
        finalComments: '초기 의견',
      });

      // When - 수정 (Upsert)
      const 수정결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'a',
        finalComments: '수정된 의견',
      });

      // Then
      expect(수정결과.id).toBe(초기저장.id); // 같은 ID여야 함

      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(초기저장.id);

      expect(상세정보.evaluationGrade).toBe('A');
      expect(상세정보.jobGrade).toBe('T2');
      expect(상세정보.jobDetailedGrade).toBe('a');
      expect(상세정보.finalComments).toBe('수정된 의견');
    });

    it('다양한 평가등급으로 저장할 수 있어야 한다', async () => {
      // When
      const 등급S = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[0],
        periodId: evaluationPeriodId,
        evaluationGrade: 'S',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
      });

      const 등급A = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[1],
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'a',
      });

      const 등급B = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[2],
        periodId: evaluationPeriodId,
        evaluationGrade: 'B',
        jobGrade: 'T3',
        jobDetailedGrade: 'n',
      });

      // Then
      expect(등급S.id).toBeDefined();
      expect(등급A.id).toBeDefined();
      expect(등급B.id).toBeDefined();

      const S상세 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(등급S.id);
      const A상세 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(등급A.id);
      const B상세 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(등급B.id);

      expect(S상세.evaluationGrade).toBe('S');
      expect(A상세.evaluationGrade).toBe('A');
      expect(B상세.evaluationGrade).toBe('B');
    });

    it('같은 직원-평가기간 조합에 하나의 평가만 존재해야 한다', async () => {
      // Given - 첫 번째 저장
      const 첫저장 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T1',
        jobDetailedGrade: 'n',
      });

      // When - 같은 조합으로 다시 저장
      const 두번째저장 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'B',
        jobGrade: 'T2',
        jobDetailedGrade: 'a',
      });

      // Then - 같은 ID여야 함 (수정된 것)
      expect(두번째저장.id).toBe(첫저장.id);

      // 목록 조회로 확인
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        employeeId,
        periodId: evaluationPeriodId,
      });

      expect(목록.evaluations.length).toBe(1);
      expect(목록.evaluations[0].id).toBe(첫저장.id);
      expect(목록.evaluations[0].evaluationGrade).toBe('B'); // 수정된 값
    });

    it('잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/invalid-uuid/period/${evaluationPeriodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T1',
          jobDetailedGrade: 'n',
        })
        .expect(400);
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // When & Then - evaluationGrade 누락
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${evaluationPeriodId}`,
        )
        .send({
          jobGrade: 'T1',
          jobDetailedGrade: 'n',
        })
        .expect(400);

      // jobGrade 누락
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${evaluationPeriodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobDetailedGrade: 'n',
        })
        .expect(400);

      // jobDetailedGrade 누락
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${evaluationPeriodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T1',
        })
        .expect(400);
    });
  });

  describe('시나리오 2: 최종평가 확정', () => {
    let 평가Id: string;

    beforeEach(async () => {
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });
      평가Id = 저장결과.id;
    });

    it('기본 최종평가를 확정할 수 있어야 한다', async () => {
      // When
      const 확정결과 = await finalEvaluationScenario.최종평가를_확정한다(평가Id);

      // Then
      expect(확정결과.message).toBeDefined();
      expect(확정결과.message).toContain('확정');

      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      expect(상세정보.isConfirmed).toBe(true);
      expect(상세정보.confirmedAt).not.toBeNull();
      expect(상세정보.confirmedBy).not.toBeNull();
    });

    it('확정 후 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const 확정전 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      // 약간의 시간 대기 (millisecond 차이를 보장하기 위해)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      await finalEvaluationScenario.최종평가를_확정한다(평가Id);

      // Then
      const 확정후 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      expect(new Date(확정후.updatedAt).getTime()).toBeGreaterThan(
        new Date(확정전.updatedAt).getTime(),
      );
      // createdAt은 변경되지 않음 (밀리초 단위 차이는 허용)
      const createdAtDiff = Math.abs(
        new Date(확정후.createdAt).getTime() -
          new Date(확정전.createdAt).getTime(),
      );
      expect(createdAtDiff).toBeLessThan(1000); // 1초 이내 차이 허용
    });

    it('이미 확정된 평가를 다시 확정 시 409 에러가 발생해야 한다', async () => {
      // Given - 확정
      await finalEvaluationScenario.최종평가를_확정한다(평가Id);

      // When & Then - 재확정 시도
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/${평가Id}/confirm`,
        )
        .expect(409);
    });

    it('존재하지 않는 평가 확정 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/final-evaluations/00000000-0000-0000-0000-000000000000/confirm',
        )
        .expect(404);
    });

    it('잘못된 형식의 평가 ID로 확정 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/final-evaluations/invalid-uuid/confirm',
        )
        .expect(400);
    });
  });

  describe('시나리오 3: 최종평가 확정 취소', () => {
    let 평가Id: string;

    beforeEach(async () => {
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });
      평가Id = 저장결과.id;

      // 확정 처리
      await finalEvaluationScenario.최종평가를_확정한다(평가Id);
    });

    it('확정된 최종평가의 확정을 취소할 수 있어야 한다', async () => {
      // When
      const 취소결과 =
        await finalEvaluationScenario.최종평가_확정을_취소한다(평가Id);

      // Then
      expect(취소결과.message).toBeDefined();
      expect(취소결과.message).toContain('취소');

      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      expect(상세정보.isConfirmed).toBe(false);
      expect(상세정보.confirmedAt).toBeNull();
      expect(상세정보.confirmedBy).toBeNull();
    });

    it('확정 취소 후 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const 취소전 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      await finalEvaluationScenario.최종평가_확정을_취소한다(평가Id);

      // Then
      const 취소후 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      expect(new Date(취소후.updatedAt).getTime()).toBeGreaterThan(
        new Date(취소전.updatedAt).getTime(),
      );
    });

    it('확정 취소 후 다시 수정이 가능해야 한다', async () => {
      // Given - 확정 취소
      await finalEvaluationScenario.최종평가_확정을_취소한다(평가Id);

      // When - 수정 시도
      const 수정결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
        finalComments: '수정된 내용',
      });

      // Then
      expect(수정결과.id).toBe(평가Id);

      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(평가Id);

      expect(상세정보.evaluationGrade).toBe('S');
      expect(상세정보.jobGrade).toBe('T3');
      expect(상세정보.finalComments).toBe('수정된 내용');
    });

    it('확정되지 않은 평가의 확정 취소 시 422 에러가 발생해야 한다', async () => {
      // Given - 새로운 미확정 평가 생성
      const 미확정평가 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: otherEmployeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'n',
      });

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/${미확정평가.id}/cancel-confirmation`,
        )
        .expect(422);
    });

    it('존재하지 않는 평가 확정 취소 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/final-evaluations/00000000-0000-0000-0000-000000000000/cancel-confirmation',
        )
        .expect(404);
    });
  });

  describe('시나리오 4: 최종평가 조회', () => {
    it('ID로 단일 조회할 수 있어야 한다', async () => {
      // Given
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        finalComments: '우수한 성과',
      });

      // When
      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      // Then
      expect(상세정보.id).toBe(저장결과.id);
      expect(상세정보.evaluationGrade).toBe('A');
      expect(상세정보.jobGrade).toBe('T2');
      expect(상세정보.jobDetailedGrade).toBe('n');
      expect(상세정보.finalComments).toBe('우수한 성과');
      expect(상세정보.isConfirmed).toBe(false);
    });

    it('직원 정보가 객체로 반환되어야 한다', async () => {
      // Given
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When
      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      // Then
      expect(상세정보.employee).toBeDefined();
      expect(typeof 상세정보.employee).toBe('object');
      expect(상세정보.employee.id).toBe(employeeId);
      expect(상세정보.employee.name).toBeDefined();
      expect(상세정보.employee.employeeNumber).toBeDefined();
    });

    it('평가기간 정보가 객체로 반환되어야 한다', async () => {
      // Given
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When
      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      // Then
      expect(상세정보.period).toBeDefined();
      expect(typeof 상세정보.period).toBe('object');
      expect(상세정보.period.id).toBe(evaluationPeriodId);
      expect(상세정보.period.name).toBeDefined();
      expect(상세정보.period.startDate).toBeDefined();
      expect(상세정보.period.status).toBeDefined();
    });

    it('미확정 평가는 확정 정보가 null이어야 한다', async () => {
      // Given
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When
      const 상세정보 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      // Then
      expect(상세정보.isConfirmed).toBe(false);
      expect(상세정보.confirmedAt).toBeNull();
      expect(상세정보.confirmedBy).toBeNull();
    });

    it('존재하지 않는 평가 조회 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get(
          '/admin/performance-evaluation/final-evaluations/00000000-0000-0000-0000-000000000000',
        )
        .expect(404);
    });

    it('잘못된 형식의 평가 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations/invalid-uuid')
        .expect(400);
    });
  });

  describe('시나리오 5: 최종평가 목록 조회', () => {
    beforeEach(async () => {
      // 여러 평가 생성
      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[0],
        periodId: evaluationPeriodId,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
      });

      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[1],
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'a',
      });

      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[2],
        periodId: evaluationPeriodId,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'n',
      });
    });

    it('기본 목록을 조회할 수 있어야 한다', async () => {
      // When
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다();

      // Then
      expect(목록.evaluations).toBeDefined();
      expect(Array.isArray(목록.evaluations)).toBe(true);
      expect(목록.evaluations.length).toBeGreaterThan(0);
      expect(목록.total).toBeDefined();
      expect(목록.page).toBeDefined();
      expect(목록.limit).toBeDefined();
    });

    it('페이지네이션이 작동해야 한다', async () => {
      // When
      const 첫페이지 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        page: 1,
        limit: 2,
      });

      const 두번째페이지 =
        await finalEvaluationScenario.최종평가_목록을_조회한다({
          page: 2,
          limit: 2,
        });

      // Then
      expect(첫페이지.page).toBe(1);
      expect(첫페이지.limit).toBe(2);
      expect(첫페이지.evaluations.length).toBeLessThanOrEqual(2);

      if (첫페이지.total > 2) {
        expect(두번째페이지.page).toBe(2);
        expect(두번째페이지.evaluations.length).toBeLessThanOrEqual(2);
      }
    });

    it('employeeId로 필터링할 수 있어야 한다', async () => {
      // When
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        employeeId: employeeIds[0],
      });

      // Then
      expect(목록.evaluations.length).toBeGreaterThan(0);
      목록.evaluations.forEach((평가: any) => {
        expect(평가.employee.id).toBe(employeeIds[0]);
      });
    });

    it('periodId로 필터링할 수 있어야 한다', async () => {
      // When
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        periodId: evaluationPeriodId,
      });

      // Then
      expect(목록.evaluations.length).toBeGreaterThan(0);
      목록.evaluations.forEach((평가: any) => {
        expect(평가.period.id).toBe(evaluationPeriodId);
      });
    });

    it('evaluationGrade로 필터링할 수 있어야 한다', async () => {
      // When
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        evaluationGrade: 'A',
      });

      // Then
      if (목록.evaluations.length > 0) {
        목록.evaluations.forEach((평가: any) => {
          expect(평가.evaluationGrade).toBe('A');
        });
      }
    });

    it('confirmedOnly로 필터링할 수 있어야 한다', async () => {
      // Given - 하나를 확정 처리
      const 평가 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId: employeeIds[3],
        periodId: evaluationPeriodId,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
      });

      await finalEvaluationScenario.최종평가를_확정한다(평가.id);

      // When
      const 확정목록 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        confirmedOnly: true,
      });

      // Then
      expect(확정목록.evaluations.length).toBeGreaterThan(0);
      확정목록.evaluations.forEach((평가: any) => {
        expect(평가.isConfirmed).toBe(true);
      });
    });

    it('직원 정보가 객체로 반환되어야 한다', async () => {
      // When
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다();

      // Then
      expect(목록.evaluations.length).toBeGreaterThan(0);
      목록.evaluations.forEach((평가: any) => {
        expect(평가.employee).toBeDefined();
        expect(typeof 평가.employee).toBe('object');
        expect(평가.employee.id).toBeDefined();
        expect(평가.employee.name).toBeDefined();
        expect(평가.employee.employeeNumber).toBeDefined();
      });
    });

    it('평가기간 정보가 객체로 반환되어야 한다', async () => {
      // When
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다();

      // Then
      expect(목록.evaluations.length).toBeGreaterThan(0);
      목록.evaluations.forEach((평가: any) => {
        expect(평가.period).toBeDefined();
        expect(typeof 평가.period).toBe('object');
        expect(평가.period.id).toBeDefined();
        expect(평가.period.name).toBeDefined();
        expect(평가.period.status).toBeDefined();
      });
    });
  });

  describe('시나리오 6: 직원-평가기간별 최종평가 조회', () => {
    it('기본 조회가 가능해야 한다', async () => {
      // Given
      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When
      const 조회결과 =
        await finalEvaluationScenario.직원_평가기간별_최종평가를_조회한다(
          employeeId,
          evaluationPeriodId,
        );

      // Then
      expect(조회결과).toBeDefined();
      expect(조회결과.employee.id).toBe(employeeId);
      expect(조회결과.period.id).toBe(evaluationPeriodId);
      expect(조회결과.evaluationGrade).toBe('A');
    });

    it('직원 정보가 객체로 반환되어야 한다', async () => {
      // Given
      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When
      const 조회결과 =
        await finalEvaluationScenario.직원_평가기간별_최종평가를_조회한다(
          employeeId,
          evaluationPeriodId,
        );

      // Then
      expect(조회결과.employee).toBeDefined();
      expect(typeof 조회결과.employee).toBe('object');
      expect(조회결과.employee.id).toBe(employeeId);
      expect(조회결과.employee.name).toBeDefined();
      expect(조회결과.employee.employeeNumber).toBeDefined();
    });

    it('평가기간 정보가 객체로 반환되어야 한다', async () => {
      // Given
      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When
      const 조회결과 =
        await finalEvaluationScenario.직원_평가기간별_최종평가를_조회한다(
          employeeId,
          evaluationPeriodId,
        );

      // Then
      expect(조회결과.period).toBeDefined();
      expect(typeof 조회결과.period).toBe('object');
      expect(조회결과.period.id).toBe(evaluationPeriodId);
      expect(조회결과.period.name).toBeDefined();
      expect(조회결과.period.status).toBeDefined();
    });

    it('잘못된 형식의 직원 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/invalid-uuid/period/${evaluationPeriodId}`,
        )
        .expect(400);
    });

    it('잘못된 형식의 평가기간 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/invalid-uuid`,
        )
        .expect(400);
    });
  });

  describe('시나리오 7: 최종평가 전체 워크플로우', () => {
    it('저장 → 확정 → 확정 취소 → 재확정 → 조회 워크플로우가 정상 작동해야 한다', async () => {
      // When
      const 결과 = await finalEvaluationScenario.최종평가_전체_시나리오를_실행한다(
        {
          employeeId,
          periodId: evaluationPeriodId,
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'a',
          finalComments: '우수한 성과',
        },
      );

      // Then
      // 1. 저장 검증
      expect(결과.저장결과.id).toBeDefined();
      expect(결과.저장결과.message).toContain('성공');

      // 2. 확정 검증
      expect(결과.확정결과.message).toContain('확정');

      // 3. 확정 취소 검증
      expect(결과.확정취소결과.message).toContain('취소');

      // 4. 재확정 검증
      expect(결과.재확정결과.message).toContain('확정');

      // 5. 최종 조회 검증
      expect(결과.최종조회결과.id).toBe(결과.저장결과.id);
      expect(결과.최종조회결과.isConfirmed).toBe(true);
      expect(결과.최종조회결과.confirmedAt).not.toBeNull();
      expect(결과.최종조회결과.evaluationGrade).toBe('A');
      expect(결과.최종조회결과.jobGrade).toBe('T2');
      expect(결과.최종조회결과.finalComments).toBe('우수한 성과');
    });
  });

  describe('시나리오 8: 에러 처리', () => {
    it('빈 목록도 정상적으로 반환되어야 한다', async () => {
      // When - 존재하지 않는 조건으로 조회
      const 목록 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        employeeId: '00000000-0000-0000-0000-000000000000',
      });

      // Then
      expect(목록.evaluations).toBeDefined();
      expect(Array.isArray(목록.evaluations)).toBe(true);
      expect(목록.evaluations.length).toBe(0);
      expect(목록.total).toBe(0);
    });
  });
});

