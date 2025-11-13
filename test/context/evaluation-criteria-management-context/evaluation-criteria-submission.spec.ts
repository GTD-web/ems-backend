import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 평가기준 제출 및 초기화 기능 통합 테스트
 *
 * EvaluationCriteriaManagementService의 평가기준 제출 및 초기화 기능을 검증합니다.
 */
describe('EvaluationCriteriaManagementService - 평가기준 제출 및 초기화', () => {
  let service: EvaluationCriteriaManagementService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let departmentId: string;
  let employeeId: string;
  let mappingId: string;

  const submittedBy = 'test-submitter-id';
  const updatedBy = 'test-updater-id';
  const createdBy = 'test-creator-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        EvaluationCriteriaManagementContextModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
        ]),
      ],
    }).compile();

    service = module.get<EvaluationCriteriaManagementService>(
      EvaluationCriteriaManagementService,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'evaluation-criteria-submission-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
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
   * 테스트 데이터 생성 헬퍼 함수
   */
  async function 테스트_데이터를_생성한다() {
    const now = new Date();

    // 부서 생성
    const department = departmentRepository.create({
      name: '테스트 부서',
      code: 'TEST_DEPT',
      externalId: `DEPT_${Date.now()}`,
      externalCreatedAt: now,
      externalUpdatedAt: now,
      createdBy: createdBy,
    });
    const savedDepartment = await departmentRepository.save(department);
    departmentId = savedDepartment.id;

    // 직원 생성
    const employee = employeeRepository.create({
      employeeNumber: `TEST${Date.now()}`,
      name: '테스트 직원',
      email: `test${Date.now()}@example.com`,
      departmentId: departmentId,
      externalId: `EMP_${Date.now()}`,
      externalCreatedAt: now,
      externalUpdatedAt: now,
      createdBy: createdBy,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    // 평가기간 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      description: '테스트용 평가기간',
      startDate: new Date('2024-01-01'),
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.EVALUATION_SETUP,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: createdBy,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 평가기간-직원 맵핑 생성
    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      createdBy: createdBy,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;

    return {
      departmentId,
      employeeId,
      evaluationPeriodId,
      mappingId,
    };
  }

  describe('평가기준 제출', () => {
    it('평가기준을 제출해야 함', async () => {
      // Given
      await 테스트_데이터를_생성한다();

      // When
      const result = await service.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        submittedBy,
      );

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(mappingId);
      expect(result.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(result.employeeId).toBe(employeeId);
      expect(result.isCriteriaSubmitted).toBe(true);
      expect(result.criteriaSubmittedAt).toBeDefined();
      expect(result.criteriaSubmittedBy).toBe(submittedBy);

      // DB에서 확인
      const savedMapping = await mappingRepository.findOne({
        where: { id: mappingId },
      });
      expect(savedMapping).toBeDefined();
      expect(savedMapping?.isCriteriaSubmitted).toBe(true);
      expect(savedMapping?.criteriaSubmittedAt).toBeDefined();
      expect(savedMapping?.criteriaSubmittedBy).toBe(submittedBy);

      testResults.push({
        testName: '평가기준을 제출해야 함',
        result: {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt?.toISOString(),
          criteriaSubmittedBy: result.criteriaSubmittedBy,
        },
      });
    });

    it('이미 제출된 평가기준을 다시 제출해도 성공해야 함 (멱등성)', async () => {
      // Given
      await 테스트_데이터를_생성한다();
      await service.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        submittedBy,
      );

      const firstSubmission = await mappingRepository.findOne({
        where: { id: mappingId },
      });
      const firstSubmittedAt = firstSubmission?.criteriaSubmittedAt;

      // When - 다시 제출
      const result = await service.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        'another-submitter-id',
      );

      // Then
      expect(result.isCriteriaSubmitted).toBe(true);
      // 첫 번째 제출 시간이 유지되어야 함 (멱등성)
      expect(result.criteriaSubmittedAt?.getTime()).toBe(
        firstSubmittedAt?.getTime(),
      );
      // 첫 번째 제출자가 유지되어야 함
      expect(result.criteriaSubmittedBy).toBe(submittedBy);

      testResults.push({
        testName: '이미 제출된 평가기준을 다시 제출해도 성공해야 함 (멱등성)',
        result: {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt?.toISOString(),
          criteriaSubmittedBy: result.criteriaSubmittedBy,
          firstSubmittedAt: firstSubmittedAt?.toISOString(),
        },
      });
    });

    it('존재하지 않는 맵핑으로 제출 시 에러를 발생시켜야 함', async () => {
      // Given
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000001';
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000002';

      // When & Then
      await expect(
        service.평가기준을_제출한다(
          nonExistentPeriodId,
          nonExistentEmployeeId,
          submittedBy,
        ),
      ).rejects.toThrow();

      testResults.push({
        testName: '존재하지 않는 맵핑으로 제출 시 에러를 발생시켜야 함',
        result: {
          error: 'EvaluationPeriodEmployeeMappingNotFoundException',
        },
      });
    });
  });

  describe('평가기준 제출 초기화', () => {
    it('평가기준 제출을 초기화해야 함', async () => {
      // Given
      await 테스트_데이터를_생성한다();
      await service.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        submittedBy,
      );

      // When
      const result = await service.평가기준_제출을_초기화한다(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(mappingId);
      expect(result.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(result.employeeId).toBe(employeeId);
      expect(result.isCriteriaSubmitted).toBe(false);
      expect(result.criteriaSubmittedAt).toBeNull();
      expect(result.criteriaSubmittedBy).toBeNull();

      // DB에서 확인
      const savedMapping = await mappingRepository.findOne({
        where: { id: mappingId },
      });
      expect(savedMapping).toBeDefined();
      expect(savedMapping?.isCriteriaSubmitted).toBe(false);
      expect(savedMapping?.criteriaSubmittedAt).toBeNull();
      expect(savedMapping?.criteriaSubmittedBy).toBeNull();

      testResults.push({
        testName: '평가기준 제출을 초기화해야 함',
        result: {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt,
          criteriaSubmittedBy: result.criteriaSubmittedBy,
        },
      });
    });

    it('제출되지 않은 평가기준을 초기화해도 성공해야 함 (멱등성)', async () => {
      // Given
      await 테스트_데이터를_생성한다();
      // 제출하지 않은 상태

      // When
      const result = await service.평가기준_제출을_초기화한다(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      // Then
      expect(result.isCriteriaSubmitted).toBe(false);
      expect(result.criteriaSubmittedAt).toBeNull();
      expect(result.criteriaSubmittedBy).toBeNull();

      testResults.push({
        testName: '제출되지 않은 평가기준을 초기화해도 성공해야 함 (멱등성)',
        result: {
          mappingId: result.id,
          isCriteriaSubmitted: result.isCriteriaSubmitted,
          criteriaSubmittedAt: result.criteriaSubmittedAt,
          criteriaSubmittedBy: result.criteriaSubmittedBy,
        },
      });
    });

    it('존재하지 않는 맵핑으로 초기화 시 에러를 발생시켜야 함', async () => {
      // Given
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000001';
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000002';

      // When & Then
      await expect(
        service.평가기준_제출을_초기화한다(
          nonExistentPeriodId,
          nonExistentEmployeeId,
          updatedBy,
        ),
      ).rejects.toThrow();

      testResults.push({
        testName: '존재하지 않는 맵핑으로 초기화 시 에러를 발생시켜야 함',
        result: {
          error: 'EvaluationPeriodEmployeeMappingNotFoundException',
        },
      });
    });
  });

  describe('평가기준 제출 및 초기화 통합 시나리오', () => {
    it('제출 → 초기화 → 재제출 시나리오가 정상 동작해야 함', async () => {
      // Given
      await 테스트_데이터를_생성한다();

      // When - 1. 제출
      const submitResult1 = await service.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        submittedBy,
      );
      expect(submitResult1.isCriteriaSubmitted).toBe(true);

      // When - 2. 초기화
      const resetResult = await service.평가기준_제출을_초기화한다(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );
      expect(resetResult.isCriteriaSubmitted).toBe(false);

      // When - 3. 재제출
      const submitResult2 = await service.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        'new-submitter-id',
      );

      // Then
      expect(submitResult2.isCriteriaSubmitted).toBe(true);
      expect(submitResult2.criteriaSubmittedBy).toBe('new-submitter-id');
      expect(submitResult2.criteriaSubmittedAt).toBeDefined();
      // 재제출 시 새로운 시간이 설정되어야 함
      expect(submitResult2.criteriaSubmittedAt?.getTime()).toBeGreaterThan(
        submitResult1.criteriaSubmittedAt?.getTime() || 0,
      );

      testResults.push({
        testName: '제출 → 초기화 → 재제출 시나리오가 정상 동작해야 함',
        result: {
          firstSubmission: {
            isCriteriaSubmitted: submitResult1.isCriteriaSubmitted,
            criteriaSubmittedBy: submitResult1.criteriaSubmittedBy,
            criteriaSubmittedAt:
              submitResult1.criteriaSubmittedAt?.toISOString(),
          },
          reset: {
            isCriteriaSubmitted: resetResult.isCriteriaSubmitted,
            criteriaSubmittedAt: resetResult.criteriaSubmittedAt,
            criteriaSubmittedBy: resetResult.criteriaSubmittedBy,
          },
          secondSubmission: {
            isCriteriaSubmitted: submitResult2.isCriteriaSubmitted,
            criteriaSubmittedBy: submitResult2.criteriaSubmittedBy,
            criteriaSubmittedAt:
              submitResult2.criteriaSubmittedAt?.toISOString(),
          },
        },
      });
    });
  });
});
