import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingNotFoundException } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  UnregisterEvaluationTargetCommand,
  UnregisterEvaluationTargetHandler,
} from '@context/evaluation-period-management-context/handlers/evaluation-target/commands/unregister-evaluation-target.handler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 평가 대상자 등록 해제 핸들러 테스트
 *
 * UnregisterEvaluationTargetHandler의 모든 기능을 검증합니다:
 * - 정상적인 등록 해제
 * - 존재하지 않는 매핑 삭제 시 예외 발생
 * - 소프트 삭제 검증 (deletedAt 설정)
 * - 이미 삭제된 매핑 재삭제 시 예외 발생
 */
describe('UnregisterEvaluationTargetHandler - 평가 대상자 등록 해제 테스트', () => {
  let handler: UnregisterEvaluationTargetHandler;
  let dataSource: DataSource;
  let module: TestingModule;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;
  let employeeRepository: Repository<Employee>;
  let mappingRepository: Repository<EvaluationPeriodEmployeeMapping>;

  // 테스트 데이터 ID
  let evaluationPeriodId: string;
  let employeeId: string;
  let mappingId: string;
  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        TypeOrmModule.forFeature([
          EvaluationPeriod,
          Employee,
          EvaluationPeriodEmployeeMapping,
        ]),
      ],
      providers: [
        EvaluationPeriodEmployeeMappingService,
        TransactionManagerService,
        UnregisterEvaluationTargetHandler,
      ],
    }).compile();

    handler = module.get<UnregisterEvaluationTargetHandler>(
      UnregisterEvaluationTargetHandler,
    );
    dataSource = module.get<DataSource>(DataSource);
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);
    employeeRepository = dataSource.getRepository(Employee);
    mappingRepository = dataSource.getRepository(
      EvaluationPeriodEmployeeMapping,
    );

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'unregister-evaluation-target-result.json',
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
    // 각 테스트 전에 데이터 정리 (소프트 삭제된 것도 포함)
    try {
      await mappingRepository
        .createQueryBuilder()
        .delete()
        .from(EvaluationPeriodEmployeeMapping)
        .execute();
      await evaluationPeriodRepository
        .createQueryBuilder()
        .delete()
        .from(EvaluationPeriod)
        .execute();
      await employeeRepository
        .createQueryBuilder()
        .delete()
        .from(Employee)
        .execute();
    } catch (error) {
      // 초기 테스트에서는 무시
    }

    // 기본 테스트 데이터 생성
    const evaluationPeriod = evaluationPeriodRepository.create({
      name: '2024년 상반기 평가',
      startDate: new Date('2024-01-01'),
      peerEvaluationDeadline: new Date('2024-06-30'),
      description: '테스트 평가기간',
      maxSelfEvaluationRate: 120,
      createdBy: systemAdminId,
    });
    const savedPeriod = await evaluationPeriodRepository.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    const employee = employeeRepository.create({
      externalId: `ext-${Date.now()}-${Math.random()}`,
      employeeNumber: `EMP${Date.now()}`,
      name: '홍길동',
      email: `hong-${Date.now()}@example.com`,
      status: '재직중',
      createdBy: systemAdminId,
    });
    const savedEmployee = await employeeRepository.save(employee);
    employeeId = savedEmployee.id;

    const mapping = mappingRepository.create({
      evaluationPeriodId: evaluationPeriodId,
      employeeId: employeeId,
      isExcluded: false,
      createdBy: systemAdminId,
    });
    const savedMapping = await mappingRepository.save(mapping);
    mappingId = savedMapping.id;
  });

  describe('execute', () => {
    it('정상적인 등록 해제 시 true를 반환해야 한다', async () => {
      // Given
      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toBe(true);

      // 테스트 결과 저장
      testResults.push({
        testName: '정상적인 등록 해제 시 true를 반환해야 한다',
        result: {
          success: result,
          evaluationPeriodId,
          employeeId,
        },
      });
    });

    it('등록 해제 시 매핑이 소프트 삭제되어야 한다 (deletedAt이 설정되어야 함)', async () => {
      // Given
      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // When
      await handler.execute(command);

      // Then
      const deletedMapping = await mappingRepository.findOne({
        where: { id: mappingId },
        withDeleted: true,
      });

      expect(deletedMapping).not.toBeNull();
      expect(deletedMapping?.deletedAt).not.toBeNull();
      expect(deletedMapping?.deletedAt).toBeInstanceOf(Date);

      // 테스트 결과 저장
      testResults.push({
        testName:
          '등록 해제 시 매핑이 소프트 삭제되어야 한다 (deletedAt이 설정되어야 함)',
        result: {
          mappingId,
          deletedAt: deletedMapping?.deletedAt?.toISOString(),
          isSoftDeleted: deletedMapping?.deletedAt !== null,
        },
      });
    });

    it('등록 해제 후 일반 조회 시 매핑이 조회되지 않아야 한다', async () => {
      // Given
      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // When
      await handler.execute(command);

      // Then
      const mapping = await mappingRepository.findOne({
        where: { id: mappingId },
      });

      expect(mapping).toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '등록 해제 후 일반 조회 시 매핑이 조회되지 않아야 한다',
        result: {
          mappingId,
          isFound: mapping !== null,
          isCorrectlyDeleted: mapping === null,
        },
      });
    });

    it('존재하지 않는 평가기간 ID로 삭제 시도 시 예외가 발생해야 한다', async () => {
      // Given
      const notExistPeriodId = '99999999-9999-9999-9999-999999999999';
      const command = new UnregisterEvaluationTargetCommand(
        notExistPeriodId,
        employeeId,
      );

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        EvaluationPeriodEmployeeMappingNotFoundException,
      );

      // 테스트 결과 저장
      testResults.push({
        testName:
          '존재하지 않는 평가기간 ID로 삭제 시도 시 예외가 발생해야 한다',
        result: {
          evaluationPeriodId: notExistPeriodId,
          employeeId,
          exceptionThrown: true,
          exceptionType: 'EvaluationPeriodEmployeeMappingNotFoundException',
        },
      });
    });

    it('존재하지 않는 직원 ID로 삭제 시도 시 예외가 발생해야 한다', async () => {
      // Given
      const notExistEmployeeId = '99999999-9999-9999-9999-999999999999';
      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        notExistEmployeeId,
      );

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        EvaluationPeriodEmployeeMappingNotFoundException,
      );

      // 테스트 결과 저장
      testResults.push({
        testName: '존재하지 않는 직원 ID로 삭제 시도 시 예외가 발생해야 한다',
        result: {
          evaluationPeriodId,
          employeeId: notExistEmployeeId,
          exceptionThrown: true,
          exceptionType: 'EvaluationPeriodEmployeeMappingNotFoundException',
        },
      });
    });

    it('이미 삭제된 매핑을 다시 삭제 시도 시 예외가 발생해야 한다', async () => {
      // Given
      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // 첫 번째 삭제
      await handler.execute(command);

      // When & Then - 두 번째 삭제 시도
      await expect(handler.execute(command)).rejects.toThrow(
        EvaluationPeriodEmployeeMappingNotFoundException,
      );

      // 테스트 결과 저장
      testResults.push({
        testName: '이미 삭제된 매핑을 다시 삭제 시도 시 예외가 발생해야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          firstDeletionSuccess: true,
          secondDeletionExceptionThrown: true,
          exceptionType: 'EvaluationPeriodEmployeeMappingNotFoundException',
        },
      });
    });

    it('제외된 평가 대상자도 정상적으로 삭제되어야 한다', async () => {
      // Given - 매핑을 제외 상태로 변경
      const mapping = await mappingRepository.findOne({
        where: { id: mappingId },
      });
      if (mapping) {
        mapping.isExcluded = true;
        mapping.excludeReason = '테스트 제외';
        await mappingRepository.save(mapping);
      }

      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toBe(true);

      const deletedMapping = await mappingRepository.findOne({
        where: { id: mappingId },
        withDeleted: true,
      });

      expect(deletedMapping?.deletedAt).not.toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '제외된 평가 대상자도 정상적으로 삭제되어야 한다',
        result: {
          evaluationPeriodId,
          employeeId,
          wasExcluded: true,
          deletedAt: deletedMapping?.deletedAt?.toISOString(),
          isSoftDeleted: deletedMapping?.deletedAt !== null,
        },
      });
    });

    it('다른 평가기간의 동일 직원 매핑은 영향받지 않아야 한다', async () => {
      // Given - 다른 평가기간 생성
      const anotherPeriod = evaluationPeriodRepository.create({
        name: '2024년 하반기 평가',
        startDate: new Date('2024-07-01'),
        peerEvaluationDeadline: new Date('2024-12-31'),
        description: '다른 평가기간',
        maxSelfEvaluationRate: 120,
        createdBy: systemAdminId,
      });
      const savedAnotherPeriod =
        await evaluationPeriodRepository.save(anotherPeriod);

      // 같은 직원을 다른 평가기간에 등록
      const anotherMapping = mappingRepository.create({
        evaluationPeriodId: savedAnotherPeriod.id,
        employeeId: employeeId,
        isExcluded: false,
        createdBy: systemAdminId,
      });
      await mappingRepository.save(anotherMapping);

      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // When
      await handler.execute(command);

      // Then - 다른 평가기간의 매핑은 여전히 존재해야 함
      const anotherMappingAfterDelete = await mappingRepository.findOne({
        where: {
          evaluationPeriodId: savedAnotherPeriod.id,
          employeeId: employeeId,
        },
      });

      expect(anotherMappingAfterDelete).not.toBeNull();
      expect(anotherMappingAfterDelete?.deletedAt).toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '다른 평가기간의 동일 직원 매핑은 영향받지 않아야 한다',
        result: {
          deletedEvaluationPeriodId: evaluationPeriodId,
          anotherEvaluationPeriodId: savedAnotherPeriod.id,
          employeeId,
          anotherMappingExists: anotherMappingAfterDelete !== null,
          anotherMappingNotDeleted:
            anotherMappingAfterDelete?.deletedAt === null,
        },
      });
    });

    it('같은 평가기간의 다른 직원 매핑은 영향받지 않아야 한다', async () => {
      // Given - 다른 직원 생성 및 등록
      const anotherEmployee = employeeRepository.create({
        externalId: `ext-${Date.now()}-${Math.random()}`,
        employeeNumber: `EMP${Date.now()}-2`,
        name: '김철수',
        email: `kim-${Date.now()}@example.com`,
        status: '재직중',
        createdBy: systemAdminId,
      });
      const savedAnotherEmployee =
        await employeeRepository.save(anotherEmployee);

      const anotherMapping = mappingRepository.create({
        evaluationPeriodId: evaluationPeriodId,
        employeeId: savedAnotherEmployee.id,
        isExcluded: false,
        createdBy: systemAdminId,
      });
      await mappingRepository.save(anotherMapping);

      const command = new UnregisterEvaluationTargetCommand(
        evaluationPeriodId,
        employeeId,
      );

      // When
      await handler.execute(command);

      // Then - 다른 직원의 매핑은 여전히 존재해야 함
      const anotherMappingAfterDelete = await mappingRepository.findOne({
        where: {
          evaluationPeriodId: evaluationPeriodId,
          employeeId: savedAnotherEmployee.id,
        },
      });

      expect(anotherMappingAfterDelete).not.toBeNull();
      expect(anotherMappingAfterDelete?.deletedAt).toBeNull();

      // 테스트 결과 저장
      testResults.push({
        testName: '같은 평가기간의 다른 직원 매핑은 영향받지 않아야 한다',
        result: {
          evaluationPeriodId,
          deletedEmployeeId: employeeId,
          anotherEmployeeId: savedAnotherEmployee.id,
          anotherMappingExists: anotherMappingAfterDelete !== null,
          anotherMappingNotDeleted:
            anotherMappingAfterDelete?.deletedAt === null,
        },
      });
    });
  });

  afterAll(() => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'unregister-evaluation-target-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);
  });
});
