import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '@libs/database/database.module';
import {
  AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler,
  AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand,
} from '@context/evaluation-criteria-management-context/handlers/evaluation-line/commands/auto-configure-primary-evaluator-by-manager-for-all-employees.handler';
import { ConfigurePrimaryEvaluatorHandler } from '@context/evaluation-criteria-management-context/handlers/evaluation-line/commands/configure-primary-evaluator.handler';
import { EmployeeModule } from '@domain/common/employee/employee.module';
import { EvaluationPeriodEmployeeMappingModule } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module';
import { EvaluationLineModule } from '@domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler 통합 테스트
 *
 * 평가기간의 모든 직원에 대해 managerId 기반으로 1차 평가자를 자동 구성하는 기능을 검증합니다.
 */
describe('AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler', () => {
  let handler: AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let departmentRepository: Repository<Department>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;
  let evaluationLineRepository: Repository<EvaluationLine>;
  let evaluationLineMappingRepository: Repository<EvaluationLineMapping>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let departmentId: string;
  let managerId: string;
  let employeeId1: string;
  let employeeId2: string;
  let employeeId3: string; // managerId가 없는 직원
  let mappingId1: string;
  let mappingId2: string;
  let mappingId3: string;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';
  const createdBy = 'test-user-id';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        EmployeeModule,
        EvaluationPeriodModule,
        EvaluationPeriodEmployeeMappingModule,
        EvaluationLineModule,
        EvaluationLineMappingModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          Department,
          EvaluationPeriodEmployeeMapping,
          EvaluationLine,
          EvaluationLineMapping,
        ]),
      ],
      providers: [
        AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler,
        ConfigurePrimaryEvaluatorHandler,
      ],
    }).compile();

    handler =
      module.get<AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler>(
        AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler,
      );
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    departmentRepository = dataSource.getRepository(Department);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );
    evaluationLineRepository = dataSource.getRepository(EvaluationLine);
    evaluationLineMappingRepository = dataSource.getRepository(
      EvaluationLineMapping,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    const outputPath = path.join(
      __dirname,
      'auto-configure-primary-evaluator-by-manager-result.json',
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
      const lineMappings = await evaluationLineMappingRepository.find();
      await evaluationLineMappingRepository.remove(lineMappings);

      const evaluationLines = await evaluationLineRepository.find();
      await evaluationLineRepository.remove(evaluationLines);

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
      status: EvaluationPeriodStatus.IN_PROGRESS,
      currentPhase: EvaluationPeriodPhase.SELF_EVALUATION,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: true,
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 3. 관리자(평가자) 생성
    const manager = employeeRepository.create({
      name: '관리자',
      email: 'manager@test.com',
      employeeNumber: 'EMP001',
      departmentId: departmentId,
      externalId: 'EXT001', // 외부 시스템 ID
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedManager = await employeeRepository.save(manager);
    managerId = savedManager.id; // 내부 Employee id (평가자 검증용)

    // 4. 직원 1 생성 (managerId는 외부 시스템 ID로 설정)
    const employee1 = employeeRepository.create({
      name: '직원1',
      email: 'employee1@test.com',
      employeeNumber: 'EMP002',
      departmentId: departmentId,
      managerId: 'EXT001', // 외부 시스템 ID (관리자의 externalId)
      externalId: 'EXT002',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedEmployee1 = await employeeRepository.save(employee1);
    employeeId1 = savedEmployee1.id;

    // 5. 직원 2 생성 (managerId는 외부 시스템 ID로 설정)
    const employee2 = employeeRepository.create({
      name: '직원2',
      email: 'employee2@test.com',
      employeeNumber: 'EMP003',
      departmentId: departmentId,
      managerId: 'EXT001', // 외부 시스템 ID (관리자의 externalId)
      externalId: 'EXT003',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedEmployee2 = await employeeRepository.save(employee2);
    employeeId2 = savedEmployee2.id;

    // 6. 직원 3 생성 (managerId 없음)
    const employee3 = employeeRepository.create({
      name: '직원3',
      email: 'employee3@test.com',
      employeeNumber: 'EMP004',
      departmentId: departmentId,
      // managerId는 optional이므로 생략
      externalId: 'EXT004',
      externalCreatedAt: new Date(),
      externalUpdatedAt: new Date(),
      createdBy: systemAdminId,
    });
    const savedEmployee3 = await employeeRepository.save(employee3);
    employeeId3 = savedEmployee3.id;

    // 7. 평가기간-직원 매핑 생성
    const mapping1 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId1,
      createdBy: systemAdminId,
    });
    const savedMapping1 = await mappingRepository.save(mapping1);
    mappingId1 = savedMapping1.id;

    const mapping2 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId2,
      createdBy: systemAdminId,
    });
    const savedMapping2 = await mappingRepository.save(mapping2);
    mappingId2 = savedMapping2.id;

    const mapping3 = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId3,
      createdBy: systemAdminId,
    });
    const savedMapping3 = await mappingRepository.save(mapping3);
    mappingId3 = savedMapping3.id;
  }

  describe('평가기간에 등록된 직원이 없는 경우', () => {
    it('빈 결과를 반환해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();
      // 평가기간-직원 매핑 삭제
      await mappingRepository.delete({ evaluationPeriodId });

      const command =
        new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
          evaluationPeriodId,
          createdBy,
        );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.totalEmployees).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.totalCreatedMappings).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.message).toContain('등록된 직원이 없습니다');

      // 테스트 결과 저장
      testResults.push({
        testName: '빈 결과를 반환해야 함',
        result: {
          evaluationPeriodId,
          totalEmployees: result.totalEmployees,
          successCount: result.successCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          totalCreatedMappings: result.totalCreatedMappings,
          message: result.message,
        },
      });
    });
  });

  describe('managerId가 있는 직원들에 대한 1차 평가자 자동 구성', () => {
    it('모든 직원의 managerId를 기반으로 1차 평가자를 자동 구성해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const command =
        new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
          evaluationPeriodId,
          createdBy,
        );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.totalEmployees).toBe(3);
      expect(result.successCount).toBe(2); // managerId가 있는 직원 2명
      expect(result.skippedCount).toBe(1); // managerId가 없는 직원 1명
      expect(result.failedCount).toBe(0);
      expect(result.totalCreatedMappings).toBe(2);
      expect(result.results).toHaveLength(3);

      // managerId가 있는 직원들은 성공
      const employee1Result = result.results.find(
        (r) => r.employeeId === employeeId1,
      );
      expect(employee1Result?.success).toBe(true);
      expect(employee1Result?.createdMappings).toBe(1);

      const employee2Result = result.results.find(
        (r) => r.employeeId === employeeId2,
      );
      expect(employee2Result?.success).toBe(true);
      expect(employee2Result?.createdMappings).toBe(1);

      // managerId가 없는 직원은 건너뜀
      const employee3Result = result.results.find(
        (r) => r.employeeId === employeeId3,
      );
      expect(employee3Result?.success).toBe(true);
      expect(employee3Result?.createdMappings).toBe(0);
      expect(employee3Result?.message).toContain('관리자가 설정되지 않아');

      // 실제 데이터베이스에 매핑이 생성되었는지 확인
      const mappings = await evaluationLineMappingRepository.find({
        where: { evaluationPeriodId },
      });

      // managerId가 있는 직원 2명에 대한 매핑이 생성되어야 함
      const primaryMappings = mappings.filter((m) => !m.wbsItemId);
      expect(primaryMappings).toHaveLength(2);

      // 각 매핑의 평가자가 managerId와 일치하는지 확인
      const employee1Mapping = primaryMappings.find(
        (m) => m.employeeId === employeeId1,
      );
      expect(employee1Mapping?.evaluatorId).toBe(managerId);

      const employee2Mapping = primaryMappings.find(
        (m) => m.employeeId === employeeId2,
      );
      expect(employee2Mapping?.evaluatorId).toBe(managerId);

      // 테스트 결과 저장
      testResults.push({
        testName: '모든 직원의 managerId를 기반으로 1차 평가자를 자동 구성해야 함',
        result: {
          evaluationPeriodId,
          totalEmployees: result.totalEmployees,
          successCount: result.successCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          totalCreatedMappings: result.totalCreatedMappings,
          employeeResults: result.results.map((r) => ({
            employeeId: r.employeeId,
            success: r.success,
            createdMappings: r.createdMappings,
            message: r.message,
          })),
          mappings: primaryMappings.map((m) => ({
            employeeId: m.employeeId,
            evaluatorId: m.evaluatorId,
          })),
        },
      });
    });
  });

  describe('기존 1차 평가라인 매핑이 있는 경우', () => {
    it('기존 매핑을 삭제하고 새로 생성해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 1차 평가 라인 생성
      const evaluationLine = evaluationLineRepository.create({
        evaluatorType: EvaluatorType.PRIMARY,
        order: 1,
        isRequired: true,
        isAutoAssigned: false,
        createdBy: systemAdminId,
      });
      const savedLine = await evaluationLineRepository.save(evaluationLine);

      // 기존 1차 평가라인 매핑 생성 (다른 평가자로)
      const oldEvaluatorId = '00000000-0000-0000-0000-000000000999';
      const oldMapping = evaluationLineMappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId1,
        evaluatorId: oldEvaluatorId,
        evaluationLineId: savedLine.id,
        // wbsItemId는 optional이므로 생략 (null 대신)
        createdBy: systemAdminId,
      });
      await evaluationLineMappingRepository.save(oldMapping);

      const command =
        new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
          evaluationPeriodId,
          createdBy,
        );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.successCount).toBe(2);
      expect(result.totalCreatedMappings).toBe(2);

      // 기존 매핑이 삭제되고 새 매핑이 생성되었는지 확인
      const mappings = await evaluationLineMappingRepository.find({
        where: {
          evaluationPeriodId,
          employeeId: employeeId1,
        },
      });

      const primaryMappings = mappings.filter((m) => !m.wbsItemId);
      expect(primaryMappings).toHaveLength(1);
      expect(primaryMappings[0].evaluatorId).toBe(managerId); // 새 평가자로 변경됨
      expect(primaryMappings[0].evaluatorId).not.toBe(oldEvaluatorId); // 기존 평가자가 아님

      // 테스트 결과 저장
      testResults.push({
        testName: '기존 매핑을 삭제하고 새로 생성해야 함',
        result: {
          evaluationPeriodId,
          employeeId: employeeId1,
          successCount: result.successCount,
          totalCreatedMappings: result.totalCreatedMappings,
          oldEvaluatorId,
          newEvaluatorId: managerId,
          mapping: {
            employeeId: primaryMappings[0].employeeId,
            evaluatorId: primaryMappings[0].evaluatorId,
          },
        },
      });
    });
  });

  describe('여러 직원에 대한 배치 처리', () => {
    it('모든 직원에 대해 일괄 처리되어야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      const command =
        new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
          evaluationPeriodId,
          createdBy,
        );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.totalEmployees).toBe(3);
      expect(result.results).toHaveLength(3);

      // 모든 결과가 올바른 상태를 가지고 있는지 확인
      const successResults = result.results.filter((r) => r.success);
      expect(successResults).toHaveLength(3); // 모두 성공 (건너뛴 것도 success: true)

      const createdResults = result.results.filter(
        (r) => r.createdMappings > 0,
      );
      expect(createdResults).toHaveLength(2); // managerId가 있는 직원 2명만 매핑 생성

      // 테스트 결과 저장
      testResults.push({
        testName: '모든 직원에 대해 일괄 처리되어야 함',
        result: {
          evaluationPeriodId,
          totalEmployees: result.totalEmployees,
          successCount: result.successCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          totalCreatedMappings: result.totalCreatedMappings,
          createdResultsCount: createdResults.length,
          employeeResults: result.results.map((r) => ({
            employeeId: r.employeeId,
            success: r.success,
            createdMappings: r.createdMappings,
          })),
        },
      });
    });
  });

  describe('1차 평가 라인이 없는 경우', () => {
    it('1차 평가 라인을 자동으로 생성해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 평가 라인이 없는 상태 확인
      const linesBefore = await evaluationLineRepository.find({
        where: { evaluatorType: EvaluatorType.PRIMARY, order: 1 },
      });
      expect(linesBefore).toHaveLength(0);

      const command =
        new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
          evaluationPeriodId,
          createdBy,
        );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.successCount).toBe(2);

      // 1차 평가 라인이 생성되었는지 확인
      const linesAfter = await evaluationLineRepository.find({
        where: { evaluatorType: EvaluatorType.PRIMARY, order: 1 },
      });
      expect(linesAfter).toHaveLength(1);
      expect(linesAfter[0].evaluatorType).toBe(EvaluatorType.PRIMARY);
      expect(linesAfter[0].order).toBe(1);

      // 테스트 결과 저장
      testResults.push({
        testName: '1차 평가 라인을 자동으로 생성해야 함',
        result: {
          evaluationPeriodId,
          successCount: result.successCount,
          evaluationLineCreated: linesAfter.length > 0,
          evaluationLine: linesAfter[0]
            ? {
                id: linesAfter[0].id,
                evaluatorType: linesAfter[0].evaluatorType,
                order: linesAfter[0].order,
              }
            : null,
        },
      });
    });
  });

  describe('managerId로 관리자를 찾을 수 없는 경우', () => {
    it('해당 직원은 건너뛰고 적절한 메시지를 반환해야 함', async () => {
      // Given
      await 기본_테스트데이터를_생성한다();

      // 직원 4 생성 (존재하지 않는 externalId를 managerId로 설정)
      const employee4 = employeeRepository.create({
        name: '직원4',
        email: 'employee4@test.com',
        employeeNumber: 'EMP005',
        departmentId: departmentId,
        managerId: 'NON_EXISTENT_EXT_ID', // 존재하지 않는 externalId
        externalId: 'EXT005',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        createdBy: systemAdminId,
      });
      const savedEmployee4 = await employeeRepository.save(employee4);
      const employeeId4 = savedEmployee4.id;

      // 평가기간-직원 매핑 생성
      const mapping4 = mappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: employeeId4,
        createdBy: systemAdminId,
      });
      await mappingRepository.save(mapping4);

      const command =
        new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
          evaluationPeriodId,
          createdBy,
        );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.totalEmployees).toBe(4); // 직원 1, 2, 3, 4
      expect(result.successCount).toBe(2); // managerId가 있고 관리자를 찾은 직원 2명
      expect(result.skippedCount).toBe(2); // managerId가 없는 직원 1명 + 관리자를 찾을 수 없는 직원 1명

      // 관리자를 찾을 수 없는 직원의 결과 확인
      const employee4Result = result.results.find(
        (r) => r.employeeId === employeeId4,
      );
      expect(employee4Result?.success).toBe(true);
      expect(employee4Result?.createdMappings).toBe(0);
      expect(employee4Result?.message).toContain('관리자');
      expect(employee4Result?.message).toContain('찾을 수 없어');
      expect(employee4Result?.message).toContain('NON_EXISTENT_EXT_ID');

      // 실제로 매핑이 생성되지 않았는지 확인
      const mappings = await evaluationLineMappingRepository.find({
        where: {
          evaluationPeriodId,
          employeeId: employeeId4,
        },
      });
      expect(mappings).toHaveLength(0);

      // 테스트 결과 저장
      testResults.push({
        testName: '해당 직원은 건너뛰고 적절한 메시지를 반환해야 함',
        result: {
          evaluationPeriodId,
          employeeId: employeeId4,
          managerId: 'NON_EXISTENT_EXT_ID',
          totalEmployees: result.totalEmployees,
          successCount: result.successCount,
          skippedCount: result.skippedCount,
          employeeResult: {
            employeeId: employee4Result?.employeeId,
            success: employee4Result?.success,
            createdMappings: employee4Result?.createdMappings,
            message: employee4Result?.message,
          },
          mappingsCreated: mappings.length,
        },
      });
    });
  });
});
