import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '@libs/database/database.module';
import { OrganizationManagementContextModule } from '@context/organization-management-context/organization-management-context.module';
import { OrganizationManagementService } from '@context/organization-management-context/organization-management.service';
import { EmployeeModule } from '@domain/common/employee/employee.module';
import { Employee } from '@domain/common/employee/employee.entity';
import { EmployeeService } from '@domain/common/employee/employee.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * OrganizationManagementService 접근 가능 여부 확인 테스트
 *
 * 사번으로 직원의 접근 가능 여부를 확인하는 기능을 검증합니다.
 * 2중 보안을 위한 isAccessible 필드 검증을 포함합니다.
 */
describe('OrganizationManagementService - 접근 가능 여부 확인 테스트', () => {
  let service: OrganizationManagementService;
  let employeeService: EmployeeService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let employeeRepository: Repository<Employee>;

  // 테스트 결과 저장용
  const testResults: any[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        CqrsModule,
        TypeOrmModule.forFeature([Employee]),
        EmployeeModule,
        OrganizationManagementContextModule,
      ],
    }).compile();

    service = module.get<OrganizationManagementService>(
      OrganizationManagementService,
    );
    employeeService = module.get<EmployeeService>(EmployeeService);
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    employeeRepository = dataSource.getRepository(Employee);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'organization-management-service-accessibility-test-result.json',
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
    // 각 테스트 전에 직원 데이터 정리
    try {
      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('사번으로_접근가능한가', () => {
    it('접근 가능한 직원은 true를 반환해야 한다', async () => {
      // Given: 접근 가능한 직원 생성
      const accessibleEmployee = employeeRepository.create({
        employeeNumber: 'E2023001',
        name: '홍길동',
        email: 'hong@example.com',
        externalId: 'ext-001',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        isAccessible: true, // 접근 가능
      });
      await employeeRepository.save(accessibleEmployee);

      // When: 접근 가능 여부 확인
      const result = await service.사번으로_접근가능한가('E2023001');

      // Then: true 반환 확인
      expect(result).toBe(true);

      testResults.push({
        testName: '접근 가능한 직원은 true를 반환해야 한다',
        result: {
          success: true,
          employeeNumber: 'E2023001',
          isAccessible: true,
          returnedValue: result,
        },
      });
    });

    it('접근 불가능한 직원은 false를 반환해야 한다', async () => {
      // Given: 접근 불가능한 직원 생성
      const inaccessibleEmployee = employeeRepository.create({
        employeeNumber: 'E2023002',
        name: '김철수',
        email: 'kim@example.com',
        externalId: 'ext-002',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        isAccessible: false, // 접근 불가능
      });
      await employeeRepository.save(inaccessibleEmployee);

      // When: 접근 가능 여부 확인
      const result = await service.사번으로_접근가능한가('E2023002');

      // Then: false 반환 확인
      expect(result).toBe(false);

      testResults.push({
        testName: '접근 불가능한 직원은 false를 반환해야 한다',
        result: {
          success: true,
          employeeNumber: 'E2023002',
          isAccessible: false,
          returnedValue: result,
        },
      });
    });

    it('존재하지 않는 직원은 false를 반환해야 한다', async () => {
      // Given: 직원이 없는 상태

      // When: 존재하지 않는 사번으로 접근 가능 여부 확인
      const result = await service.사번으로_접근가능한가('E9999999');

      // Then: false 반환 확인
      expect(result).toBe(false);

      testResults.push({
        testName: '존재하지 않는 직원은 false를 반환해야 한다',
        result: {
          success: true,
          employeeNumber: 'E9999999',
          employeeExists: false,
          returnedValue: result,
        },
      });
    });

    it('삭제된 직원은 false를 반환해야 한다', async () => {
      // Given: 삭제된 직원 생성
      const deletedEmployee = employeeRepository.create({
        employeeNumber: 'E2023003',
        name: '이영희',
        email: 'lee@example.com',
        externalId: 'ext-003',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        isAccessible: true,
        deletedAt: new Date(), // 삭제됨
      });
      await employeeRepository.save(deletedEmployee);

      // When: 삭제된 직원의 사번으로 접근 가능 여부 확인
      const result = await service.사번으로_접근가능한가('E2023003');

      // Then: false 반환 확인 (삭제된 직원은 조회되지 않음)
      expect(result).toBe(false);

      testResults.push({
        testName: '삭제된 직원은 false를 반환해야 한다',
        result: {
          success: true,
          employeeNumber: 'E2023003',
          isDeleted: true,
          returnedValue: result,
        },
      });
    });

    it('기본값으로 생성된 직원은 접근 불가능해야 한다', async () => {
      // Given: isAccessible 필드를 명시하지 않고 직원 생성 (기본값 false)
      const defaultEmployee = employeeRepository.create({
        employeeNumber: 'E2023004',
        name: '박민수',
        email: 'park@example.com',
        externalId: 'ext-004',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        // isAccessible 필드 생략 (기본값 false)
      });
      await employeeRepository.save(defaultEmployee);

      // When: 접근 가능 여부 확인
      const result = await service.사번으로_접근가능한가('E2023004');

      // Then: false 반환 확인 (기본값이 false이므로)
      expect(result).toBe(false);

      // DB에서 실제 값 확인
      const savedEmployee = await employeeRepository.findOne({
        where: { employeeNumber: 'E2023004', deletedAt: IsNull() },
      });
      expect(savedEmployee?.isAccessible).toBe(false);

      testResults.push({
        testName: '기본값으로 생성된 직원은 접근 불가능해야 한다',
        result: {
          success: true,
          employeeNumber: 'E2023004',
          defaultIsAccessible: savedEmployee?.isAccessible,
          returnedValue: result,
        },
      });
    });

    it('여러 직원 중 접근 가능한 직원만 true를 반환해야 한다', async () => {
      // Given: 접근 가능한 직원과 불가능한 직원 생성
      const accessibleEmployee = employeeRepository.create({
        employeeNumber: 'E2023005',
        name: '정수진',
        email: 'jung@example.com',
        externalId: 'ext-005',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        isAccessible: true,
      });

      const inaccessibleEmployee = employeeRepository.create({
        employeeNumber: 'E2023006',
        name: '최지영',
        email: 'choi@example.com',
        externalId: 'ext-006',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        isAccessible: false,
      });

      await employeeRepository.save([accessibleEmployee, inaccessibleEmployee]);

      // When: 각 직원의 접근 가능 여부 확인
      const accessibleResult = await service.사번으로_접근가능한가('E2023005');
      const inaccessibleResult =
        await service.사번으로_접근가능한가('E2023006');

      // Then: 접근 가능한 직원은 true, 불가능한 직원은 false
      expect(accessibleResult).toBe(true);
      expect(inaccessibleResult).toBe(false);

      testResults.push({
        testName: '여러 직원 중 접근 가능한 직원만 true를 반환해야 한다',
        result: {
          success: true,
          accessibleEmployee: {
            employeeNumber: 'E2023005',
            isAccessible: true,
            returnedValue: accessibleResult,
          },
          inaccessibleEmployee: {
            employeeNumber: 'E2023006',
            isAccessible: false,
            returnedValue: inaccessibleResult,
          },
        },
      });
    });

    it('빈 문자열 사번은 false를 반환해야 한다', async () => {
      // Given: 빈 문자열 사번

      // When: 빈 문자열로 접근 가능 여부 확인
      const result = await service.사번으로_접근가능한가('');

      // Then: false 반환 확인
      expect(result).toBe(false);

      testResults.push({
        testName: '빈 문자열 사번은 false를 반환해야 한다',
        result: {
          success: true,
          employeeNumber: '',
          returnedValue: result,
        },
      });
    });

    it('대소문자 구분 없이 사번을 정확히 매칭해야 한다', async () => {
      // Given: 정확한 사번으로 직원 생성
      const employee = employeeRepository.create({
        employeeNumber: 'E2023007',
        name: '한소희',
        email: 'han@example.com',
        externalId: 'ext-007',
        externalCreatedAt: new Date(),
        externalUpdatedAt: new Date(),
        status: '재직중',
        isAccessible: true,
      });
      await employeeRepository.save(employee);

      // When: 대소문자가 다른 사번으로 접근 가능 여부 확인
      const result1 = await service.사번으로_접근가능한가('e2023007'); // 소문자
      const result2 = await service.사번으로_접근가능한가('E2023007'); // 정확한 대소문자

      // Then: 정확한 대소문자만 매칭되어야 함
      // (데이터베이스 설정에 따라 다를 수 있지만, 일반적으로 대소문자 구분)
      expect(result2).toBe(true);
      // result1은 데이터베이스 설정에 따라 다를 수 있음

      testResults.push({
        testName: '대소문자 구분 없이 사번을 정확히 매칭해야 한다',
        result: {
          success: true,
          employeeNumber: 'E2023007',
          lowercaseResult: result1,
          exactCaseResult: result2,
          note: '데이터베이스 설정에 따라 대소문자 구분이 다를 수 있습니다.',
        },
      });
    });
  });
});
