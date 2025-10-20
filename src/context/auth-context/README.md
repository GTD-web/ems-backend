# Auth Context (인증 컨텍스트)

인증 및 사용자 정보 관리를 담당하는 컨텍스트입니다.

## 📋 목차

1. [개요](#개요)
2. [핵심 기능](#핵심-기능)
3. [아키텍처](#아키텍처)
4. [주요 컴포넌트](#주요-컴포넌트)
5. [사용 방법](#사용-방법)
6. [데이터 흐름](#데이터-흐름)

---

## 개요

Auth Context는 JWT 토큰 검증 시마다 **SSO 서버와 내부 Employee 데이터를 자동으로 동기화**하여 항상 최신 상태의 사용자 정보와 역할을 유지합니다.

### 주요 특징

- ✅ **자동 동기화**: JWT 검증 시 Employee 정보와 역할을 자동 업데이트
- ✅ **CQRS 패턴**: Command/Query 분리로 책임 명확화
- ✅ **역할 관리**: EMS-PROD 시스템 역할을 Employee에 저장 및 관리
- ✅ **Upsert 지원**: 신규 사용자는 생성, 기존 사용자는 업데이트
- ✅ **JwtAuthGuard 통합**: 전역 인증 가드에서 자동으로 사용자 동기화 수행

---

## 핵심 기능

### 1. 토큰 검증 및 사용자 동기화

JWT 토큰을 검증하고, 동시에 다음 작업을 수행합니다:

1. **SSO 서버 토큰 검증**
2. **SSO에서 직원 상세 정보 조회**
3. **Employee 엔티티 생성/업데이트** (Upsert)
4. **역할 정보 업데이트** (`EMS-PROD` 시스템 역할)
5. **최신 사용자 정보 반환**

### 2. 역할 포함 사용자 조회

직원 번호로 Employee 정보와 역할을 함께 조회합니다.

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Auth Context                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐        ┌────────────────────────┐ │
│  │  AuthService    │───────>│ VerifyAndSyncUserHandler│ │
│  │  (Facade)       │        └────────────────────────┘ │
│  └─────────────────┘                │                    │
│         │                            │                    │
│         │                            ▼                    │
│         │                  ┌──────────────────┐          │
│         │                  │  SSOService      │          │
│         │                  │  (Token Verify)  │          │
│         │                  └──────────────────┘          │
│         │                            │                    │
│         │                            ▼                    │
│         │                  ┌──────────────────┐          │
│         │                  │  EmployeeService │          │
│         │                  │  (CRUD + Roles)  │          │
│         │                  └──────────────────┘          │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────────┐                                │
│  │ GetUserWithRoles    │                                │
│  │ Handler             │                                │
│  └─────────────────────┘                                │
│                                                           │
└─────────────────────────────────────────────────────────┘
              ▲
              │
    ┌─────────┴─────────┐
    │  JwtAuthGuard     │  (Interface Layer)
    │  (Global Guard)   │
    └───────────────────┘
```

---

## 주요 컴포넌트

### 1. AuthService

인증 컨텍스트의 Facade 서비스입니다.

```typescript
class AuthService {
  // 토큰 검증 및 사용자 동기화
  async 토큰검증및사용자동기화(
    accessToken: string,
  ): Promise<VerifyAndSyncUserResult>;

  // 역할 포함 사용자 조회
  async 역할포함사용자조회(
    employeeNumber: string,
  ): Promise<GetUserWithRolesResult>;
}
```

### 2. VerifyAndSyncUserHandler

토큰 검증 및 사용자 동기화를 수행하는 핵심 핸들러입니다.

**처리 흐름:**

1. SSO 서버에 토큰 검증 요청
2. 유효하지 않은 토큰이면 `UnauthorizedException` 발생
3. SSO에서 직원 상세 정보 조회
4. Employee 엔티티 조회 (employeeNumber로)
5. 존재하면 업데이트, 없으면 생성
6. 역할 정보 업데이트 (`EMS-PROD` 시스템 역할)
7. 최신 정보 재조회 후 반환

### 3. GetUserWithRolesHandler

직원 번호로 사용자 정보와 역할을 조회하는 핸들러입니다.

---

## 사용 방법

### 1. JwtAuthGuard에서 자동 사용 (기본)

Auth Context는 **JwtAuthGuard에서 자동으로 사용**되므로 별도 호출이 필요 없습니다.

```typescript
@Controller('api')
export class SomeController {
  // 인증이 필요한 엔드포인트
  @Get('protected')
  async getProtectedData(@CurrentUser() user: AuthenticatedUser) {
    // user.roles에 EMS-PROD 시스템 역할이 포함됨
    console.log(user.roles); // ['admin', 'manager']
    return { message: 'Success', user };
  }
}
```

**동작:**

1. 클라이언트가 JWT 토큰을 헤더에 포함하여 요청
2. `JwtAuthGuard`가 `AuthService.토큰검증및사용자동기화()` 호출
3. Employee 정보와 역할이 자동으로 동기화됨
4. `@CurrentUser()` 데코레이터로 인증된 사용자 정보 접근 가능

### 2. 직접 사용 (특수한 경우)

```typescript
@Injectable()
export class SomeService {
  constructor(private readonly authService: AuthService) {}

  async syncUserManually(accessToken: string) {
    // 토큰 검증 및 사용자 동기화
    const result = await this.authService.토큰검증및사용자동기화(accessToken);

    console.log('사용자 ID:', result.user.id);
    console.log('이메일:', result.user.email);
    console.log('역할:', result.user.roles);
    console.log('동기화 여부:', result.isSynced);
  }

  async getUserInfo(employeeNumber: string) {
    // 역할 포함 사용자 조회
    const result = await this.authService.역할포함사용자조회(employeeNumber);

    if (result.user) {
      console.log('사용자:', result.user.name);
      console.log('역할:', result.user.roles);
    }
  }
}
```

---

## 데이터 흐름

### JWT 검증 및 동기화 흐름

```
┌─────────────┐      JWT Token        ┌──────────────┐
│   Client    │──────────────────────>│ JwtAuthGuard │
└─────────────┘                        └──────────────┘
                                              │
                                              ▼
                                      ┌──────────────────┐
                                      │  AuthService     │
                                      │  토큰검증및      │
                                      │  사용자동기화    │
                                      └──────────────────┘
                                              │
                ┌─────────────────────────────┼─────────────────────────────┐
                │                             │                             │
                ▼                             ▼                             ▼
        ┌──────────────┐            ┌──────────────┐             ┌──────────────┐
        │ SSOService   │            │ EmployeeService│             │ Employee DB  │
        │ 토큰검증     │            │ findByNumber  │             │              │
        │ 직원정보조회 │            │ create/update │             │  roles 저장  │
        └──────────────┘            │ updateRoles   │             │              │
                                    └──────────────┘             └──────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ AuthenticatedUser│
                                    │ - id             │
                                    │ - email          │
                                    │ - roles          │
                                    └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  request['user'] │
                                    │  주입 완료       │
                                    └──────────────────┘
```

---

## 인터페이스 정의

### AuthenticatedUserInfo

```typescript
interface AuthenticatedUserInfo {
  id: string; // Employee ID
  externalId: string; // SSO user ID
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[]; // EMS-PROD 시스템 역할
  status: string;
}
```

### VerifyAndSyncUserResult

```typescript
interface VerifyAndSyncUserResult {
  user: AuthenticatedUserInfo;
  isSynced: boolean; // Employee 정보가 동기화되었는지 여부
}
```

---

## Employee 엔티티 roles 필드

Auth Context는 Employee 엔티티에 **`roles` 필드**를 추가하여 역할 정보를 저장합니다.

```typescript
@Entity('employee')
export class Employee extends BaseEntity {
  // ... 기존 필드들

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'EMS-PROD 시스템 역할 목록',
  })
  roles?: string[];
}
```

**저장 예시:**

```json
{
  "roles": ["admin", "manager", "user"]
}
```

---

## 에러 처리

### 1. UnauthorizedException

- 토큰이 유효하지 않은 경우
- SSO 서버 검증 실패

### 2. ForbiddenException

- EMS-PROD 시스템 역할이 없는 경우 (SSOService 레벨에서 처리)

---

## 테스트

```bash
# 단위 테스트
npm test -- src/context/auth-context

# E2E 테스트 (실제 SSO 연동)
# .env 파일에 SSO 설정 필요
npm run test:e2e -- auth-context
```

---

## 참고 문서

- [SSO 모듈 문서](../../domain/common/sso/README.md)
- [Employee 서비스](../../domain/common/employee)
- [JwtAuthGuard](../../interface/guards/jwt-auth.guard.ts)

---

**작성일**: 2024-10-20
**최종 수정일**: 2024-10-20
