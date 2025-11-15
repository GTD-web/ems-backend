# Guards (인증/인가 가드)

## 개요

인증(Authentication) 및 인가(Authorization)를 담당하는 가드입니다.

## 가드 목록

### 1. JwtAuthGuard (인증)

JWT 토큰을 검증하고 사용자 정보를 Request에 주입합니다.

**특징:**

- 전역으로 적용됨 (`src/interface/interface.module.ts`)
- `@Public()` 데코레이터로 인증 제외 가능
- 토큰 검증 후 직원 정보를 조회하여 역할 정보도 함께 저장

**사용법:**

```typescript
// 자동으로 적용되므로 별도 선언 불필요

// 인증 제외가 필요한 경우
@Public()
@Get('public')
getPublicData() {
  return { message: 'Public data' };
}
```

**Request.user 구조:**

```typescript
{
  id: string;
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[]; // EMS-PROD 시스템 역할
}
```

### 2. RolesGuard (인가)

EMS-PROD 시스템의 역할을 검증합니다.

**특징:**

- `@Roles()` 데코레이터와 함께 사용
- 필요한 역할 중 하나라도 매칭되면 통과
- JwtAuthGuard 이후에 실행되어야 함

**사용법:**

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@interface/guards';
import { Roles } from '@interface/decorators';

// 단일 역할 검증
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin/users')
getAdminUsers() {
  return this.userService.getAll();
}

// 여러 역할 중 하나라도 있으면 통과
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Post('users')
createUser(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}

// 컨트롤러 전체에 적용
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // 모든 메서드에 admin 역할 필요

  @Get('users')
  getUsers() { ... }

  @Post('users')
  createUser() { ... }

  // 특정 메서드만 다른 역할 허용
  @Roles('admin', 'super-admin')
  @Delete('users/:id')
  deleteUser() { ... }
}
```

## 데코레이터

### @Public()

인증을 건너뛰는 데코레이터입니다.

```typescript
import { Public } from '@interface/decorators';

@Public()
@Post('login')
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### @Roles(...roles: string[])

필요한 역할을 지정하는 데코레이터입니다.

```typescript
import { Roles } from '@interface/decorators';

// 단일 역할
@Roles('admin')

// 여러 역할 (OR 조건)
@Roles('admin', 'manager', 'super-admin')
```

### @CurrentUser()

현재 인증된 사용자 정보를 주입하는 데코레이터입니다.

```typescript
import { CurrentUser } from '@interface/decorators';
import { AuthenticatedUser } from '@interface/guards';

@Get('me')
getMe(@CurrentUser() user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
  };
}
```

## 전체 예시

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, AuthenticatedUser } from '@interface/guards';
import { Public, Roles, CurrentUser } from '@interface/decorators';

@Controller('api')
export class ExampleController {
  // 1. 인증 필요 (전역 JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Your profile',
      user,
    };
  }

  // 2. 인증 제외
  @Public()
  @Get('public')
  getPublic() {
    return { message: 'Public endpoint' };
  }

  // 3. 인증 + admin 역할 필요
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/settings')
  getSettings() {
    return { message: 'Admin settings' };
  }

  // 4. 인증 + admin 또는 manager 역할 필요
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @Post('users')
  createUser(@Body() createUserDto: any) {
    return { message: 'User created' };
  }
}
```

## 에러 응답

### 인증 실패 (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "인증 토큰이 필요합니다.",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 401,
  "message": "유효하지 않은 토큰입니다.",
  "error": "Unauthorized"
}
```

### 인가 실패 (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "이 작업을 수행할 권한이 없습니다. 필요한 역할: admin",
  "error": "Forbidden"
}
```

## 역할 관리

### 역할 정보 출처

현재 구현에서는 각 API 요청 시마다 SSO 서버에서 직원 정보를 조회하여 역할을 가져옵니다.

**장점:**

- 항상 최신 역할 정보 사용
- 별도의 동기화 불필요

**단점:**

- 매 요청마다 추가 API 호출 (성능 저하 가능)

### 성능 최적화 방안

1. **Redis 캐싱**

   ```typescript
   // 로그인 시 역할을 Redis에 저장
   await redis.set(`user:${userId}:roles`, JSON.stringify(roles), 'EX', 3600);

   // API 요청 시 Redis에서 조회
   const cachedRoles = await redis.get(`user:${userId}:roles`);
   ```

2. **DB 저장**

   ```typescript
   // 로그인 시 역할을 DB에 저장/업데이트
   await this.userRoleRepository.syncRoles(userId, roles);

   // API 요청 시 DB에서 조회
   const roles = await this.userRoleRepository.findRolesByUserId(userId);
   ```

3. **메모리 캐시**
   ```typescript
   // NestJS Cache Manager 사용
   @UseInterceptors(CacheInterceptor)
   ```

## 테스트

```bash
# JwtAuthGuard 테스트
npm test -- src/interface/guards/jwt-auth.guard.spec.ts

# RolesGuard 테스트
npm test -- src/interface/guards/roles.guard.spec.ts
```

## 참고

- [NestJS Guards 공식 문서](https://docs.nestjs.com/guards)
- [JWT 인증 가이드](https://docs.nestjs.com/security/authentication)
