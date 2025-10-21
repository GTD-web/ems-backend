# Lumir 평가 관리 시스템 API 문서

> 루미르 평가 관리 시스템의 외부 공개 API 문서입니다.

## 소개

이 문서는 프론트엔드 개발자가 API를 이해하고 사용할 수 있도록 작성된 참조 문서입니다.  
각 컨트롤러별로 제공되는 엔드포인트의 경로, 파라미터, 응답 타입 등을 확인할 수 있습니다.

## 문서 접근 방법

### 1. 직접 마크다운 파일 다운로드

```bash
# 예시: Dashboard API 문서
curl http://localhost:4000/api-docs/admin-dashboard.md
```

### 2. 프론트엔드에서 fetch API로 불러오기

```javascript
// 예시: React에서 사용
fetch('http://localhost:4000/api-docs/admin-dashboard.md')
  .then((response) => response.text())
  .then((markdown) => {
    // 마크다운 렌더러로 변환하여 표시
    console.log(markdown);
  });
```

### 3. 브라우저에서 직접 열기

Chrome 확장 프로그램 [Markdown Viewer](https://chromewebstore.google.com/detail/markdown-viewer/ckkdlimhmcjmikdlpkmbgfkaikojcbjk?hl=ko)를 설치하면 브라우저에서 마크다운 파일을 직접 렌더링하여 볼 수 있습니다.

**Markdown Viewer 주요 기능:**

- GitHub Flavored Markdown (GFM) 지원
- Syntax Highlighting (코드 블록 구문 강조)
- Table of Contents (ToC) 자동 생성
- MathJax 수식 렌더링
- Mermaid 다이어그램 지원
- 30+ 테마 (Dark Mode 포함)
- 파일 변경 시 자동 새로고침

**설치 후 사용 방법:**

1. [Markdown Viewer 설치](https://chromewebstore.google.com/detail/markdown-viewer/ckkdlimhmcjmikdlpkmbgfkaikojcbjk?hl=ko)
2. 확장 프로그램 설정에서 "Allow access to file URLs" 활성화
3. 브라우저 주소창에 `http://localhost:4000/api-docs/admin-dashboard.md` 입력
4. 마크다운이 자동으로 렌더링되어 표시됩니다

## 관리자 API 문서 목록

### 인증

- **[Authentication API Reference](./admin-auth.md)**
  - SSO 기반 로그인
  - JWT 토큰 발급
  - 현재 사용자 정보 조회
  - EMS-PROD 역할 자동 검증

### 대시보드

- **[Dashboard API Reference](./admin-dashboard.md)**
  - 평가기간 현황 조회
  - 직원별 평가 진행 상태
  - 최종평가 목록 조회
  - 할당 정보 조회

### 직원 관리

- **[Employee Management API Reference](./admin-employee-management.md)**
  - 전체 직원 목록 조회
  - 부서 하이라키 구조 조회
  - 직원 포함 부서 하이라키 조회
  - 제외된 직원 목록 조회
  - 직원 조회 제외/포함 설정

### 평가기간 관리

- **[Evaluation Period API Reference](./admin-evaluation-period.md)**
  - 활성 평가 기간 조회
  - 평가 기간 생성/시작/완료/삭제
  - 평가 기간 기본 정보/일정/등급 구간 수정
  - 각 단계별 마감일 수정
  - 수동 허용 설정 관리

- **[Evaluation Target API Reference](./admin-evaluation-target.md)**
  - 평가 대상자 등록/대량 등록
  - 평가 대상 제외/포함 관리
  - 평가 대상자 조회/확인
  - 평가 대상자 등록 해제

### 평가기준 관리

- **[Evaluation Line API Reference](./admin-evaluation-line.md)**
  - 평가자별 피평가자 조회
  - 직원 평가설정 통합 조회
  - 1차/2차 평가자 구성

- **[Project Assignment API Reference](./admin-project-assignment.md)**
  - 프로젝트 할당 생성/목록 조회
  - 직원의 프로젝트 할당 조회
  - 프로젝트의 할당된 직원 조회
  - 프로젝트 대량 할당
  - 할당 순서 변경

- **[WBS Assignment API Reference](./admin-wbs-assignment.md)**
  - WBS 할당 생성/목록 조회
  - 직원의 WBS 할당 조회
  - 프로젝트/WBS 항목의 할당 조회
  - WBS 대량 할당
  - WBS 할당 초기화 (평가기간/프로젝트/직원별)
  - 할당 순서 변경

- **[WBS Evaluation Criteria API Reference](./admin-wbs-evaluation-criteria.md)**
  - WBS 평가기준 조회/저장/삭제
  - WBS 항목별 평가기준 관리
  - 평가기준 검색

### 성과평가 관리

- **[Evaluation Editable Status API Reference](./admin-evaluation-editable-status.md)**
  - 평가 수정 가능 상태 변경
  - 평가 타입별 독립적 제어

- **[Final Evaluation API Reference](./admin-final-evaluation.md)**
  - 최종평가 저장/확정/취소
  - 최종평가 조회/목록 조회
  - 직원-평가기간별 최종평가 조회

- **[Downward Evaluation API Reference](./admin-downward-evaluation.md)**
  - 1차/2차 하향평가 저장
  - 하향평가 제출
  - 평가자의 하향평가 목록 조회
  - 하향평가 상세정보 조회

- **[Peer Evaluation API Reference](./admin-peer-evaluation.md)**
  - 동료평가 요청 (단일/일괄)
  - 동료평가 제출
  - 평가자의 동료평가 목록 조회
  - 할당된 피평가자 목록 조회
  - 동료평가 요청 취소

- **[WBS Self-Evaluation API Reference](./admin-wbs-self-evaluation.md)**
  - WBS 자기평가 저장/제출
  - 직원별/프로젝트별 일괄 제출
  - 미제출 상태로 변경
  - 자기평가 내용 초기화
  - 자기평가 목록 조회

- **[Deliverable Management API Reference](./admin-deliverable.md)**
  - 산출물 생성/수정/삭제
  - 직원별/WBS 항목별 산출물 조회
  - 산출물 상세 조회
  - 벌크 산출물 생성/삭제
  - 활성/비활성 상태 관리

- **[Evaluation Question API Reference](./admin-evaluation-question.md)**
  - 질문 그룹 생성/수정/삭제/조회
  - 평가 질문 생성/수정/삭제/조회
  - 평가 질문 복사
  - 그룹에 질문 추가/제거
  - 질문 순서 관리

### 시드 데이터 관리

- **[Seed Data API Reference](./admin-seed-data.md)**
  - 시나리오별 시드 데이터 생성
  - 시드 데이터 삭제
  - 시드 데이터 상태 조회
  - 데이터 규모 및 상태 분포 커스터마이징

## Swagger 문서

더 상세한 정보와 인터랙티브한 API 테스트를 원하신다면 Swagger UI를 사용하세요:

- **관리자용:** [http://localhost:4000/admin/api-docs](http://localhost:4000/admin/api-docs)
- **사용자용:** [http://localhost:4000/user/api-docs](http://localhost:4000/user/api-docs) (예정)
- **평가자용:** [http://localhost:4000/evaluator/api-docs](http://localhost:4000/evaluator/api-docs) (예정)

## 문서 구조

각 API 문서는 다음과 같은 정보를 포함합니다:

1. **개요** - 컨트롤러의 역할과 책임
2. **Base URL** - API 기본 경로
3. **엔드포인트 목록** - 각 엔드포인트별 상세 정보
   - HTTP 메서드 + 경로
   - Path 파라미터
   - Query 파라미터
   - Request Body (해당하는 경우)
   - 응답 타입
   - 주요 동작 설명
   - 성능 지표 (해당하는 경우)
4. **에러 응답** - 공통 에러 응답 형식
5. **참고사항** - 추가적인 사용 팁

## 공통 사항

### UUID 형식

모든 ID는 UUID v4 형식을 사용합니다.

```
예시: 123e4567-e89b-12d3-a456-426614174000
```

### 날짜 형식

날짜는 ISO 8601 형식(YYYY-MM-DD)을 사용합니다.

```
예시: 2024-01-01
```

### 상태 코드

- `200 OK` - 성공적인 조회/수정
- `201 Created` - 성공적인 생성
- `204 No Content` - 성공적인 삭제
- `400 Bad Request` - 잘못된 요청
- `404 Not Found` - 리소스를 찾을 수 없음
- `409 Conflict` - 중복 또는 충돌
- `422 Unprocessable Entity` - 비즈니스 로직 오류
- `500 Internal Server Error` - 서버 내부 오류

### 에러 응답 형식

```json
{
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request"
}
```

## 문서 버전

- **현재 버전:** 1.0
- **마지막 업데이트:** 2025-10-20
- **문서 유지관리:** 컨트롤러 수정 시 해당 문서도 함께 업데이트됩니다.

## 기여 가이드

새로운 컨트롤러가 추가되면 다음 절차를 따라주세요:

1. `docs/interface/admin/{controller-name}/api-reference.md` 생성
2. 컨트롤러의 모든 엔드포인트 문서화
3. `public/api-docs/{controller-name}.md`에 복사
4. 이 인덱스 페이지에 링크 추가

---

**문의:** 개발팀  
**Repository:** lumir-evaluation-management-system
