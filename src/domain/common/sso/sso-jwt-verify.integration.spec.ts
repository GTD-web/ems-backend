/**
 * JWT 토큰 검증 상세 테스트
 *
 * 실제 로그인 후 JWT 토큰 검증 시 반환되는 데이터를 상세히 확인합니다.
 *
 * 실행: npm test -- sso-jwt-verify.integration.spec.ts
 */

import * as dotenv from 'dotenv';
import { SSOClient } from '@lumir-company/sso-sdk';

// .env 파일 로드
dotenv.config();

describe('JWT 토큰 검증 상세 테스트', () => {
  let client: any;
  let isConfigured: boolean;

  beforeAll(async () => {
    // 환경 변수 확인
    isConfigured =
      !!process.env.SSO_BASE_URL &&
      !!process.env.SSO_CLIENT_ID &&
      !!process.env.SSO_CLIENT_SECRET;

    if (!isConfigured) {
      console.warn('⚠️  SSO 환경 변수가 설정되지 않아 테스트를 건너뜁니다.');
      return;
    }

    client = new SSOClient({
      baseUrl: process.env.SSO_BASE_URL || 'https://lsso.vercel.app',
      clientId: process.env.SSO_CLIENT_ID,
      clientSecret: process.env.SSO_CLIENT_SECRET,
      enableLogging: false,
    });

    await client.initialize();
  });

  describe('로그인 및 토큰 검증', () => {
    // 실제 계정으로 JWT 토큰 검증 결과 확인
    it('실제 로그인 후 JWT 토큰 검증 결과를 확인한다', async () => {
      if (!isConfigured) {
        console.log('⏭️  환경 변수 미설정으로 테스트 건너뜀');
        return;
      }

      // ⚠️  실제 사용자 계정으로 변경하세요
      const email = 'kim.jongsik@lumir.space'; // 실제 이메일
      const password = '1111'; // 실제 비밀번호

      console.log('🔄 로그인 시도...');
      const loginResult: any = await client.sso.login(email, password);

      console.log('\n✅ 로그인 성공!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 로그인 결과 (전체):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(loginResult, null, 2));

      console.log('\n🔄 액세스 토큰 검증...');
      const verifyResult: any = await client.sso.verifyToken(
        loginResult.accessToken,
      );

      console.log('\n✅ 토큰 검증 완료!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 토큰 검증 결과 (전체):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(verifyResult, null, 2));

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 필드별 분석:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 기본 필드
      const basicFields = ['valid', 'id', 'email', 'name', 'employeeNumber'];
      basicFields.forEach((field) => {
        const value = verifyResult[field];
        const status = value !== undefined ? '✓' : '✗';
        console.log(`${status} ${field}: ${JSON.stringify(value)}`);
      });

      // 모든 필드 출력
      console.log('\n모든 필드:');
      Object.keys(verifyResult).forEach((key) => {
        console.log(`  - ${key}: ${JSON.stringify(verifyResult[key])}`);
      });

      // 역할 관련 필드 확인
      const roleFields = [
        'roles',
        'role',
        'permissions',
        'groups',
        'authorities',
      ];
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 역할(Role) 관련 필드 확인:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      let roleFound = false;
      roleFields.forEach((field) => {
        if (verifyResult[field] !== undefined) {
          console.log(`✓ ${field}: ${JSON.stringify(verifyResult[field])}`);
          roleFound = true;
        }
      });

      if (!roleFound) {
        console.log('❌ 역할 관련 필드가 없습니다.');
        console.log('   → 역할은 애플리케이션 자체 DB에서 관리해야 합니다.');
      }

      // 직원 정보 조회
      if (verifyResult.employeeNumber) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👔 직원 상세 정보 조회:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const employeeInfo: any = await client.organization.getEmployee({
          employeeNumber: verifyResult.employeeNumber,
          withDetail: true,
        });

        console.log(JSON.stringify(employeeInfo, null, 2));

        if (employeeInfo.department) {
          console.log(
            `\n✓ 부서: ${employeeInfo.department.departmentName} (${employeeInfo.department.departmentCode})`,
          );
        }
        if (employeeInfo.position) {
          console.log(`✓ 직책: ${employeeInfo.position.positionName || 'N/A'}`);
        }
        if (employeeInfo.jobTitle) {
          console.log(`✓ 직급: ${employeeInfo.jobTitle.jobTitleName || 'N/A'}`);
        }
      }

      // 어설션
      expect(verifyResult).toBeDefined();
      expect(verifyResult.valid).toBe(true);
    }, 30000);
  });
});
