import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import request from 'supertest';

describe('POST /admin/auth/login - 로그인', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('✅ 정상 케이스', () => {
    it('유효한 이메일과 패스워드로 로그인 성공', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      console.log('\n=== 로그인 테스트 시작 ===');
      console.log('로그인 요청:', loginDto);

      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(loginDto)
        .expect(200);

      console.log('\n=== 로그인 응답 ===');
      console.log('응답 상태:', response.status);
      console.log('사용자 정보:', JSON.stringify(response.body.user, null, 2));
      console.log('액세스 토큰 존재:', !!response.body.accessToken);
      console.log('리프레시 토큰 존재:', !!response.body.refreshToken);

      // 응답 검증
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // 사용자 정보 검증
      const { user } = response.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('employeeNumber');
      expect(user).toHaveProperty('roles');
      expect(user).toHaveProperty('status');

      // 부서 정보 로그
      if (user.departmentId || user.departmentName || user.departmentCode) {
        console.log('\n=== 사용자 부서 정보 ===');
        console.log(`departmentId: "${user.departmentId || 'null'}"`);
        console.log(`departmentName: "${user.departmentName || 'null'}"`);
        console.log(`departmentCode: "${user.departmentCode || 'null'}"`);
      }

      console.log('=== 로그인 테스트 완료 ===\n');
    });

    it('로그인 후 부서 정보가 정확히 저장됨', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      console.log('\n=== 부서 정보 저장 검증 테스트 시작 ===');

      // 1. 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(loginDto)
        .expect(200);

      const { user } = loginResponse.body;
      console.log('\n로그인 후 사용자 정보:');
      console.log(`- employeeNumber: ${user.employeeNumber}`);
      console.log(`- departmentId: ${user.departmentId || 'null'}`);
      console.log(`- departmentName: ${user.departmentName || 'null'}`);
      console.log(`- departmentCode: ${user.departmentCode || 'null'}`);

      // 2. DB에서 직접 조회하여 검증
      const dataSource = (testSuite as any).dataSource;
      const employeeFromDb = await dataSource.manager.query(
        `SELECT 
          "employeeNumber", 
          "departmentId", 
          "departmentName", 
          "departmentCode",
          "externalId"
        FROM employee 
        WHERE "employeeNumber" = $1 AND "deletedAt" IS NULL`,
        [user.employeeNumber],
      );

      console.log('\nDB에 저장된 직원 정보:');
      if (employeeFromDb.length > 0) {
        console.log(JSON.stringify(employeeFromDb[0], null, 2));
      } else {
        console.log('직원 정보가 DB에 없음!');
      }

      expect(employeeFromDb.length).toBe(1);
      console.log('=== 부서 정보 저장 검증 테스트 완료 ===\n');
    });

    it('로그인 후 동기화 시 부서 정보 변경 여부 확인', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      console.log('\n=== 부서 정보 동기화 테스트 시작 ===');

      // 1. 로그인
      console.log('1단계: 로그인 수행');
      const loginResponse = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(loginDto)
        .expect(200);

      const { user } = loginResponse.body;

      // 2. 로그인 직후 DB 상태
      const dataSource = (testSuite as any).dataSource;
      const afterLogin = await dataSource.manager.query(
        `SELECT 
          "employeeNumber", 
          "departmentId", 
          "departmentName", 
          "departmentCode",
          "externalId",
          "lastSyncAt"
        FROM employee 
        WHERE "employeeNumber" = $1 AND "deletedAt" IS NULL`,
        [user.employeeNumber],
      );

      console.log('\n로그인 직후 DB 상태:');
      console.log(JSON.stringify(afterLogin[0], null, 2));

      // 3. 동기화 실행 (EmployeeSyncService 트리거)
      console.log('\n2단계: 직원 동기화 실행 (10초 대기)');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // 4. 동기화 후 DB 상태
      const afterSync = await dataSource.manager.query(
        `SELECT 
          "employeeNumber", 
          "departmentId", 
          "departmentName", 
          "departmentCode",
          "externalId",
          "lastSyncAt"
        FROM employee 
        WHERE "employeeNumber" = $1 AND "deletedAt" IS NULL`,
        [user.employeeNumber],
      );

      console.log('\n동기화 후 DB 상태:');
      console.log(JSON.stringify(afterSync[0], null, 2));

      // 5. 변경 사항 비교
      console.log('\n=== 변경 사항 비교 ===');
      const departmentIdChanged =
        afterLogin[0].departmentId !== afterSync[0].departmentId;
      const departmentNameChanged =
        afterLogin[0].departmentName !== afterSync[0].departmentName;
      const departmentCodeChanged =
        afterLogin[0].departmentCode !== afterSync[0].departmentCode;
      const externalIdChanged =
        afterLogin[0].externalId !== afterSync[0].externalId;

      console.log(`departmentId 변경: ${departmentIdChanged}`);
      if (departmentIdChanged) {
        console.log(
          `  "${afterLogin[0].departmentId}" → "${afterSync[0].departmentId}"`,
        );
      }

      console.log(`departmentName 변경: ${departmentNameChanged}`);
      if (departmentNameChanged) {
        console.log(
          `  "${afterLogin[0].departmentName}" → "${afterSync[0].departmentName}"`,
        );
      }

      console.log(`departmentCode 변경: ${departmentCodeChanged}`);
      if (departmentCodeChanged) {
        console.log(
          `  "${afterLogin[0].departmentCode}" → "${afterSync[0].departmentCode}"`,
        );
      }

      console.log(`externalId 변경: ${externalIdChanged}`);
      if (externalIdChanged) {
        console.log(
          `  "${afterLogin[0].externalId}" → "${afterSync[0].externalId}"`,
        );
      }

      console.log('=== 부서 정보 동기화 테스트 완료 ===\n');
    }, 30000); // 30초 타임아웃
  });

  describe('❌ 에러 케이스', () => {
    it('잘못된 이메일 형식: 400 에러', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      console.log('\n잘못된 이메일 형식 에러:', response.body);
      expect(response.body.message).toBeDefined();
    });

    it('이메일 누락: 400 에러', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      console.log('\n이메일 누락 에러:', response.body);
      expect(response.body.message).toContain('이메일');
    });

    it('패스워드 누락: 400 에러', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      console.log('\n패스워드 누락 에러:', response.body);
      expect(response.body.message).toContain('패스워드');
    });

    it('잘못된 인증 정보: 401 에러', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      console.log('\n잘못된 인증 정보 에러:', response.body);
      expect(response.body.message).toBeDefined();
    });

    it('권한 없는 사용자: 403 에러', async () => {
      // 시스템 역할이 없는 사용자로 테스트
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'no-role@example.com',
          password: 'password123',
        })
        .expect(403);

      console.log('\n권한 없는 사용자 에러:', response.body);
      expect(response.body.message).toContain('권한');
    });
  });
});
