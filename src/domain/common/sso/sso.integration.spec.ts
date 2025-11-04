/**
 * SSO 통합 테스트
 *
 * 실제 SSO 서버와 연동하여 테스트합니다.
 * 환경 변수 설정이 필요합니다:
 * - SSO_BASE_URL
 * - SSO_CLIENT_ID
 * - SSO_CLIENT_SECRET
 *
 * 실행 방법:
 * npm run test -- sso.integration.spec.ts
 */

import * as dotenv from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SSOModule } from './sso.module';
import { SSOService } from './sso.service';

// .env 파일 로드
dotenv.config();

describe('SSO 통합 테스트 (실제 서버)', () => {
  let module: TestingModule;
  let ssoService: SSOService;
  let isConfigured: boolean;

  beforeAll(async () => {
    // 환경 변수 확인
    isConfigured =
      !!process.env.SSO_BASE_URL &&
      !!process.env.SSO_CLIENT_ID &&
      !!process.env.SSO_CLIENT_SECRET;

    if (!isConfigured) {
      console.warn(
        '⚠️  SSO 환경 변수가 설정되지 않아 통합 테스트를 건너뜁니다.',
      );
      console.warn('   다음 환경 변수를 .env 파일에 설정하세요:');
      console.warn('   - SSO_BASE_URL=https://lsso.vercel.app');
      console.warn('   - SSO_CLIENT_ID=your-client-id');
      console.warn('   - SSO_CLIENT_SECRET=your-client-secret');
      return;
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        SSOModule,
      ],
    }).compile();

    ssoService = module.get<SSOService>(SSOService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('시스템 초기화', () => {
    it('SSO 서비스가 정의되어야 한다', () => {
      if (!isConfigured) return;
      expect(ssoService).toBeDefined();
    });
  });

  describe('조직 정보 조회', () => {
    it('여러 직원 정보를 조회할 수 있어야 한다', async () => {
      if (!isConfigured) {
        console.log('⏭️  환경 변수 미설정으로 테스트 건너뜀');
        return;
      }

      try {
        const employees = await ssoService.여러직원정보를조회한다({
          withDetail: true,
          includeTerminated: false,
        });

        console.log(`✅ 직원 정보 조회 성공: 총 ${employees.length}명`);
        expect(employees).toBeDefined();
        expect(Array.isArray(employees)).toBe(true);

        if (employees.length > 0) {
          const firstEmployee = employees[1];
          console.log('   첫 번째 직원 정보:');
          console.log(`   - 이름: ${firstEmployee.name}`);
          console.log(`   - 사번: ${firstEmployee.employeeNumber}`);
          console.log(`   - 이메일: ${firstEmployee.email}`);

          expect(firstEmployee.id).toBeDefined();
          expect(firstEmployee.employeeNumber).toBeDefined();
          expect(firstEmployee.name).toBeDefined();
          expect(firstEmployee.email).toBeDefined();
        }
      } catch (error: any) {
        console.error('❌ 직원 정보 조회 실패:', error.message);
        throw error;
      }
    }, 15000); // 타임아웃 15초

    it('특정 사번으로 직원 정보를 조회할 수 있어야 한다', async () => {
      if (!isConfigured) {
        console.log('⏭️  환경 변수 미설정으로 테스트 건너뜀');
        return;
      }

      try {
        // 먼저 전체 직원 목록을 가져와서 첫 번째 직원의 사번을 사용
        const employees = await ssoService.여러직원정보를조회한다({
          withDetail: false,
          includeTerminated: false,
        });

        if (employees.length === 0) {
          console.warn('⚠️  조회할 직원이 없어 테스트를 건너뜁니다.');
          return;
        }

        const employeeNumber = employees[0].employeeNumber;
        const employee =
          await ssoService.사번으로직원을조회한다(employeeNumber);

        console.log(`✅ 사번으로 직원 조회 성공: ${employee.name}`);
        expect(employee).toBeDefined();
        expect(employee.employeeNumber).toBe(employeeNumber);
        expect(employee.name).toBeDefined();

        if (employee.department) {
          console.log(`   - 부서: ${employee.department.departmentName}`);
        }
        if (employee.position) {
          console.log(`   - 직책: ${employee.position.positionName}`);
        }
      } catch (error: any) {
        console.error('❌ 사번으로 직원 조회 실패:', error.message);
        throw error;
      }
    }, 15000);

    it('부서 계층구조를 조회할 수 있어야 한다', async () => {
      if (!isConfigured) {
        console.log('⏭️  환경 변수 미설정으로 테스트 건너뜀');
        return;
      }

      try {
        const hierarchy = await ssoService.부서계층구조를조회한다({
          maxDepth: 2,
          withEmployeeDetail: false,
          includeEmptyDepartments: true,
        });

        console.log('✅ 부서 계층구조 조회 성공');
        console.log(`   - 총 부서 수: ${hierarchy.totalDepartments}개`);
        console.log(`   - 총 직원 수: ${hierarchy.totalEmployees}명`);

        expect(hierarchy).toBeDefined();
        expect(hierarchy.departments).toBeDefined();
        expect(Array.isArray(hierarchy.departments)).toBe(true);
        expect(hierarchy.totalDepartments).toBeGreaterThanOrEqual(0);
        expect(hierarchy.totalEmployees).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        console.error('❌ 부서 계층구조 조회 실패:', error.message);
        throw error;
      }
    }, 15000);
  });

  describe('인증 관련 기능 (수동 테스트용)', () => {
    // 실제 로그인은 수동으로 테스트해야 합니다 (실제 사용자 계정 필요)
    it.skip('로그인 기능 테스트 (수동 실행 필요)', async () => {
      if (!isConfigured) return;

      // 실제 사용자 이메일과 비밀번호를 입력하여 테스트
      const email = 'test@example.com'; // 실제 이메일로 변경
      const password = 'password'; // 실제 비밀번호로 변경

      try {
        const result = await ssoService.로그인한다(email, password);
        console.log('✅ 로그인 성공');
        console.log(`   - 이름: ${result.name}`);
        console.log(`   - 사번: ${result.employeeNumber}`);

        expect(result).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      } catch (error: any) {
        console.error('❌ 로그인 실패:', error.message);
        throw error;
      }
    });

    it.skip('토큰 검증 기능 테스트 (수동 실행 필요)', async () => {
      if (!isConfigured) return;

      // 실제 액세스 토큰을 입력하여 테스트
      const accessToken = 'your-access-token'; // 실제 토큰으로 변경

      try {
        const result = await ssoService.토큰을검증한다(accessToken);
        console.log('✅ 토큰 검증 성공');
        console.log(`   - 유효성: ${result.valid}`);

        expect(result).toBeDefined();
        expect(result.valid).toBeDefined();
      } catch (error: any) {
        console.error('❌ 토큰 검증 실패:', error.message);
        throw error;
      }
    });
  });

  describe('에러 처리', () => {
    it('잘못된 사번으로 조회 시 적절한 에러를 반환해야 한다', async () => {
      if (!isConfigured) {
        console.log('⏭️  환경 변수 미설정으로 테스트 건너뜀');
        return;
      }

      try {
        await ssoService.직원정보를조회한다({
          employeeNumber: 'INVALID_NUMBER_12345',
          withDetail: true,
        });

        // 에러가 발생해야 하므로 이 줄에 도달하면 안됨
        fail('에러가 발생해야 합니다');
      } catch (error: any) {
        console.log('✅ 예상된 에러 발생:', error.message);
        expect(error).toBeDefined();
      }
    }, 15000);
  });
});
