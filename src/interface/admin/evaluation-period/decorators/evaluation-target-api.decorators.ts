import { applyDecorators, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  EvaluationTargetMappingResponseDto,
  EvaluationTargetStatusResponseDto,
} from '../dto/evaluation-target.dto';

/**
 * 평가 대상자 등록 API 데코레이터
 */
export const RegisterEvaluationTarget = () =>
  applyDecorators(
    Post(':evaluationPeriodId/targets/:employeeId'),
    ApiOperation({
      summary: '평가 대상자 등록',
      description: `**중요**: 특정 평가기간에 직원을 평가 대상자로 등록합니다. 등록된 대상자는 기본적으로 평가 대상(isExcluded: false)으로 설정됩니다.

**테스트 케이스:**
- 기본 등록: 유효한 평가기간 ID와 직원 ID로 평가 대상자 등록
- 상태 확인: 등록된 평가 대상자의 isExcluded가 false로 설정됨
- 제외 필드 초기화: excludeReason, excludedBy, excludedAt가 모두 null로 설정됨
- DB 저장 확인: 등록 후 DB에 정보가 정상적으로 저장됨
- 다중 평가기간: 동일한 직원을 여러 평가기간에 등록 가능 (평가기간별로 독립적인 맵핑)
- 존재하지 않는 평가기간: 평가기간 미존재 시 404 에러
- 존재하지 않는 직원: 직원 미존재 시 404 에러
- 중복 등록: 이미 등록된 평가 대상자 재등록 시 409 에러
- 잘못된 평가기간 UUID: 형식이 올바르지 않은 평가기간 ID로 요청 시 400 에러
- 잘못된 직원 UUID: 형식이 올바르지 않은 직원 ID로 요청 시 400 에러
- 필수 필드 누락: createdBy 필드 누락 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: String,
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiBody({
      description: '평가 대상자 등록 정보',
      schema: {
        type: 'object',
        required: ['createdBy'],
        properties: {
          createdBy: {
            type: 'string',
            description: '생성자 ID',
            example: 'admin-user-id',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: '평가 대상자 등록 성공',
      type: EvaluationTargetMappingResponseDto,
    }),
    ApiBadRequestResponse({ description: '잘못된 요청' }),
    ApiNotFoundResponse({ description: '평가기간 또는 직원을 찾을 수 없음' }),
    ApiConflictResponse({ description: '이미 등록된 평가 대상자' }),
  );

/**
 * 평가 대상자 대량 등록 API 데코레이터
 */
export const RegisterBulkEvaluationTargets = () =>
  applyDecorators(
    Post(':evaluationPeriodId/targets/bulk'),
    ApiOperation({
      summary: '평가 대상자 대량 등록',
      description: `**중요**: 특정 평가기간에 여러 직원을 평가 대상자로 대량 등록합니다. 이미 등록된 직원은 자동으로 제외되며, 신규 직원만 등록됩니다.

**테스트 케이스:**
- 기본 대량 등록: 여러 직원을 동시에 평가 대상자로 등록
- 배열 응답: 등록된 모든 맵핑 정보를 배열로 반환
- 전체 맵핑 확인: 응답 배열의 길이가 요청한 직원 수와 일치
- 개별 맵핑 검증: 각 맵핑의 evaluationPeriodId, employeeId, isExcluded, createdBy 필드 확인
- 중복 제외: 이미 등록된 직원이 포함된 경우 중복을 제외하고 신규 직원만 등록
- 혼합 등록: 기존 등록 직원과 신규 직원을 함께 요청 시 기존 직원 포함하여 모두 반환
- DB 확인: 대량 등록 후 DB에 올바른 개수가 저장됨
- 전체 직원 등록: 모든 직원을 한 번에 등록 가능
- 초기 상태: 대량 등록된 모든 대상자가 isExcluded: false, 제외 필드 모두 null
- 단일 직원 배열: 1명만 포함된 배열로도 대량 등록 가능
- 동시성 처리: 동일한 평가기간에 대해 동시에 대량 등록 요청 시 정상 처리
- 최대 직원 수: 많은 수의 직원을 한 번에 등록 가능
- 배열 내 중복: 요청 배열 내 중복된 직원 ID가 있어도 한 번만 등록됨
- 빈 배열: 빈 배열로 요청 시 400 에러
- 잘못된 직원 UUID: 배열 내 잘못된 UUID 형식 포함 시 400 에러
- 존재하지 않는 평가기간: 평가기간 미존재 시 404 에러
- 필수 필드 누락: createdBy 또는 employeeIds 누락 시 400 에러
- 배열 타입 검증: employeeIds가 배열이 아닌 경우 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiCreatedResponse({
      description: '평가 대상자 대량 등록 성공',
      type: [EvaluationTargetMappingResponseDto],
    }),
    ApiBadRequestResponse({ description: '잘못된 요청' }),
    ApiNotFoundResponse({ description: '평가기간을 찾을 수 없음' }),
  );

/**
 * 평가 대상 제외 API 데코레이터
 */
export const ExcludeEvaluationTarget = () =>
  applyDecorators(
    Put(':evaluationPeriodId/targets/:employeeId/exclude'),
    ApiOperation({
      summary: '평가 대상 제외',
      description: `**중요**: 특정 평가기간에서 직원을 평가 대상에서 제외합니다. 제외된 대상자는 isExcluded가 true로 변경되며, 제외 사유와 처리자 정보가 저장됩니다.

**테스트 케이스:**
- 기본 제외: 평가 대상자를 성공적으로 제외 처리
- 상태 변경: isExcluded가 false에서 true로 변경됨
- 제외 정보 저장: excludeReason, excludedBy, excludedAt 필드가 정상 저장됨
- 등록되지 않은 대상자: 평가 대상자로 등록되지 않은 경우 404 에러
- 중복 제외: 이미 제외된 대상자를 다시 제외 시 409 에러
- 필수 필드 누락: excludeReason 또는 excludedBy 누락 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: String,
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '평가 대상 제외 성공',
      type: EvaluationTargetMappingResponseDto,
    }),
    ApiBadRequestResponse({ description: '잘못된 요청' }),
    ApiNotFoundResponse({ description: '평가 대상자를 찾을 수 없음' }),
    ApiConflictResponse({ description: '이미 제외된 평가 대상자' }),
  );

/**
 * 평가 대상 포함 API 데코레이터
 */
export const IncludeEvaluationTarget = () =>
  applyDecorators(
    Put(':evaluationPeriodId/targets/:employeeId/include'),
    ApiOperation({
      summary: '평가 대상 포함 (제외 취소)',
      description: `**중요**: 평가 대상에서 제외된 직원을 다시 평가 대상에 포함시킵니다. isExcluded가 false로 변경되고 모든 제외 관련 필드가 초기화됩니다.

**테스트 케이스:**
- 기본 포함: 제외된 대상자를 성공적으로 다시 평가 대상에 포함
- 상태 변경: isExcluded가 true에서 false로 변경됨
- 제외 정보 초기화: excludeReason, excludedBy, excludedAt가 모두 null로 초기화됨
- 등록되지 않은 대상자: 평가 대상자로 등록되지 않은 경우 404 에러
- 중복 포함: 이미 포함된(제외되지 않은) 대상자를 포함 시 409 에러
- 필수 필드 누락: updatedBy 필드 누락 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: String,
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '평가 대상 포함 성공',
      type: EvaluationTargetMappingResponseDto,
    }),
    ApiBadRequestResponse({ description: '잘못된 요청' }),
    ApiNotFoundResponse({ description: '평가 대상자를 찾을 수 없음' }),
    ApiConflictResponse({ description: '이미 포함된 평가 대상자' }),
  );

/**
 * 평가 대상자 조회 API 데코레이터
 */
export const GetEvaluationTargets = () =>
  applyDecorators(
    Get(':evaluationPeriodId/targets'),
    ApiOperation({
      summary: '평가기간의 평가 대상자 조회',
      description: `
특정 평가기간의 평가 대상자 목록을 조회합니다.

## 테스트 케이스

### 성공 케이스
- ✅ 평가기간의 모든 평가 대상자를 조회할 수 있어야 한다
- ✅ includeExcluded=false 시 제외된 대상자가 포함되지 않아야 한다
- ✅ includeExcluded=true 시 제외된 대상자도 포함되어야 한다
- ✅ 평가 대상자가 없는 경우 빈 배열이 반환되어야 한다

### 실패 케이스
- ❌ 존재하지 않는 평가기간 ID로 요청 시 빈 배열이 반환되어야 한다 (또는 404)
      `,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'includeExcluded',
      required: false,
      description: '제외된 대상자 포함 여부',
      type: Boolean,
      example: false,
    }),
    ApiOkResponse({
      description: '평가 대상자 조회 성공',
      type: [EvaluationTargetMappingResponseDto],
    }),
  );

/**
 * 제외된 평가 대상자 조회 API 데코레이터
 */
export const GetExcludedEvaluationTargets = () =>
  applyDecorators(
    Get(':evaluationPeriodId/targets/excluded'),
    ApiOperation({
      summary: '제외된 평가 대상자 조회',
      description: `
특정 평가기간에서 제외된 평가 대상자 목록을 조회합니다.

## 테스트 케이스

### 성공 케이스
- ✅ 제외된 평가 대상자만 조회할 수 있어야 한다
- ✅ 모든 대상자가 isExcluded=true 상태여야 한다
- ✅ 제외된 대상자가 없는 경우 빈 배열이 반환되어야 한다

### 실패 케이스
- ❌ 존재하지 않는 평가기간 ID로 요청 시 빈 배열이 반환되어야 한다
      `,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: '제외된 평가 대상자 조회 성공',
      type: [EvaluationTargetMappingResponseDto],
    }),
  );

/**
 * 직원의 평가기간 맵핑 조회 API 데코레이터
 */
export const GetEmployeeEvaluationPeriods = () =>
  applyDecorators(
    Get('employees/:employeeId/evaluation-periods'),
    ApiOperation({
      summary: '직원의 평가기간 맵핑 조회',
      description: `
특정 직원이 등록된 모든 평가기간 맵핑 정보를 조회합니다.

## 테스트 케이스

### 성공 케이스
- ✅ 직원이 등록된 모든 평가기간 맵핑을 조회할 수 있어야 한다
- ✅ 여러 평가기간에 등록된 경우 모두 반환되어야 한다
- ✅ 등록된 평가기간이 없는 경우 빈 배열이 반환되어야 한다

### 실패 케이스
- ❌ 존재하지 않는 직원 ID로 요청 시 빈 배열이 반환되어야 한다
      `,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: String,
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '직원의 평가기간 맵핑 조회 성공',
      type: [EvaluationTargetMappingResponseDto],
    }),
  );

/**
 * 평가 대상 여부 확인 API 데코레이터
 */
export const CheckEvaluationTarget = () =>
  applyDecorators(
    Get(':evaluationPeriodId/targets/:employeeId/check'),
    ApiOperation({
      summary: '평가 대상 여부 확인',
      description: `
특정 직원이 특정 평가기간의 평가 대상인지 확인합니다.

## 테스트 케이스

### 성공 케이스
- ✅ 등록된 평가 대상자인 경우 true를 반환해야 한다
- ✅ 제외된 대상자인 경우 false를 반환해야 한다
- ✅ 등록되지 않은 경우 false를 반환해야 한다

### 실패 케이스
- ❌ 잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다
      `,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: String,
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '평가 대상 여부 확인 성공',
      type: EvaluationTargetStatusResponseDto,
    }),
  );

/**
 * 평가 대상자 등록 해제 API 데코레이터
 */
export const UnregisterEvaluationTarget = () =>
  applyDecorators(
    Delete(':evaluationPeriodId/targets/:employeeId'),
    ApiOperation({
      summary: '평가 대상자 등록 해제',
      description: `
특정 평가기간에서 직원의 평가 대상자 등록을 해제합니다 (소프트 삭제).

## 테스트 케이스

### 성공 케이스
- ✅ 등록된 평가 대상자를 성공적으로 해제할 수 있어야 한다
- ✅ 해제 후 조회 시 해당 맵핑이 조회되지 않아야 한다

### 실패 케이스
- ❌ 등록되지 않은 평가 대상자를 해제하려고 하면 404 에러가 발생해야 한다
- ❌ 잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다
      `,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: String,
      example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '평가 대상자 등록 해제 성공',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
        },
      },
    }),
    ApiNotFoundResponse({ description: '평가 대상자를 찾을 수 없음' }),
  );

/**
 * 평가기간의 모든 대상자 등록 해제 API 데코레이터
 */
export const UnregisterAllEvaluationTargets = () =>
  applyDecorators(
    Delete(':evaluationPeriodId/targets'),
    ApiOperation({
      summary: '평가기간의 모든 대상자 등록 해제',
      description: `
특정 평가기간의 모든 평가 대상자 등록을 해제합니다.

## 테스트 케이스

### 성공 케이스
- ✅ 평가기간의 모든 대상자를 성공적으로 해제할 수 있어야 한다
- ✅ 해제된 대상자 수가 올바르게 반환되어야 한다
- ✅ 대상자가 없는 경우 0이 반환되어야 한다

### 실패 케이스
- ❌ 존재하지 않는 평가기간 ID로 요청 시 0이 반환되어야 한다
      `,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: '평가기간의 모든 대상자 등록 해제 성공',
      schema: {
        type: 'object',
        properties: {
          deletedCount: { type: 'number', example: 5 },
        },
      },
    }),
  );
