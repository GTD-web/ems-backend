# Usecase E2E 테스트

전체 평가 프로세스를 실제 사용 시나리오로 검증하는 E2E 테스트입니다.

## 📁 폴더 구조

```
test/usecase/
├── scenarios/                           # 재사용 가능한 시나리오 모듈
│   ├── seed-data.scenario.ts           # 시드 데이터 생성/관리
│   ├── query-operations.scenario.ts    # 조회 처리 시나리오
│   ├── evaluation-target.scenario.ts   # 평가 대상 관리 시나리오
│   ├── evaluation-period.scenario.ts   # 평가기간 관리 시나리오
│   └── project-assignment.scenario.ts  # 프로젝트 할당 시나리오
├── evaluation-process.e2e-spec.ts      # 메인 테스트 파일
└── README.md                            # 이 파일
```

## 🚀 빠른 시작

```bash
# 전체 테스트 실행
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts

# 특정 시나리오만 실행
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts -t "프로젝트 할당 시나리오"
```

## 📊 테스트 현황

| 시나리오 | 상태 | 주요 기능 |
|---------|------|----------|
| 시드데이터 생성 | ✅ | 부서/직원/프로젝트 데이터 생성, 부서장 자동 설정 |
| 조회 처리 | ✅ | 부서 하이라키, 대시보드, 평가 대상 조회 |
| 평가 대상 관리 | ✅ | 평가 대상 제외/포함, 대시보드 필터링 |
| 평가기간 관리 | ✅ | 평가기간 생성, 1차 평가자 자동 할당 |
| 프로젝트 할당 | ✅ | 프로젝트 할당/취소/순서변경, 평가자 엔드포인트 검증 |
| WBS 할당 | ✅ | WBS 할당/취소/순서변경/초기화, 대시보드 검증 |

## 📋 시나리오 모듈

### 1. SeedDataScenario
**기능**: 시드 데이터 생성 및 관리  
**핵심 메서드**: `시드_데이터를_생성한다()`, `시드_데이터를_삭제한다()`

### 2. QueryOperationsScenario  
**기능**: 조회 관련 API 테스트  
**핵심 메서드**: `부서_하이라키를_조회한다()`, `대시보드_직원_상태를_조회한다()`

### 3. EvaluationTargetScenario
**기능**: 평가 대상자 관리 (제외/포함)  
**핵심 메서드**: `평가_대상에서_제외한다()`, `평가_대상에_포함한다()`

### 4. EvaluationPeriodScenario
**기능**: 평가기간 관리 및 1차 평가자 자동 할당  
**핵심 메서드**: `평가기간을_생성하고_1차평가자를_검증한다()`

### 5. ProjectAssignmentScenario
**기능**: 프로젝트 할당 및 대시보드 검증  
**핵심 메서드**: `프로젝트_할당_후_대시보드_검증_시나리오를_실행한다()`

### 6. WbsAssignmentScenario
**기능**: WBS 할당 및 대시보드 검증  
**핵심 메서드**: `WBS_할당_후_대시보드_검증_시나리오를_실행한다()`

## 🧪 테스트 구조

### 통합 테스트 (1개)
- **전체 평가 프로세스 실행**: 시드데이터 생성 → 조회 → 정리

### 개별 시나리오 테스트 (13개)
- **조회 처리** (3개): 부서 하이라키, 대시보드, 평가 대상 제외/포함
- **평가 대상 관리** (3개): 제외/포함, 다중 처리, 목록 조회  
- **평가기간 생성** (1개): 1차 평가자 자동 할당
- **프로젝트 할당** (3개): 할당/취소/순서변경 + 대시보드 검증
- **WBS 할당** (4개): 할당/취소/순서변경/초기화 + 대시보드 검증

## 📈 실행 결과

```
✅ 총 14개 테스트 통과 (18.5초)
├── 통합 테스트: 1개 (0.5초)
└── 개별 시나리오: 13개 (18.0초)
    ├── 조회 처리: 3개 (0.2초)
    ├── 평가 대상 관리: 3개 (0.4초)  
    ├── 평가기간 생성: 1개 (2.1초)
    ├── 프로젝트 할당: 3개 (12.0초)
    └── WBS 할당: 4개 (3.3초)
```

## 🔍 주요 검증 기능

### 평가 대상 관리
- ✅ 제외/포함 처리 및 대시보드 필터링
- ✅ 다중 직원 동시 처리
- ✅ 제외된 대상자 목록 조회

### 1차 평가자 자동 할당  
- ✅ 부서장 기반 자동 할당 (최대 3단계 상위 부서 확인)
- ✅ 평가기간 생성 시 자동 실행
- ✅ 대시보드 API 검증

### 프로젝트 할당
- ✅ 대량 할당/취소/순서변경
- ✅ 평가자 엔드포인트 검증 (`/admin/dashboard/{periodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data`)
- ✅ 대시보드 연동 확인

### WBS 할당
- ✅ WBS 할당/취소/순서변경/초기화
- ✅ 대시보드 연동 확인 (`/admin/dashboard/{periodId}/employees/{employeeId}/assigned-data`)
- ✅ 직원별/프로젝트별/평가기간별 초기화

## ✨ 장점

- **재사용성**: 시나리오 클래스로 분리하여 다른 테스트에서도 재사용 가능
- **가독성**: 한글 메서드명으로 직관적인 코드, 독립적인 파일 구조
- **유지보수성**: 각 시나리오별 독립적 수정, 새로운 시나리오 추가 용이
- **테스트 격리**: 통합/개별 테스트 분리, 원하는 시나리오만 독립 실행 가능

## 🔧 주요 API 엔드포인트

| 기능 | 엔드포인트 | 설명 |
|------|------------|------|
| **평가 대상 관리** | `POST /admin/evaluation-periods/{periodId}/targets/{employeeId}/exclude` | 평가 대상 제외 |
| | `POST /admin/evaluation-periods/{periodId}/targets/{employeeId}/include` | 평가 대상 포함 |
| | `GET /admin/evaluation-periods/{periodId}/targets/excluded` | 제외된 대상자 목록 |
| **대시보드** | `GET /admin/dashboard/{periodId}/employees/status` | 직원 현황 조회 |
| | `GET /admin/dashboard/{periodId}/my-evaluation-targets/{evaluatorId}/status` | 평가자별 담당 대상자 |
| | `GET /admin/dashboard/{periodId}/evaluators/{evaluatorId}/employees/{employeeId}/assigned-data` | 평가자-피평가자 할당 데이터 |
| **프로젝트 할당** | `POST /admin/evaluation-criteria/project-assignments/bulk` | 프로젝트 대량 할당 |
| | `DELETE /admin/evaluation-criteria/project-assignments/{assignmentId}` | 프로젝트 할당 취소 |
| | `PATCH /admin/evaluation-criteria/project-assignments/{assignmentId}/order` | 프로젝트 할당 순서 변경 |

## 📋 시나리오 현황

### ✅ 완료 (6개)
- **시드데이터**: 부서/직원/프로젝트 생성, 부서장 자동 설정
- **조회 처리**: 부서 하이라키, 대시보드, 평가 대상 조회
- **평가 대상 관리**: 제외/포함, 다중 처리, 목록 조회
- **평가기간 관리**: 생성, 1차 평가자 자동 할당
- **프로젝트 할당**: 할당/취소/순서변경, 평가자 엔드포인트 검증
- **WBS 할당**: 할당/취소/순서변경/초기화, 대시보드 검증

### 🚧 예정 (4개)
- **평가 기준 설정**: WBS별 평가 기준 관리
- **평가 진행**: 실제 평가 수행 프로세스
- **최종 평가 조회**: 평가 결과 집계 및 조회
- **WBS 배정**: WBS별 담당자 배정
