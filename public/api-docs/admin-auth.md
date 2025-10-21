# Admin Authentication API

인증 API 가이드 - SSO 기반 로그인 및 사용자 정보 조회

---

## 목차

1. [개요](#개요)
2. [빠른 시작](#빠른-시작)
3. [API 엔드포인트](#api-엔드포인트)
4. [사용 시나리오](#사용-시나리오)
5. [보안 가이드](#보안-가이드)
6. [모범 사례](#모범-사례)

---

## 개요

### 목적

SSO(Single Sign-On) 서버와 연동하여 사용자 인증 및 JWT 토큰 발급을 관리합니다.

### 주요 기능

- ✅ SSO 서버 기반 로그인
- ✅ JWT 액세스/리프레시 토큰 발급
- ✅ EMS-PROD 시스템 역할 자동 검증
- ✅ 직원 정보 자동 동기화
- ✅ 현재 로그인 사용자 정보 조회

### 인증 흐름

```
1. 클라이언트 → POST /admin/auth/login (이메일, 패스워드)
2. API 서버 → SSO 서버 인증 요청
3. SSO 서버 → 사용자 인증 및 역할 정보 반환
4. API 서버 → EMS-PROD 역할 검증
5. API 서버 → Employee 정보 동기화 (생성/업데이트)
6. API 서버 → JWT 토큰 생성
7. 클라이언트 ← 사용자 정보 + JWT 토큰 반환
```

---

## 빠른 시작

### 1️⃣ 로그인

```http
POST /admin/auth/login
Content-Type: application/json

{
  "email": "user@lumir.space",
  "password": "password123"
}
```

**응답:**

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "externalId": "sso-user-id-123",
    "email": "user@lumir.space",
    "name": "홍길동",
    "employeeNumber": "E2023001",
    "roles": ["admin", "manager"],
    "status": "재직중"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2️⃣ 현재 사용자 정보 조회

```http
GET /admin/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "externalId": "sso-user-id-123",
  "email": "user@lumir.space",
  "name": "홍길동",
  "employeeNumber": "E2023001",
  "roles": ["admin", "manager"],
  "status": "재직중"
}
```

---

## API 엔드포인트

### 로그인

```http
POST /admin/auth/login
```

**Request Body:**

| 필드     | 타입   | 필수 | 설명        |
| -------- | ------ | ---- | ----------- |
| email    | string | ✅   | 이메일 주소 |
| password | string | ✅   | 패스워드    |

**응답 코드:**

- `200 OK`: 로그인 성공
- `400 Bad Request`: 잘못된 요청 (유효성 검증 실패)
- `401 Unauthorized`: 인증 실패 (이메일 또는 패스워드 불일치)
- `403 Forbidden`: 권한 없음 (EMS-PROD 시스템 역할 없음)

**동작 흐름:**

1. 이메일/패스워드 유효성 검증
2. SSO 서버에 인증 요청
3. SSO 서버로부터 사용자 정보 및 역할 수신
4. EMS-PROD 시스템 역할 검증
5. Employee 테이블에 정보 동기화 (생성 또는 업데이트)
6. 역할 정보 저장
7. JWT 액세스 토큰 및 리프레시 토큰 생성
8. 사용자 정보 + 토큰 반환

---

### 현재 사용자 정보 조회

```http
GET /admin/auth/me
Authorization: Bearer <accessToken>
```

**Request Headers:**

| 헤더          | 값                     | 필수 | 설명            |
| ------------- | ---------------------- | ---- | --------------- |
| Authorization | Bearer `<accessToken>` | ✅   | JWT 액세스 토큰 |

**응답 코드:**

- `200 OK`: 조회 성공
- `401 Unauthorized`: 인증 실패 (토큰 없음, 잘못된 토큰, 만료된 토큰)

**동작:**

- JWT 토큰에서 사용자 정보 추출
- 데이터베이스에서 최신 역할 정보 조회
- 직원 기본 정보 반환

---

## 사용 시나리오

### 시나리오 1: 초기 로그인

**상황:** 사용자가 처음으로 시스템에 로그인

```http
POST /admin/auth/login
```

```json
{
  "email": "newuser@lumir.space",
  "password": "SecurePassword123!"
}
```

**결과:**

1. SSO 서버에서 사용자 인증
2. EMS-PROD 역할 자동 확인
3. Employee 레코드 자동 생성
4. 역할 정보 저장
5. JWT 토큰 발급 및 반환

---

### 시나리오 2: 로그인 후 API 호출

**상황:** 로그인 후 인증이 필요한 API 호출

**Step 1: 로그인**

```http
POST /admin/auth/login
```

응답에서 `accessToken` 획득

**Step 2: 인증 헤더와 함께 API 호출**

```http
GET /admin/dashboard/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**참고:** 모든 보호된 API는 `Authorization` 헤더에 유효한 JWT 토큰이 필요합니다.

---

### 시나리오 3: 토큰 만료 시 처리

**상황:** 액세스 토큰이 만료됨

**Client-side 처리:**

```javascript
// API 호출
const response = await fetch('/admin/dashboard/summary', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

// 401 에러 발생 시
if (response.status === 401) {
  // 리프레시 토큰으로 새 액세스 토큰 발급 (미구현)
  // 또는 재로그인 유도
  redirectToLogin();
}
```

---

### 시나리오 4: 사용자 정보 확인

**상황:** 현재 로그인한 사용자의 역할 확인

```http
GET /admin/auth/me
Authorization: Bearer <accessToken>
```

**결과:**

```json
{
  "id": "...",
  "email": "user@lumir.space",
  "name": "홍길동",
  "roles": ["admin", "manager"],
  "status": "재직중"
}
```

**사용 예시:**

- 사용자 프로필 표시
- 역할 기반 UI 렌더링 (admin 역할만 특정 메뉴 표시)
- 권한 확인

---

## 보안 가이드

### 1. JWT 토큰 저장

**✅ 권장:**

- `httpOnly` 쿠키에 저장 (XSS 공격 방지)
- `localStorage` 대신 `sessionStorage` 사용 (브라우저 닫으면 자동 삭제)

**❌ 비권장:**

- `localStorage`에 저장 (XSS 공격에 취약)
- URL 파라미터에 토큰 포함

**예시 (httpOnly 쿠키):**

```javascript
// 서버에서 쿠키 설정
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true, // HTTPS만
  sameSite: 'strict',
  maxAge: 3600000, // 1시간
});
```

---

### 2. HTTPS 사용

**필수:** 프로덕션 환경에서는 반드시 HTTPS를 사용하여 토큰이 암호화된 채널을 통해 전송되도록 합니다.

```
✅ https://api.example.com/admin/auth/login
❌ http://api.example.com/admin/auth/login
```

---

### 3. 토큰 만료 시간

**기본 설정:**

- **액세스 토큰**: 1시간
- **리프레시 토큰**: 7일

**보안 권장사항:**

- 짧은 액세스 토큰 만료 시간 설정
- 리프레시 토큰으로 자동 갱신 구현
- 민감한 작업은 재인증 요구

---

### 4. 비밀번호 정책

**권장 사항:**

- 최소 8자 이상
- 대소문자, 숫자, 특수문자 조합
- 주기적인 비밀번호 변경 권장
- 이전 비밀번호 재사용 방지

**참고:** 비밀번호 정책은 SSO 서버에서 관리됩니다.

---

### 5. 로그아웃 처리

**클라이언트 측:**

```javascript
// 토큰 삭제
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// 쿠키 삭제
document.cookie =
  'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

// 로그인 페이지로 이동
window.location.href = '/login';
```

**서버 측 (옵션):**

- 토큰 블랙리스트에 추가
- 리프레시 토큰 무효화

---

## 모범 사례

### ✅ DO: 권장 사항

1. **토큰 자동 갱신 구현**

   ```javascript
   // 토큰 만료 5분 전에 자동 갱신
   setInterval(() => {
     if (isTokenExpiringSoon(accessToken)) {
       refreshAccessToken();
     }
   }, 60000); // 1분마다 체크
   ```

2. **에러 처리 중앙화**

   ```javascript
   // Axios Interceptor 예시
   axios.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 401) {
         // 토큰 만료 시 처리
         handleTokenExpiration();
       }
       return Promise.reject(error);
     },
   );
   ```

3. **로딩 상태 관리**

   ```javascript
   const [isLoading, setIsLoading] = useState(false);

   const handleLogin = async () => {
     setIsLoading(true);
     try {
       const response = await login(email, password);
       // 성공 처리
     } catch (error) {
       // 에러 처리
     } finally {
       setIsLoading(false);
     }
   };
   ```

4. **역할 기반 라우팅**

   ```javascript
   // React Router 예시
   <Route
     path="/admin"
     element={
       <ProtectedRoute requiredRole="admin">
         <AdminDashboard />
       </ProtectedRoute>
     }
   />
   ```

---

### ❌ DON'T: 피해야 할 사항

1. **평문으로 비밀번호 저장**

   ```javascript
   // ❌ 절대 금지
   localStorage.setItem('password', password);
   ```

2. **토큰을 URL에 포함**

   ```javascript
   // ❌ 절대 금지
   fetch(`/api/data?token=${accessToken}`);
   ```

3. **클라이언트에서 역할 검증만 수행**

   ```javascript
   // ❌ 서버에서도 반드시 검증해야 함
   if (user.role === 'admin') {
     // 클라이언트에서만 체크하면 우회 가능
   }
   ```

4. **토큰 만료 무시**
   ```javascript
   // ❌ 만료된 토큰으로 계속 요청
   // 401 에러 발생 시 재로그인 또는 토큰 갱신 필요
   ```

---

## 에러 코드 및 해결 방법

### 400 Bad Request

**원인:**

- 필수 필드 누락 (email 또는 password)
- 잘못된 이메일 형식

**해결:**

```json
{
  "email": "valid@example.com",
  "password": "password123"
}
```

---

### 401 Unauthorized

**원인:**

- 이메일 또는 패스워드 불일치
- JWT 토큰 없음
- 잘못된 JWT 토큰
- 만료된 JWT 토큰

**해결:**

1. 로그인 정보 확인
2. 토큰 재발급 (리프레시 토큰 사용)
3. 재로그인

---

### 403 Forbidden

**원인:**

- EMS-PROD 시스템 역할 없음
- 접근 권한 부족

**해결:**

1. SSO 관리자에게 EMS-PROD 역할 요청
2. 올바른 계정으로 로그인

---

## 참고 자료

### 관련 설정

- **SSO 서버 URL**: 환경 변수 `SSO_API_URL`
- **JWT Secret**: 환경 변수 `JWT_SECRET`
- **액세스 토큰 만료**: 환경 변수 `JWT_ACCESS_EXPIRATION` (기본: 1h)
- **리프레시 토큰 만료**: 환경 변수 `JWT_REFRESH_EXPIRATION` (기본: 7d)

### 관련 API

- [직원 관리 API](./admin-employee-management.md)
- [대시보드 API](./admin-dashboard.md)

### Swagger UI

- 개발 환경: `http://localhost:3000/api/docs`
- API 태그: `A-0-0. 인증`

---

## FAQ

### Q1. 리프레시 토큰은 어떻게 사용하나요?

**A:** 현재 버전에서는 리프레시 토큰 엔드포인트가 구현되지 않았습니다. 액세스 토큰 만료 시 재로그인이 필요합니다. 향후 버전에서 추가 예정입니다.

---

### Q2. 여러 디바이스에서 동시 로그인이 가능한가요?

**A:** 네, 가능합니다. 각 디바이스는 독립적인 JWT 토큰을 받습니다.

---

### Q3. 로그아웃 API가 있나요?

**A:** 현재는 클라이언트 측에서 토큰을 삭제하는 방식으로 로그아웃을 처리합니다. 서버 측 로그아웃 API는 향후 추가 예정입니다.

---

### Q4. 비밀번호를 잊어버렸어요.

**A:** SSO 서버의 비밀번호 찾기 기능을 이용하세요. EMS 시스템에서는 직접 비밀번호를 변경할 수 없습니다.

---

### Q5. EMS-PROD 역할은 어떻게 부여받나요?

**A:** SSO 관리자에게 요청하여 EMS-PROD 시스템에 대한 역할을 부여받아야 합니다.

---

**작성일**: 2024-01-15  
**최종 수정일**: 2024-01-15
