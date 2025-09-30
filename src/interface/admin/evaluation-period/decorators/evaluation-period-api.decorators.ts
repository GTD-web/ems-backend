import {
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  EvaluationPeriodListResponseDto,
  EvaluationPeriodResponseDto,
} from '../dto/evaluation-period-response.dto';

// ==================== GET 엔드포인트 데코레이터 ====================

/**
 * 활성 평가 기간 조회 엔드포인트 데코레이터
 */
export function GetActiveEvaluationPeriods() {
  return applyDecorators(
    Get('active'),
    ApiOperation({
      summary: '활성 평가 기간 조회',
      description: `**중요**: 오직 상태가 'in-progress'인 평가 기간만 반환됩니다. 대기 중('waiting')이나 완료된('completed') 평가 기간은 포함되지 않습니다.

**테스트 케이스:**
- 빈 상태: 활성 평가 기간이 없을 때 빈 배열 반환
- 다중 활성 기간: 여러 평가 기간 중 'in-progress' 상태인 기간만 필터링하여 반환
- 상태 확인: 반환된 평가 기간의 상태가 'in-progress'로 설정됨
- 완료된 기간 제외: 완료된('completed') 평가 기간은 활성 목록에서 제외됨
- 대기 중 기간 제외: 대기 중('waiting') 평가 기간은 활성 목록에 포함되지 않음
- 부분 완료: 여러 활성 기간 중 일부만 완료해도 나머지는 활성 목록에 유지됨`,
    }),
    ApiResponse({
      status: 200,
      description: '활성 평가 기간 목록',
      type: [EvaluationPeriodResponseDto],
    }),
  );
}

/**
 * 평가 기간 목록 조회 엔드포인트 데코레이터
 */
export function GetEvaluationPeriods() {
  return applyDecorators(
    Get(''),
    ApiOperation({
      summary: '평가 기간 목록 조회',
      description: `**중요**: 모든 상태('waiting', 'in-progress', 'completed')의 평가 기간이 포함됩니다. 삭제된 평가 기간은 제외됩니다.

**테스트 케이스:**
- 빈 목록: 평가 기간이 없을 때 빈 배열과 페이징 정보 반환
- 다양한 평가 기간: 7개의 서로 다른 평가 기간을 3페이지로 나누어 조회
- 페이징 검증: 각 페이지의 항목들이 중복되지 않고 전체 개수가 일치함
- 페이지 범위 초과: 존재하지 않는 페이지 요청 시 빈 목록 반환
- 다양한 페이지 크기: 1, 2, 10개 등 다양한 limit 값으로 조회
- 모든 상태 포함: 대기, 진행 중, 완료된 평가 기간이 모두 목록에 포함됨
- 삭제된 기간 제외: 삭제된 평가 기간은 목록에서 제외됨
- 대용량 데이터: 15개 평가 기간으로 페이징 성능 테스트
- 특수 이름: 특수문자, 한글, 영문이 포함된 이름의 평가 기간 조회
- 에러 처리: 잘못된 페이지/limit 값(음수, 0, 문자열 등)에 대한 적절한 응답`,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호 (기본값: 1, 최소값: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지 크기 (기본값: 10, 최소값: 1)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: '평가 기간 목록 (페이징 정보 포함)',
      type: EvaluationPeriodListResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 페이징 파라미터 (음수, 문자열 등)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 평가 기간 상세 조회 엔드포인트 데코레이터
 */
export function GetEvaluationPeriodDetail() {
  return applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: '평가 기간 상세 조회',
      description: `**테스트 케이스:**
- 기본 조회: 존재하는 평가 기간의 상세 정보 조회 (등급 구간, 날짜 필드 포함)
- 존재하지 않는 ID: null 반환 (404가 아닌 200 상태로 null 반환)
- 다양한 상태: 대기('waiting'), 활성('in-progress'), 완료('completed') 상태별 조회
- 복잡한 등급 구간: 7개 등급(S+, S, A+, A, B+, B, C) 구간을 가진 평가 기간 조회
- 삭제된 평가 기간: 삭제된 평가 기간 조회 시 null 반환
- 에러 처리: 잘못된 UUID 형식, 특수문자, SQL 인젝션 시도 등에 대한 적절한 에러 응답`,
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID (UUID 형식)' }),
    ApiResponse({
      status: 200,
      description: '평가 기간 상세 정보 (존재하지 않을 경우 null 반환)',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

// ==================== POST 엔드포인트 데코레이터 ====================

/**
 * 평가 기간 생성 엔드포인트 데코레이터
 */
export function CreateEvaluationPeriod() {
  return applyDecorators(
    Post(''),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '평가 기간 생성',
      description: `**핵심 테스트 케이스:**
- 기본 생성: 필수 필드로 평가 기간 생성 (name, startDate, peerEvaluationDeadline)
- 복잡한 등급 구간: 다양한 등급(S+, S, A+, A, B+, B, C+, C, D) 구간 설정
- 최소 데이터: 필수 필드만으로 생성 (기본값 자동 적용)
- 필수 필드 누락: name, startDate, peerEvaluationDeadline 누락 시 400 에러
- 중복 이름: 동일한 평가 기간명으로 생성 시 409 에러
- 겹치는 날짜: 기존 평가 기간과 날짜 범위 겹침 시 409 에러
- 잘못된 데이터: 음수 비율, 잘못된 등급 구간 범위 등 검증 에러`,
    }),
    ApiResponse({
      status: 201,
      description: '평가 기간이 성공적으로 생성되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({
      status: 409,
      description: '중복된 평가 기간명 또는 겹치는 날짜 범위입니다.',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류 (도메인 검증 실패 등)',
    }),
  );
}

/**
 * 평가 기간 시작 엔드포인트 데코레이터
 */
export function StartEvaluationPeriod() {
  return applyDecorators(
    Post(':id/start'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '평가 기간 시작',
      description: `**핵심 테스트 케이스:**
- 기본 시작: 대기 중인 평가 기간을 성공적으로 시작하여 'in-progress' 상태로 변경
- 활성 목록 반영: 시작된 평가 기간이 활성 목록에 즉시 나타남
- 복잡한 등급 구간: 다양한 등급 구간을 가진 평가 기간도 정상 시작
- 최소 데이터: 필수 필드만으로 생성된 평가 기간도 시작 가능
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 중복 시작: 이미 시작된 평가 기간 재시작 시 422 에러
- 동시성 처리: 동일한 평가 기간을 동시에 시작할 때 하나만 성공
- 데이터 무결성: 시작 후에도 기본 정보는 변경되지 않고 상태만 변경`,
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 201,
      description: '평가 기간이 성공적으로 시작되었습니다.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description:
        '평가 기간을 시작할 수 없는 상태입니다. (이미 시작됨 또는 완료됨)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 평가 기간 완료 엔드포인트 데코레이터
 */
export function CompleteEvaluationPeriod() {
  return applyDecorators(
    Post(':id/complete'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 기간 완료',
      description: `**핵심 테스트 케이스:**
- 기본 완료: 진행 중인 평가 기간을 성공적으로 완료하여 'completed' 상태로 변경
- 활성 목록 제거: 완료된 평가 기간이 활성 목록에서 즉시 제거됨
- 복잡한 등급 구간: 다양한 등급 구간을 가진 평가 기간도 정상 완료
- 최소 데이터: 필수 필드만으로 생성된 평가 기간도 완료 가능
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 대기 상태 완료: 시작되지 않은 평가 기간 완료 시 422 에러
- 중복 완료: 이미 완료된 평가 기간 재완료 시 422 에러
- 동시성 처리: 동일한 평가 기간을 동시에 완료할 때 하나만 성공
- 데이터 무결성: 완료 후에도 기본 정보는 변경되지 않고 상태만 변경
- 전체 시퀀스: 생성 → 시작 → 완료 전체 라이프사이클 정상 작동`,
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간이 성공적으로 완료되었습니다.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description:
        '평가 기간을 완료할 수 없는 상태입니다. (대기 중이거나 이미 완료됨)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

// ==================== PATCH 엔드포인트 데코레이터 ====================

/**
 * 평가 기간 기본 정보 부분 수정 엔드포인트 데코레이터
 */
export function UpdateEvaluationPeriodBasicInfo() {
  return applyDecorators(
    Patch(':id/basic-info'),
    ApiOperation({
      summary: '평가 기간 기본 정보 부분 수정',
      description: `**핵심 테스트 케이스:**
- 개별 필드 수정: 이름, 설명, 자기평가 달성률을 각각 개별적으로 수정
- 전체 필드 수정: 모든 기본 정보를 동시에 수정
- 부분 수정: 일부 필드만 제공 시 나머지 필드는 기존 값 유지
- 빈 객체: 빈 객체 요청 시 모든 기존 값 유지
- 특수 문자: 특수 문자와 줄바꿈이 포함된 이름/설명 수정
- 존재하지 않는 ID: 404 에러 반환
- 잘못된 UUID 형식: 400 에러 반환
- 빈 문자열: 빈 이름/설명으로 수정 시 400 에러
- 잘못된 타입: 숫자/배열 등 잘못된 타입으로 수정 시 400 에러
- 달성률 검증: 100% 미만, 200% 초과, 문자열 등 잘못된 달성률 시 400 에러
- 달성률 경계값: 100%, 200% 경계값 정상 처리
- 중복 이름: 다른 평가 기간과 중복된 이름으로 수정 시 409 에러
- 상태별 수정: 대기/진행 중 상태에서는 수정 가능, 완료 상태에서는 422 에러
- 데이터 무결성: 수정 후 다른 필드(날짜, 등급 구간 등)는 변경되지 않음`,
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간 기본 정보가 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (빈 문자열, 잘못된 타입, 달성률 범위 오류 등)',
    }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 409,
      description: '중복된 평가 기간명입니다.',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가 기간은 수정 불가 등)',
    }),
    ApiResponse({ status: 500, description: '서버 내부 오류' }),
  );
}

/**
 * 평가 기간 일정 부분 수정 엔드포인트 데코레이터
 */
export function UpdateEvaluationPeriodSchedule() {
  return applyDecorators(
    Patch(':id/schedule'),
    ApiOperation({
      summary: '평가 기간 일정 부분 수정',
      description: '평가 기간의 각 단계별 마감일을 부분 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간 일정이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 평가 기간 시작일 수정 엔드포인트 데코레이터
 */
export function UpdateEvaluationPeriodStartDate() {
  return applyDecorators(
    Patch(':id/start-date'),
    ApiOperation({
      summary: '평가 기간 시작일 수정',
      description: '평가 기간의 시작일만 개별적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간 시작일이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 평가 기간 종료일 수정 엔드포인트 데코레이터
 */
export function UpdateEvaluationPeriodEndDate() {
  return applyDecorators(
    Patch(':id/end-date'),
    ApiOperation({
      summary: '평가 기간 종료일 수정',
      description: '평가 기간의 종료일만 개별적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간 종료일이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 평가설정 단계 마감일 수정 엔드포인트 데코레이터
 */
export function UpdateEvaluationSetupDeadline() {
  return applyDecorators(
    Patch(':id/evaluation-setup-deadline'),
    ApiOperation({
      summary: '평가설정 단계 마감일 수정',
      description: '평가설정 단계 마감일만 개별적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가설정 단계 마감일이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 업무 수행 단계 마감일 수정 엔드포인트 데코레이터
 */
export function UpdatePerformanceDeadline() {
  return applyDecorators(
    Patch(':id/performance-deadline'),
    ApiOperation({
      summary: '업무 수행 단계 마감일 수정',
      description: '업무 수행 단계 마감일만 개별적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '업무 수행 단계 마감일이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 자기 평가 단계 마감일 수정 엔드포인트 데코레이터
 */
export function UpdateSelfEvaluationDeadline() {
  return applyDecorators(
    Patch(':id/self-evaluation-deadline'),
    ApiOperation({
      summary: '자기 평가 단계 마감일 수정',
      description: '자기 평가 단계 마감일만 개별적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '자기 평가 단계 마감일이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 하향/동료평가 단계 마감일 수정 엔드포인트 데코레이터
 */
export function UpdatePeerEvaluationDeadline() {
  return applyDecorators(
    Patch(':id/peer-evaluation-deadline'),
    ApiOperation({
      summary: '하향/동료평가 단계 마감일 수정',
      description: '하향/동료평가 단계 마감일만 개별적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '하향/동료평가 단계 마감일이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 날짜 범위 등)',
    }),
  );
}

/**
 * 평가 기간 등급 구간 수정 엔드포인트 데코레이터
 */
export function UpdateEvaluationPeriodGradeRanges() {
  return applyDecorators(
    Patch(':id/grade-ranges'),
    ApiOperation({
      summary: '평가 기간 등급 구간 수정',
      description: '평가 기간의 등급 구간 설정을 전체 교체합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간 등급 구간이 성공적으로 수정되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (잘못된 등급 구간 등)',
    }),
  );
}

/**
 * 평가 기준 설정 수동 허용 부분 수정 엔드포인트 데코레이터
 */
export function UpdateCriteriaSettingPermission() {
  return applyDecorators(
    Patch(':id/settings/criteria-permission'),
    ApiOperation({
      summary: '평가 기준 설정 수동 허용 부분 수정',
      description: '평가 기준 설정의 수동 허용 여부를 부분 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기준 설정 수동 허용이 성공적으로 변경되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
  );
}

/**
 * 자기 평가 설정 수동 허용 부분 수정 엔드포인트 데코레이터
 */
export function UpdateSelfEvaluationSettingPermission() {
  return applyDecorators(
    Patch(':id/settings/self-evaluation-permission'),
    ApiOperation({
      summary: '자기 평가 설정 수동 허용 부분 수정',
      description: '자기 평가 설정의 수동 허용 여부를 부분 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '자기 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
  );
}

/**
 * 최종 평가 설정 수동 허용 부분 수정 엔드포인트 데코레이터
 */
export function UpdateFinalEvaluationSettingPermission() {
  return applyDecorators(
    Patch(':id/settings/final-evaluation-permission'),
    ApiOperation({
      summary: '최종 평가 설정 수동 허용 부분 수정',
      description: '최종 평가 설정의 수동 허용 여부를 부분 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '최종 평가 설정 수동 허용이 성공적으로 변경되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
  );
}

/**
 * 전체 수동 허용 설정 부분 수정 엔드포인트 데코레이터
 */
export function UpdateManualSettingPermissions() {
  return applyDecorators(
    Patch(':id/settings/manual-permissions'),
    ApiOperation({
      summary: '전체 수동 허용 설정 부분 수정',
      description: '모든 수동 허용 설정을 부분적으로 수정합니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '전체 수동 허용 설정이 성공적으로 변경되었습니다.',
      type: EvaluationPeriodResponseDto,
    }),
    ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
  );
}

// ==================== DELETE 엔드포인트 데코레이터 ====================

/**
 * 평가 기간 삭제 엔드포인트 데코레이터
 */
export function DeleteEvaluationPeriod() {
  return applyDecorators(
    Delete(':id'),
    ApiOperation({
      summary: '평가 기간 삭제',
      description:
        '평가 기간을 삭제합니다. 주의: 이 작업은 되돌릴 수 없습니다.',
    }),
    ApiParam({ name: 'id', description: '평가 기간 ID' }),
    ApiResponse({
      status: 200,
      description: '평가 기간이 성공적으로 삭제되었습니다.',
      schema: { type: 'boolean' },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (잘못된 UUID 형식 등)',
    }),
    ApiResponse({ status: 404, description: '평가 기간을 찾을 수 없습니다.' }),
    ApiResponse({
      status: 422,
      description: '삭제할 수 없는 상태입니다. (진행 중인 평가 등)',
    }),
  );
}
