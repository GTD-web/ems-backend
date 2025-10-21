# Authentication API Reference

인증 API 기술 레퍼런스

---

## 목차

1. [API 개요](#api-개요)
2. [인증 메커니즘](#인증-메커니즘)
3. [API 엔드포인트](#api-엔드포인트)
4. [데이터 모델](#데이터-모델)
5. [에러 처리](#에러-처리)
6. [보안 고려사항](#보안-고려사항)
7. [테스트 케이스](#테스트-케이스)

---

## API 개요

### Base URL

```
/admin/auth
```

### 버전 정보

- **API Version**: 1.0.0
- **NestJS Controller**: `AuthController`
- **Swagger Tag**: `A-0-0. 인증`

### 기술 스택

- **Framework**: NestJS
- **Authentication**: JWT (JSON Web Token)
- **SSO Integration**: 외부 SSO 서버 연동
- **ORM**: TypeORM
- **Validation**: class-validator, class-transformer

---

## 인증 메커니즘

### SSO 기반 인증 흐름

```
┌─────────┐      1. Login Request      ┌─────────────┐
│ Client  │ ──────────────────────────> │  API Server │
└─────────┘                             └─────────────┘
                                               │
                                               │ 2. Authenticate
                                               ▼
                                        ┌─────────────┐
                                        │ SSO Server  │
                                        └─────────────┘
                                               │
                                               │ 3. User Info + Roles
                                               ▼
                                        ┌─────────────┐
                                        │  API Server │
                                        │ - Verify Role
                                        │ - Sync Employee
                                        │ - Generate JWT
                                        └─────────────┘
                                               │
                                               │ 4. Response
┌─────────┐      User Info + JWT        ┌─────────────┐
│ Client  │ <────────────────────────── │  API Server │
└─────────┘                             └─────────────┘
```

### JWT 토큰 구조

**Payload:**

```typescript
interface JwtPayload {
  sub: string; // 사용자 ID
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[];
  iat: number; // Issued At
  exp: number; // Expiration
}
```

---

## API 엔드포인트

### 1. 로그인 (SSO)

```http
POST /admin/auth/login
```

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```typescript
interface LoginDto {
  email: string; // 이메일 (필수, 유효한 이메일 형식)
  password: string; // 패스워드 (필수)
}
```

**Response: 200 OK**

```typescript
interface LoginResponseDto {
  user: UserInfoDto;
  accessToken: string; // JWT 액세스 토큰
  refreshToken: string; // JWT 리프레시 토큰
}

interface UserInfoDto {
  id: string; // Employee ID (UUID)
  externalId: string; // SSO User ID
  email: string;
  name: string;
  employeeNumber: string; // 사번
  roles: string[]; // EMS-PROD 역할 목록
  status: string; // 직원 상태 (재직중, 퇴사 등)
}
```

**비즈니스 로직:**

1. **유효성 검증**
   - DTO 검증 (class-validator)
   - 이메일 형식 검증
   - 필수 필드 확인

2. **SSO 인증**

   ```typescript
   const ssoResult = await ssoClient.authenticate(email, password);
   // → SSO 서버에서 사용자 정보 및 시스템별 역할 반환
   ```

3. **역할 검증**

   ```typescript
   const emsRoles = ssoResult.systems.find((s) => s.name === 'EMS-PROD')?.roles;
   if (!emsRoles || emsRoles.length === 0) {
     throw new ForbiddenException('EMS-PROD 시스템 역할이 없습니다.');
   }
   ```

4. **Employee 동기화**

   ```typescript
   const employee = await employeeRepository.findByExternalId(ssoResult.id);
   if (employee) {
     // 업데이트: 이름, 이메일, 상태 등
     await employeeRepository.update(employee.id, { ... });
   } else {
     // 생성: 새 Employee 레코드
     await employeeRepository.create({ externalId: ssoResult.id, ... });
   }
   ```

5. **역할 저장**

   ```typescript
   await userRoleRepository.save({
     userId: employee.id,
     roles: emsRoles,
   });
   ```

6. **JWT 토큰 생성**

   ```typescript
   const payload: JwtPayload = {
     sub: employee.id,
     email: employee.email,
     name: employee.name,
     employeeNumber: employee.employeeNumber,
     roles: emsRoles,
   };

   const accessToken = jwtService.sign(payload, { expiresIn: '1h' });
   const refreshToken = jwtService.sign(payload, { expiresIn: '7d' });
   ```

7. **응답 반환**

**환경 변수:**

- `SSO_API_URL`: SSO 서버 URL
- `SSO_API_KEY`: SSO API 인증 키
- `JWT_SECRET`: JWT 서명 비밀키
- `JWT_ACCESS_EXPIRATION`: 액세스 토큰 만료 시간 (기본: 1h)
- `JWT_REFRESH_EXPIRATION`: 리프레시 토큰 만료 시간 (기본: 7d)

---

### 2. 현재 사용자 정보 조회

```http
GET /admin/auth/me
```

**Request Headers:**

```
Authorization: Bearer <accessToken>
```

**Response: 200 OK**

```typescript
interface UserInfoDto {
  id: string;
  externalId: string;
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[];
  status: string;
}
```

**비즈니스 로직:**

1. **JWT 검증**
   - JWT Guard가 자동으로 토큰 검증
   - 만료 시간 확인
   - 서명 검증

2. **사용자 정보 추출**

   ```typescript
   const user = request.user; // JWT Guard에서 주입
   // user.id, user.email, user.name 등
   ```

3. **최신 정보 조회**

   ```typescript
   const employee = await employeeRepository.findOne({
     where: { employeeNumber: user.employeeNumber },
     relations: ['roles'],
   });
   ```

4. **응답 반환**

**Guard:**

```typescript
@UseGuards(JwtAuthGuard)
```

- 자동으로 `Authorization` 헤더 검증
- 토큰 파싱 및 검증
- `request.user`에 사용자 정보 주입

---

## 데이터 모델

### Employee Entity

```typescript
@Entity('employees')
class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  externalId: string; // SSO User ID

  @Column({ unique: true })
  employeeNumber: string; // 사번

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  status: string; // 재직중, 퇴사 등

  @Column()
  dateOfBirth: Date;

  @Column()
  gender: string;

  @Column()
  hireDate: Date;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column()
  departmentId: string;

  // ... 타임스탬프 및 Soft Delete 필드
}
```

### UserRole Entity

```typescript
@Entity('user_roles')
class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Employee ID

  @Column('simple-array')
  roles: string[]; // ['admin', 'manager', 'user']

  @Column({ default: 'EMS-PROD' })
  system: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 설명           | 발생 시나리오                             |
| ---- | -------------- | ----------------------------------------- |
| 200  | OK             | 로그인 성공, 사용자 정보 조회 성공        |
| 400  | Bad Request    | 유효성 검증 실패 (이메일 형식, 필수 필드) |
| 401  | Unauthorized   | 인증 실패 (잘못된 인증 정보, 만료된 토큰) |
| 403  | Forbidden      | 권한 없음 (EMS-PROD 역할 없음)            |
| 500  | Internal Error | 서버 오류, SSO 서버 연결 실패             |

### 에러 응답 형식

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

**예시:**

```json
{
  "statusCode": 401,
  "message": "이메일 또는 패스워드가 올바르지 않습니다.",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T09:00:00.000Z",
  "path": "/admin/auth/login"
}
```

### 커스텀 예외

```typescript
// 인증 실패
class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('이메일 또는 패스워드가 올바르지 않습니다.');
  }
}

// 역할 없음
class NoSystemRoleException extends ForbiddenException {
  constructor(system: string) {
    super(`${system} 시스템에 대한 접근 권한이 없습니다.`);
  }
}

// SSO 연결 실패
class SsoConnectionException extends InternalServerErrorException {
  constructor() {
    super('SSO 서버 연결에 실패했습니다.');
  }
}
```

---

## 보안 고려사항

### 1. JWT Secret 관리

```typescript
// ✅ 환경 변수로 관리
const jwtSecret = process.env.JWT_SECRET;

// ❌ 하드코딩 금지
const jwtSecret = 'my-secret-key'; // 절대 금지
```

### 2. 토큰 만료 시간

```typescript
// 액세스 토큰: 짧게 (1시간)
const accessTokenExpiration = process.env.JWT_ACCESS_EXPIRATION || '1h';

// 리프레시 토큰: 길게 (7일)
const refreshTokenExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
```

### 3. 비밀번호 보안

- 평문 비밀번호는 절대 저장하지 않음
- SSO 서버에서만 비밀번호 검증
- EMS 시스템은 비밀번호를 알 수 없음

### 4. CORS 설정

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL, // 특정 도메인만 허용
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
```

### 5. Rate Limiting

```typescript
// 로그인 엔드포인트에 Rate Limiting 적용
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 1분에 5회 제한
@Post('login')
async login() { ... }
```

### 6. 입력 검증

```typescript
// XSS 방지: HTML 태그 제거
import { sanitize } from 'class-sanitizer';

@Transform(({ value }) => sanitize(value))
@IsString()
name: string;

// SQL Injection 방지: TypeORM 파라미터화된 쿼리 사용
await repository.findOne({ where: { email } }); // ✅ 안전
await repository.query(`SELECT * FROM users WHERE email = '${email}'`); // ❌ 위험
```

---

## 테스트 케이스

### 단위 테스트 (Unit Tests)

**파일:** `auth.controller.spec.ts`

```typescript
describe('AuthController', () => {
  describe('login', () => {
    it('유효한 인증 정보로 로그인 성공', async () => {
      // Given
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          name: '홍길동',
          employeeNumber: 'E2023001',
          roles: ['admin'],
          status: '재직중',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      jest.spyOn(authService, '로그인한다').mockResolvedValue(mockResult);

      // When
      const result = await controller.login(loginDto);

      // Then
      expect(result).toEqual(mockResult);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('잘못된 이메일 형식으로 400 에러', async () => {
      // Given
      const invalidDto = {
        email: 'invalid-email',
        password: 'password123',
      } as LoginDto;

      // When & Then
      await expect(controller.login(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('EMS-PROD 역할이 없으면 403 에러', async () => {
      // Given
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      jest
        .spyOn(authService, '로그인한다')
        .mockRejectedValue(new ForbiddenException());

      // When & Then
      await expect(controller.login(loginDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMe', () => {
    it('유효한 JWT로 사용자 정보 조회', async () => {
      // Given
      const mockUser: AuthenticatedUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: '홍길동',
        employeeNumber: 'E2023001',
        roles: ['admin'],
      };

      const mockUserInfo = {
        ...mockUser,
        externalId: 'sso-id',
        status: '재직중',
      };

      jest
        .spyOn(authService, '역할포함사용자조회')
        .mockResolvedValue({ user: mockUserInfo });

      // When
      const result = await controller.getMe(mockUser);

      // Then
      expect(result).toEqual(mockUserInfo);
    });
  });
});
```

### E2E 테스트 (End-to-End Tests)

**파일:** `auth.e2e-spec.ts`

```typescript
describe('POST /admin/auth/login', () => {
  it('정상 로그인', () => {
    return request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.user).toBeDefined();
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.user.email).toBe('test@example.com');
      });
  });

  it('잘못된 이메일 형식으로 400 에러', () => {
    return request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'invalid-email',
        password: 'password123',
      })
      .expect(400);
  });

  it('필수 필드 누락으로 400 에러', () => {
    return request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'test@example.com',
      })
      .expect(400);
  });
});

describe('GET /admin/auth/me', () => {
  let accessToken: string;

  beforeEach(async () => {
    // 로그인하여 토큰 획득
    const loginRes = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = loginRes.body.accessToken;
  });

  it('유효한 토큰으로 사용자 정보 조회', () => {
    return request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBe('test@example.com');
        expect(res.body.roles).toBeDefined();
      });
  });

  it('토큰 없이 요청 시 401 에러', () => {
    return request(app.getHttpServer()).get('/admin/auth/me').expect(401);
  });

  it('잘못된 토큰으로 401 에러', () => {
    return request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
```

### 통합 테스트 (Integration Tests)

```typescript
describe('Auth Integration Tests', () => {
  it('로그인 → 사용자 정보 조회 → 보호된 리소스 접근', async () => {
    // Step 1: 로그인
    const loginRes = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      })
      .expect(200);

    const { accessToken } = loginRes.body;

    // Step 2: 사용자 정보 조회
    await request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Step 3: 보호된 리소스 접근
    await request(app.getHttpServer())
      .get('/admin/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
```

---

## 변경 이력

| 버전  | 날짜       | 변경 내용          |
| ----- | ---------- | ------------------ |
| 1.0.0 | 2024-01-15 | 초기 API 문서 작성 |

---

## 참고 자료

### 관련 문서

- [API 사용 가이드](../../../../public/api-docs/admin-auth.md)
- [직원 관리 API](../employee-management/employee-management-api-reference.md)
- [JWT 공식 문서](https://jwt.io)

### 소스 코드

- **Controller**: `src/interface/admin/auth/auth.controller.ts`
- **Service**: `src/context/auth-context/auth.service.ts`
- **Guard**: `src/interface/guards/jwt-auth.guard.ts`
- **Strategy**: `src/context/auth-context/strategies/jwt.strategy.ts`
- **DTO**: `src/interface/admin/auth/dto/`

### 외부 의존성

- **SSO Server**: 사용자 인증 및 역할 관리
- **JWT Library**: `@nestjs/jwt`
- **Passport**: `@nestjs/passport`, `passport-jwt`

---

**작성일**: 2024-01-15  
**최종 수정일**: 2024-01-15  
**작성자**: Development Team
