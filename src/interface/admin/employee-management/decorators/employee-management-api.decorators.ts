import {
  applyDecorators,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EmployeeResponseDto } from '../dto/employee-management.dto';
import { DepartmentHierarchyDto } from '../../../../context/organization-management-context/interfaces/organization-management-context.interface';

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

**테스트 케이스:**
- 기본 조회: 조회 대상 직원만 반환
- includeExcluded=true: 제외된 직원 포함하여 반환
- 부서별 필터링: departmentId로 특정 부서 직원만 조회
- 빈 목록: 직원이 없을 때 빈 배열 반환
- 재직 여부: 재직자/퇴사자 구분 가능`,
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
      description:
        '전체 부서 구조를 하이라키 형태로 반환합니다. 계층 정보(level, depth, childrenCount)를 포함하며, 필수 필드만 포함됩니다.',
    }),
    ApiResponse({
      status: 200,
      description: '부서 하이라키 구조 (계층 정보 포함)',
      type: [Object], // DepartmentHierarchyDto는 재귀적이므로 Object로 표시
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

**테스트 케이스:**
- 제외된 직원만 조회: isExcludedFromList=true인 직원만 반환
- 빈 목록: 제외된 직원이 없을 때 빈 배열 반환
- 제외 정보 포함: excludeReason, excludedBy, excludedAt 필드 포함
- 재직 여부 무관: 재직/퇴사 상태와 무관하게 제외된 모든 직원 조회`,
    }),
    ApiResponse({
      status: 200,
      description: '제외된 직원 목록',
      type: [EmployeeResponseDto],
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 직원 상세 조회 엔드포인트 데코레이터
 */
export function GetEmployeeDetail() {
  return applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: '직원 상세 정보 조회',
      description: `**테스트 케이스:**
- 기본 조회: 존재하는 직원의 상세 정보 조회
- 제외 상태 포함: isExcludedFromList 및 제외 관련 정보 조회
- 존재하지 않는 ID: null 반환
- 잘못된 UUID 형식: 400 에러`,
    }),
    ApiParam({ name: 'id', description: '직원 ID (UUID 형식)' }),
    ApiResponse({
      status: 200,
      description: '직원 상세 정보 (존재하지 않을 경우 null 반환)',
      type: EmployeeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
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

**테스트 케이스:**
- 기본 제외: 정상 직원을 제외 처리
- 제외 정보 저장: excludeReason, excludedBy, excludedAt 저장
- 중복 제외: 이미 제외된 직원 재제외 시 정보 업데이트
- 필수 필드 검증: excludeReason, excludedBy 필수
- 존재하지 않는 ID: 404 에러
- 잘못된 UUID 형식: 400 에러`,
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
      description: '잘못된 요청 데이터',
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

**테스트 케이스:**
- 기본 포함: 제외된 직원을 다시 포함 처리
- 제외 정보 초기화: excludeReason, excludedBy, excludedAt 모두 null로 설정
- 제외되지 않은 직원: 이미 포함 상태인 직원 재포함 시에도 정상 처리
- 필수 필드 검증: updatedBy 필수
- 존재하지 않는 ID: 404 에러
- 잘못된 UUID 형식: 400 에러`,
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
      description: '잘못된 요청 데이터',
    }),
    ApiResponse({
      status: 404,
      description: '직원을 찾을 수 없습니다.',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}
