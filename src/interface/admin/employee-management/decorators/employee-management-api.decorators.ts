import {
  applyDecorators,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  DepartmentHierarchyResponseDto,
  DepartmentHierarchyWithEmployeesResponseDto,
} from '../dto/department-hierarchy-response.dto';
import {
  EmployeeResponseDto,
  UpdateEmployeeAccessibilityQueryDto,
} from '../dto/employee-management.dto';

// ==================== GET 엔드포인트 데코레이터 ====================

/**
 * 전체 직원 목록 조회 엔드포인트 데코레이터
 */
export function GetAllEmployees() {
  return applyDecorators(
    Get(''),
    ApiOperation({
      summary: '전체 직원 목록 조회',
      description: `**중요**: 기본적으로 조회 대상에서 제외되지 않은 직원만 반환됩니다. 제외된 직원을 포함하려면 includeExcluded=true 쿼리 파라미터를 사용하세요.

**동작 방식:**
- 기본값(includeExcluded=false): isExcludedFromList=false인 직원만 반환
- includeExcluded=true: 제외 상태와 무관하게 모든 직원 반환
- departmentId 쿼리로 부서별 필터링 가능

**테스트 케이스:**
- 기본 조회(제외되지 않은 직원만): includeExcluded 없이 조회 시 isExcludedFromList=false인 직원만 반환 (200)
- 제외 직원 필터링 검증: 직원을 제외한 후 기본 조회 시 해당 직원이 목록에 없음
- includeExcluded=true 조회: includeExcluded=true로 조회 시 제외된 직원도 포함하여 반환 (200)
- 전체 직원 수 확인: includeExcluded=true 시 제외된 직원 + 일반 직원 모두 반환
- includeExcluded=false 명시: includeExcluded=false로 명시해도 기본 동작과 동일
- 부서별 필터링: departmentId로 특정 부서 직원만 조회 (200)
- 부서별 + 제외 필터: departmentId와 includeExcluded 조합 가능
- 빈 목록 반환: 조건에 맞는 직원이 없을 때 빈 배열 반환 (200)
- 배열 타입 검증: 응답이 올바른 배열 형식
- 재직 여부 정보: 각 직원의 재직/퇴사 상태 정보 포함
- isExcludedFromList 필드: 모든 직원 객체에 isExcludedFromList 필드 포함
- 잘못된 부서 ID: 잘못된 UUID 형식의 departmentId로 요청 시 400 에러`,
    }),
    ApiQuery({
      name: 'includeExcluded',
      required: false,
      description: '제외된 직원 포함 여부 (기본값: false)',
      example: false,
      type: Boolean,
    }),
    ApiQuery({
      name: 'departmentId',
      required: false,
      description: '부서 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: '직원 목록',
      type: [EmployeeResponseDto],
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 파라미터',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 부서 하이라키 구조 조회 엔드포인트 데코레이터
 */
export function GetDepartmentHierarchy() {
  return applyDecorators(
    Get('departments/hierarchy'),
    ApiOperation({
      summary: '부서 하이라키 구조 조회',
      description: `전체 부서 구조를 하이라키(계층) 형태로 반환합니다. 각 부서의 계층 정보를 포함하며, 필수 필드만 포함됩니다.

**테스트 케이스:**
- 기본 조회: 부서 하이라키 구조 정상 반환 (200)
- 필수 필드 포함: id, name, code, order, parentDepartmentId, level, depth, childrenCount, totalDescendants, subDepartments 모두 포함
- 루트 부서 level: 최상위 부서들의 level은 모두 0
- 하위 부서 level 증가: subDepartments의 level은 부모 부서보다 1 큼
- childrenCount 정확성: 각 부서의 childrenCount는 subDepartments 배열 길이와 일치
- leaf 노드 depth: 하위 부서가 없는 leaf 노드의 depth는 0
- totalDescendants 정확성: 직계 하위 부서 + 모든 손자 부서 개수의 합과 일치
- depth 계산 정확성: 하위 부서가 있는 경우 depth는 최대 하위 레벨 깊이
- parentDepartmentId 기반 루트: parentDepartmentId가 null/undefined인 부서는 루트 레벨에 배치
- 계층 구조 정확성: 재귀적으로 모든 부서가 올바르게 포함되어 총 개수 일치
- 재귀적 검증: 모든 하위 레벨에서 계층 구조 규칙 일관되게 적용`,
    }),
    ApiResponse({
      status: 200,
      description: '부서 하이라키 구조 (계층 정보 포함)',
      type: [DepartmentHierarchyResponseDto],
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 직원 목록을 포함한 부서 하이라키 구조 조회 엔드포인트 데코레이터
 */
export function GetDepartmentHierarchyWithEmployees() {
  return applyDecorators(
    Get('departments/hierarchy-with-employees'),
    ApiOperation({
      summary: '직원 목록 포함 부서 하이라키 구조 조회',
      description: `전체 부서 구조를 하이라키 형태로 반환하며, 각 부서별 소속 직원 목록을 포함합니다. 조직도 구성 및 인력 현황 파악에 유용합니다.

**테스트 케이스:**
- 기본 조회: 직원 목록을 포함한 부서 하이라키 정상 반환 (200)
- 직원 관련 필드: employees(배열), employeeCount(숫자) 필드 포함
- employeeCount 정확성: employeeCount는 employees 배열 길이와 정확히 일치
- 직원 있는 부서: employeeCount > 0인 부서는 employees 배열이 비어있지 않음
- 직원 정보 필수 필드: id, employeeNumber, name, email, rankName, rankCode, rankLevel, isActive 모두 포함
- isActive 타입: 모든 직원의 isActive 필드는 boolean 타입
- 부서별 직원 수 합계: 모든 부서의 직원 수 합이 전체 직원 수 이하 (부서 미배정 직원 고려)
- 계층 정보 포함: level, depth, childrenCount, totalDescendants 필드도 함께 제공
- 빈 부서 처리: 직원이 없는 부서(employeeCount=0)는 빈 배열([]) 반환
- 동시 제공: subDepartments와 employees 배열 모두 존재
- 부서 수 일관성: 전체 부서 수는 일반 하이라키 조회와 동일
- 엣지 케이스: 모든 부서에 직원이 없어도 정상 조회 (빈 배열들 반환)
- 재귀적 검증: 모든 하위 레벨에서 직원 정보와 계층 정보 일관되게 제공`,
    }),
    ApiResponse({
      status: 200,
      description: '직원 목록을 포함한 부서 하이라키 구조',
      type: [DepartmentHierarchyWithEmployeesResponseDto],
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 제외된 직원 목록 조회 엔드포인트 데코레이터
 */
export function GetExcludedEmployees() {
  return applyDecorators(
    Get('excluded'),
    ApiOperation({
      summary: '조회에서 제외된 직원 목록 조회',
      description: `**중요**: isExcludedFromList가 true인 직원들만 반환합니다. 제외 사유, 제외 설정자, 제외 설정 일시 정보를 포함합니다.

**동작 방식:**
- 전체 직원 목록에서 isExcludedFromList=true인 직원만 필터링
- 제외 관련 정보(excludeReason, excludedBy, excludedAt) 포함하여 반환
- 재직/퇴사 상태와 무관하게 제외된 모든 직원 조회

**테스트 케이스:**
- 제외된 직원 목록 조회: 2명을 제외 처리 후 목록 조회 시 정확히 2명 반환 (200)
- isExcludedFromList 검증: 반환된 모든 직원의 isExcludedFromList=true
- 제외된 직원이 없는 경우: 제외된 직원이 없을 때 빈 배열 반환 (200)
- 빈 배열 타입 검증: 빈 배열이 올바른 Array 타입으로 반환됨
- 제외 정보 포함 확인: 각 직원의 excludeReason, excludedBy, excludedAt이 응답에 포함됨
- 제외 사유 정확성: 설정한 excludeReason이 정확히 반환됨
- 타임스탬프 형식: excludedAt이 올바른 ISO 8601 Date 형식
- 여러 직원 제외: 3명 제외 시 3명 모두 조회됨
- 일부 포함 후 조회: 3명 제외 후 1명을 포함 처리하면 2명만 조회됨
- 재직 여부 무관: 재직자/퇴사자 구분 없이 제외된 모든 직원 포함`,
    }),
    ApiResponse({
      status: 200,
      description: '제외된 직원 목록',
      type: [EmployeeResponseDto],
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

// ==================== PATCH 엔드포인트 데코레이터 ====================

/**
 * 직원 조회 제외 엔드포인트 데코레이터
 */
export function ExcludeEmployeeFromList() {
  return applyDecorators(
    Patch(':id/exclude'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '직원을 조회 목록에서 제외',
      description: `**중요**: 직원을 일반 조회 목록에서 제외합니다. 제외 사유와 처리자 정보를 함께 저장합니다.

**요청 바디**: excludeReason(제외 사유)만 필요합니다. 처리자 정보(excludedBy)는 JWT 토큰에서 자동으로 가져옵니다.

**동작 방식:**
- 직원의 isExcludedFromList를 true로 설정
- excludeReason, excludedBy, excludedAt 정보 저장
- 이미 제외된 직원 재제외 시 정보 업데이트 (Upsert)
- 제외 후 일반 직원 목록 조회 시 자동으로 필터링됨
- 처리자 정보는 JWT 토큰의 인증된 사용자에서 자동으로 추출

**테스트 케이스:**
- 정상적인 직원을 조회 목록에서 제외: 재직 중인 직원을 제외 처리하고 isExcludedFromList=true로 설정 (200)
- 제외 정보 DB 저장 확인: excludeReason, excludedBy, excludedAt이 DB에 정상적으로 저장됨
- 여러 직원 각각 제외: 서로 다른 직원들을 각각 제외 처리 가능 (200)
- 이미 제외된 직원 재제외: 기존 제외 사유를 새로운 사유로 업데이트 (200)
- 제외 정보 업데이트: 재제외 시 excludeReason, excludedBy, excludedAt이 새 값으로 갱신됨
- 존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 ID로 요청 시 404 에러
- 잘못된 UUID 형식: 잘못된 UUID 형식의 직원 ID로 요청 시 400 에러
- excludeReason 누락: excludeReason 필드가 없을 때 400 에러
- 빈 문자열 excludeReason: 빈 문자열로 요청 시 400 에러
- 응답 데이터 검증: isExcludedFromList, excludeReason, excludedBy, excludedAt 포함
- 타임스탬프 형식: excludedAt이 올바른 ISO 8601 Date 형식`,
    }),
    ApiParam({
      name: 'id',
      description: '직원 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: '직원이 조회 목록에서 제외되었습니다.',
      type: EmployeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (excludeReason 누락 또는 잘못된 UUID 형식)',
    }),
    ApiResponse({
      status: 404,
      description: '직원을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 직원 조회 포함 엔드포인트 데코레이터
 */
export function IncludeEmployeeInList() {
  return applyDecorators(
    Patch(':id/include'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '직원을 조회 목록에 포함',
      description: `**중요**: 제외되었던 직원을 다시 일반 조회 목록에 포함시킵니다. 제외 관련 정보(excludeReason, excludedBy, excludedAt)는 모두 초기화됩니다.

**참고**: 이 엔드포인트는 요청 바디가 필요하지 않습니다. 인증된 사용자 정보는 JWT 토큰에서 자동으로 가져옵니다.

**동작 방식:**
- 직원의 isExcludedFromList를 false로 설정
- excludeReason, excludedBy, excludedAt을 null로 초기화
- 포함 후 일반 직원 목록 조회 시 정상적으로 조회됨
- 제외되지 않은 직원에 대해서도 멱등성 보장 (정상 처리)
- 처리자 정보는 JWT 토큰의 인증된 사용자에서 자동으로 추출

**테스트 케이스:**
- 제외된 직원을 다시 조회 목록에 포함: 제외되었던 직원을 포함 처리하고 isExcludedFromList=false로 설정 (200)
- 제외 정보 DB 초기화 확인: excludeReason, excludedBy, excludedAt이 DB에서 null로 초기화됨
- 제외 정보가 null로 반환: 응답 body에서 excludeReason, excludedBy, excludedAt이 모두 null
- 여러 제외된 직원을 각각 포함: 여러 제외된 직원들을 각각 포함 처리 가능 (200)
- 제외되지 않은 직원 포함 처리: 이미 포함 상태(isExcludedFromList=false)인 직원도 정상 처리 (200)
- 멱등성 보장: 이미 포함된 직원을 다시 포함해도 에러 없이 정상 동작
- 존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 ID로 요청 시 404 에러
- 잘못된 UUID 형식: 잘못된 UUID 형식의 직원 ID로 요청 시 400 에러
- 응답 데이터 검증: isExcludedFromList=false, excludeReason=null, excludedBy=null, excludedAt=null
- 연속 제외/포함: 제외 → 포함 → 재제외 → 재포함 흐름이 정상 동작`,
    }),
    ApiParam({
      name: 'id',
      description: '직원 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: '직원이 조회 목록에 포함되었습니다.',
      type: EmployeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 UUID 형식',
    }),
    ApiResponse({
      status: 404,
      description: '직원을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 직원 접근 가능 여부 변경 엔드포인트 데코레이터
 */
export function UpdateEmployeeAccessibility() {
  return applyDecorators(
    Patch(':id/accessibility'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '직원의 접근 가능 여부 변경',
      description: `**중요**: 직원의 시스템 접근 가능 여부를 변경합니다. 이는 2중 보안을 위한 설정입니다.

**동작 방식:**
- 직원의 isAccessible 필드를 변경
- SSO에서 역할을 받았더라도 이 시스템에서 접근 가능 여부를 별도로 관리
- admin 역할을 가진 사용자도 isAccessible=false이면 접근 불가
- 변경 후 즉시 적용됨
- 처리자 정보는 JWT 토큰의 인증된 사용자에서 자동으로 추출

**테스트 케이스:**
- 접근 가능으로 변경: isAccessible=false인 직원을 true로 변경 (200)
- 접근 불가로 변경: isAccessible=true인 직원을 false로 변경 (200)
- 접근 가능 여부 반영 확인: 변경 후 응답에 isAccessible 필드가 변경된 값으로 반환됨
- 이미 같은 값으로 변경: 이미 해당 상태인 직원도 정상 처리 (200)
- 멱등성 보장: 동일한 값으로 여러 번 요청해도 에러 없이 정상 동작
- 존재하지 않는 직원 ID: 유효한 UUID이지만 존재하지 않는 ID로 요청 시 404 에러
- 잘못된 UUID 형식: 잘못된 UUID 형식의 직원 ID로 요청 시 400 에러
- isAccessible 쿼리 파라미터 누락: isAccessible 쿼리 파라미터가 없을 때 400 에러
- 잘못된 값: isAccessible이 "true", "false", "1", "0" 외의 값일 때 400 에러
- 응답 데이터 검증: 변경된 isAccessible 값이 응답에 포함됨`,
    }),
    ApiParam({
      name: 'id',
      description: '직원 ID (UUID 형식)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'isAccessible',
      required: true,
      description: '접근 가능 여부 (가능값: "true", "false", "1", "0")',
      type: String,
      example: 'true',
    }),
    ApiResponse({
      status: 200,
      description: '직원의 접근 가능 여부가 변경되었습니다.',
      type: EmployeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (isAccessible 쿼리 파라미터 누락, 잘못된 값 또는 잘못된 UUID 형식)',
    }),
    ApiResponse({
      status: 404,
      description: '직원을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}
