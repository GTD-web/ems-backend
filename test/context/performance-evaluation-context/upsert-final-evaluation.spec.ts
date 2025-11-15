import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import {
  UpsertFinalEvaluationHandler,
  UpsertFinalEvaluationCommand,
} from '@context/performance-evaluation-context/handlers/final-evaluation/command/upsert-final-evaluation.handler';
import { FinalEvaluationModule } from '@domain/core/final-evaluation/final-evaluation.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * Performance Evaluation Context - Upsert Final Evaluation 통합 테스트
 *
 * 최종평가 저장(Upsert) 기능을 검증합니다.
 * 트랜잭션 타임아웃 문제가 해결되었는지 확인합니다.
 */
describe('Performance Evaluation Context - Upsert Final Evaluation', () => {
  let handler: UpsertFinalEvaluationHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let finalEvaluationRepository: Repository<FinalEvaluation>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let departmentId: string;
  let mappingId: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const actionBy = 'test-user-id';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        FinalEvaluationModule,
        EvaluationPeriodModule,
        TypeOrmModule.forFeature([
          EvaluationPeriodEmployeeMapping,
          EvaluationPeriod,
          Employee,
          Department,
          FinalEvaluation,
        ]),
      ],
      providers: [UpsertFinalEvaluationHandler],
    }).compile();

    handler = module.get<UpsertFinalEvaluationHandler>(
      UpsertFinalEvaluationHandler,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    finalEvaluationRepository = dataSource.getRepository(FinalEvaluation);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const evaluations = await finalEvaluationRepository.find();
      await finalEvaluationRepository.remove(evaluations);

      const mappings = await mappingRepository.find();
      await mappingRepository.remove(mappings);

      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);

      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  /**
   * 기본 테스트 데이터 생성
   */
  async function 기본_테스트데이터를_생성한다(): Promise<void> {
    // 1. 부서 생성
    const department = departmentRepository.create({
      name: '개발팀',
      code: 'DEV001',
      externalId: 'DEPT001',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 2. 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      description: '테스트용 평가기간',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.CLOSURE,
      criteriaSettingEnabled: false,
      selfEvaluationSettingEnabled: false,
      finalEvaluationSettingEnabled: false,
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 직원 생성
    const employee = employeeRepository.create({
      name: '김피평가',
      employeeNumber: 'EMP001',
      email: 'employee@test.com',
      externalId: 'EXT001',
      departmentId: departmentId,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 4. 평가기간-직원 매핑 생성
    const mapping = new EvaluationPeriodEmployeeMapping({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;
  }

  describe('최종평가 생성', () => {
    it('기존 평가가 없으면 새로운 최종평가를 생성해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const command = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'A',
        JobGrade.T2,
        JobDetailedGrade.N,
        '최종평가 의견',
        actionBy,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      const savedEvaluation = await finalEvaluationRepository.findOne({
        where: { id: result },
      });
      expect(savedEvaluation).toBeDefined();
      expect(savedEvaluation).not.toBeNull();
      if (!savedEvaluation) return;
      expect(savedEvaluation.employeeId).toBe(employeeId);
      expect(savedEvaluation.periodId).toBe(evaluationPeriodId);
      expect(savedEvaluation.evaluationGrade).toBe('A');
      expect(savedEvaluation.jobGrade).toBe(JobGrade.T2);
      expect(savedEvaluation.jobDetailedGrade).toBe(JobDetailedGrade.N);
      expect(savedEvaluation.finalComments).toBe('최종평가 의견');
      expect(savedEvaluation.isConfirmed).toBe(false);
    });

    it('최종평가 생성 시 트랜잭션 내에서 조회가 이루어져야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const command = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'S',
        JobGrade.T3,
        JobDetailedGrade.A,
        undefined,
        actionBy,
      );

      // When
      const result = await handler.execute(command);

      // Then
      // 트랜잭션이 정상적으로 완료되어야 함 (타임아웃 없이)
      expect(result).toBeDefined();

      const savedEvaluation = await finalEvaluationRepository.findOne({
        where: { id: result },
      });
      expect(savedEvaluation).toBeDefined();
      expect(savedEvaluation).not.toBeNull();
      if (!savedEvaluation) return;
      expect(savedEvaluation.evaluationGrade).toBe('S');
    });
  });

  describe('최종평가 수정 (Upsert)', () => {
    it('기존 평가가 있으면 수정해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 첫 번째 저장
      const createCommand = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'A',
        JobGrade.T2,
        JobDetailedGrade.N,
        '초기 의견',
        actionBy,
      );
      const createdId = await handler.execute(createCommand);

      // When - 수정
      const updateCommand = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'S',
        JobGrade.T3,
        JobDetailedGrade.A,
        '수정된 의견',
        actionBy,
      );
      const updatedId = await handler.execute(updateCommand);

      // Then
      expect(updatedId).toBe(createdId); // 동일한 ID여야 함

      const savedEvaluation = await finalEvaluationRepository.findOne({
        where: { id: updatedId },
      });
      expect(savedEvaluation).toBeDefined();
      expect(savedEvaluation).not.toBeNull();
      if (!savedEvaluation) return;
      expect(savedEvaluation.evaluationGrade).toBe('S');
      expect(savedEvaluation.jobGrade).toBe(JobGrade.T3);
      expect(savedEvaluation.jobDetailedGrade).toBe(JobDetailedGrade.A);
      expect(savedEvaluation.finalComments).toBe('수정된 의견');
    });

    it('기존 평가 수정 시 트랜잭션 내에서 조회가 이루어져야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 첫 번째 저장
      const createCommand = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'B',
        JobGrade.T1,
        JobDetailedGrade.U,
        '초기 의견',
        actionBy,
      );
      await handler.execute(createCommand);

      // When - 수정
      const updateCommand = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'A',
        JobGrade.T2,
        JobDetailedGrade.N,
        '수정된 의견',
        actionBy,
      );
      const result = await handler.execute(updateCommand);

      // Then
      // 트랜잭션이 정상적으로 완료되어야 함 (타임아웃 없이)
      expect(result).toBeDefined();

      const savedEvaluation = await finalEvaluationRepository.findOne({
        where: { id: result },
      });
      expect(savedEvaluation).toBeDefined();
      expect(savedEvaluation).not.toBeNull();
      if (!savedEvaluation) return;
      expect(savedEvaluation.evaluationGrade).toBe('A');
    });

    it('동일한 직원-평가기간 조합으로 여러 번 호출해도 정상 동작해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const command = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'A',
        JobGrade.T2,
        JobDetailedGrade.N,
        '의견',
        actionBy,
      );

      // When - 여러 번 호출
      const id1 = await handler.execute(command);
      const id2 = await handler.execute(command);
      const id3 = await handler.execute(command);

      // Then
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);

      // 최종평가는 하나만 존재해야 함
      const evaluations = await finalEvaluationRepository.find({
        where: {
          employeeId,
          periodId: evaluationPeriodId,
        },
      });
      expect(evaluations.length).toBe(1);
    });
  });

  describe('트랜잭션 타임아웃 문제 검증', () => {
    it('트랜잭션 내에서 manager를 사용한 repository로 조회해야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const command = new UpsertFinalEvaluationCommand(
        employeeId,
        evaluationPeriodId,
        'A',
        JobGrade.T2,
        JobDetailedGrade.N,
        '의견',
        actionBy,
      );

      // When
      const startTime = Date.now();
      const result = await handler.execute(command);
      const endTime = Date.now();

      // Then
      // 트랜잭션이 빠르게 완료되어야 함 (5초 이내)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(result).toBeDefined();

      const savedEvaluation = await finalEvaluationRepository.findOne({
        where: { id: result },
      });
      expect(savedEvaluation).toBeDefined();
    });

    it('동시에 여러 최종평가를 생성해도 타임아웃이 발생하지 않아야 한다', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 여러 직원 생성
      const employee2 = employeeRepository.create({
        name: '이피평가',
        employeeNumber: 'EMP002',
        email: 'employee2@test.com',
        externalId: 'EXT002',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedEmployee2 = await employeeRepository.save(employee2);

      const employee3 = employeeRepository.create({
        name: '박피평가',
        employeeNumber: 'EMP003',
        email: 'employee3@test.com',
        externalId: 'EXT003',
        departmentId: departmentId,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedEmployee3 = await employeeRepository.save(employee3);

      // When - 동시에 여러 최종평가 생성
      const promises = [
        handler.execute(
          new UpsertFinalEvaluationCommand(
            employeeId,
            evaluationPeriodId,
            'A',
            JobGrade.T2,
            JobDetailedGrade.N,
            '의견1',
            actionBy,
          ),
        ),
        handler.execute(
          new UpsertFinalEvaluationCommand(
            savedEmployee2.id,
            evaluationPeriodId,
            'B',
            JobGrade.T1,
            JobDetailedGrade.U,
            '의견2',
            actionBy,
          ),
        ),
        handler.execute(
          new UpsertFinalEvaluationCommand(
            savedEmployee3.id,
            evaluationPeriodId,
            'S',
            JobGrade.T3,
            JobDetailedGrade.A,
            '의견3',
            actionBy,
          ),
        ),
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Then
      // 모든 트랜잭션이 빠르게 완료되어야 함 (10초 이내)
      expect(endTime - startTime).toBeLessThan(10000);
      expect(results.length).toBe(3);
      expect(results.every((id) => id !== undefined)).toBe(true);

      // 모든 최종평가가 정상적으로 저장되었는지 확인
      const evaluations = await finalEvaluationRepository.find({
        where: { periodId: evaluationPeriodId },
      });
      expect(evaluations.length).toBe(3);
    });
  });
});
