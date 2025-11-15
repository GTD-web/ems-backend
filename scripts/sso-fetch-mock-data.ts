/**
 * SSO 실제 연동 테스트 스크립트
 * 
 * 실제 SSO 서비스에 연동하여 응답 데이터를 JSON 파일로 저장합니다.
 * 저장된 JSON 파일은 테스트 환경에서 Mock 서비스가 사용합니다.
 * 
 * 사용법:
 *   npm run sso:fetch-mock-data
 *   또는
 *   ts-node scripts/sso-fetch-mock-data.ts
 * 
 * 환경 변수:
 *   SSO_BASE_URL: SSO 서버 URL
 *   SSO_CLIENT_ID: SSO 클라이언트 ID
 *   SSO_CLIENT_SECRET: SSO 클라이언트 Secret
 *   SSO_SYSTEM_NAME: SSO 시스템 이름 (기본값: EMS-PROD)
 *   SSO_ENABLE_JSON_STORAGE: JSON 저장 활성화 (기본값: true)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SSOService } from '../src/domain/common/sso';
import type { ISSOService } from '../src/domain/common/sso/interfaces';
import { Logger } from '@nestjs/common';

async function fetchSSOMockData() {
  const logger = new Logger('SSOFetchMockData');

  logger.log('SSO Mock 데이터 수집을 시작합니다...');
  logger.log('환경 변수 확인:');
  logger.log(`  SSO_BASE_URL: ${process.env.SSO_BASE_URL || '설정되지 않음'}`);
  logger.log(`  SSO_CLIENT_ID: ${process.env.SSO_CLIENT_ID ? '***' : '설정되지 않음'}`);
  logger.log(`  SSO_CLIENT_SECRET: ${process.env.SSO_CLIENT_SECRET ? '***' : '설정되지 않음'}`);
  logger.log(`  SSO_SYSTEM_NAME: ${process.env.SSO_SYSTEM_NAME || 'EMS-PROD'}`);
  logger.log(`  SSO_ENABLE_JSON_STORAGE: ${process.env.SSO_ENABLE_JSON_STORAGE || 'true'}`);

  // JSON 저장 강제 활성화 (이 스크립트의 목적)
  process.env.SSO_ENABLE_JSON_STORAGE = 'true';
  // 서버리스 환경 감지 비활성화
  delete process.env.VERCEL;
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  delete process.env.GOOGLE_CLOUD_FUNCTION;
  delete process.env.AZURE_FUNCTIONS_ENVIRONMENT;
  process.env.NODE_ENV = 'development';

  try {
    // NestJS 애플리케이션 생성
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
    });

    // SSO 서비스 가져오기
    const ssoService = app.get(SSOService);

    logger.log('SSO 서비스 초기화 중...');
    await ssoService.초기화한다();
    logger.log('SSO 서비스 초기화 완료');

    // 1. 부서 계층구조 조회
    logger.log('\n=== 부서 계층구조 조회 ===');
    try {
      const hierarchy = await ssoService.부서계층구조를조회한다({
        includeEmptyDepartments: true,
        withEmployeeDetail: false,
      });
      logger.log(`부서 계층구조 조회 완료: ${hierarchy.totalDepartments}개 부서`);
    } catch (error) {
      logger.error(`부서 계층구조 조회 실패: ${error.message}`);
    }

    // 2. 모든 부서 정보 조회
    logger.log('\n=== 모든 부서 정보 조회 ===');
    try {
      const departments = await ssoService.모든부서정보를조회한다({
        includeEmptyDepartments: true,
      });
      logger.log(`모든 부서 정보 조회 완료: ${departments.length}개 부서`);
    } catch (error) {
      logger.error(`모든 부서 정보 조회 실패: ${error.message}`);
    }

    // 3. 모든 직원 정보 조회 (부서 계층구조 방식)
    logger.log('\n=== 모든 직원 정보 조회 (부서 계층구조) ===');
    try {
      const employees = await ssoService.모든직원정보를조회한다({
        includeEmptyDepartments: true,
      });
      logger.log(`모든 직원 정보 조회 완료: ${employees.length}명`);
    } catch (error) {
      logger.error(`모든 직원 정보 조회 실패: ${error.message}`);
    }

    // 4. 여러 직원 원시 정보 조회 (동기화용)
    logger.log('\n=== 여러 직원 원시 정보 조회 ===');
    try {
      const rawEmployees = await ssoService.여러직원원시정보를조회한다({
        withDetail: true,
        includeTerminated: false,
      });
      logger.log(`여러 직원 원시 정보 조회 완료: ${rawEmployees.length}명`);
    } catch (error) {
      logger.error(`여러 직원 원시 정보 조회 실패: ${error.message}`);
    }

    // 5. 직원 관리자 정보 조회
    logger.log('\n=== 직원 관리자 정보 조회 ===');
    try {
      const managers = await ssoService.직원관리자정보를조회한다();
      logger.log(`직원 관리자 정보 조회 완료: ${managers.total}명`);
    } catch (error) {
      logger.error(`직원 관리자 정보 조회 실패: ${error.message}`);
    }

    // 6. 특정 직원 정보 조회 (예시 - 사번이 있다면)
    const testEmployeeNumber = process.env.TEST_EMPLOYEE_NUMBER;
    if (testEmployeeNumber) {
      logger.log(`\n=== 특정 직원 정보 조회 (사번: ${testEmployeeNumber}) ===`);
      try {
        const employee = await ssoService.사번으로직원을조회한다(
          testEmployeeNumber,
        );
        logger.log(`직원 정보 조회 완료: ${employee.name} (${employee.email})`);
      } catch (error) {
        logger.error(`직원 정보 조회 실패: ${error.message}`);
      }
    }

    logger.log('\n=== SSO Mock 데이터 수집 완료 ===');
    logger.log(
      '생성된 JSON 파일은 src/domain/common/sso/mock-data/ 폴더에 저장되었습니다.',
    );

    await app.close();
  } catch (error) {
    logger.error('SSO Mock 데이터 수집 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  fetchSSOMockData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { fetchSSOMockData };

