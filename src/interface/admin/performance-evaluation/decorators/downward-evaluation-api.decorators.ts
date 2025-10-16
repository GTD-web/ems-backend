import {
  applyDecorators,
  Post,
  Get,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreatePrimaryDownwardEvaluationBodyDto,
  CreateSecondaryDownwardEvaluationBodyDto,
  UpdateDownwardEvaluationDto,
  SubmitDownwardEvaluationDto,
  DownwardEvaluationFilterDto,
  DownwardEvaluationResponseDto,
  DownwardEvaluationBasicDto,
  DownwardEvaluationListResponseDto,
  DownwardEvaluationDetailResponseDto,
} from '../dto/downward-evaluation.dto';

/**
 * 1차 하향평가 저장 API 데코레이터 (Upsert: 없으면 생성, 있으면 수정)
 */
export function UpsertPrimaryDownwardEvaluation() {
  return applyDecorators(
    Post('evaluatee/:evaluateeId/period/:periodId/project/:projectId/primary'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 저장',
      description: `**중요**: 1차 하향평가를 저장합니다. Upsert 방식으로 동작하여 동일 조건(evaluatorId, evaluateeId, periodId, evaluationType)의 평가가 있으면 수정하고, 없으면 새로 생성합니다.

**평가 점수 규칙:**
- 양의 정수만 허용 (1 이상)
- 음수, 0, 소수는 허용되지 않음

**선택적 필드:**
- evaluatorId: 생략 시 자동 생성 (추후 요청자 ID로 변경 예정)
- selfEvaluationId: 자기평가 ID 연결 시 제공
- downwardEvaluationContent: 평가 내용 (선택사항)
- downwardEvaluationScore: 평가 점수 (선택사항, 양의 정수)
- createdBy: 생성자 ID (선택사항)

**테스트 케이스:**
- 신규 생성: 새로운 1차 하향평가를 생성할 수 있어야 함
- 기존 수정 (Upsert): 동일 조건의 평가가 있으면 내용 업데이트
- 자기평가 ID 포함: selfEvaluationId를 포함하여 생성 가능
- 평가 내용 없이: downwardEvaluationContent 없이 생성 가능
- 다양한 평가 점수: 1, 5, 10, 50, 100, 120 등 양의 정수 저장 가능
- 여러 번 수정: 동일한 평가를 여러 번 수정 가능 (Upsert)
- 모든 필드 생략: 선택적 필드를 모두 생략하고 생성 가능
- 데이터 무결성: 신규 생성 시 isCompleted는 false, evaluationDate 자동 설정
- 경로 파라미터 저장: evaluateeId, periodId, projectId가 DB에 올바르게 저장됨
- 중복 방지: 동일 조건의 중복 평가는 Upsert로 처리됨
- 평가 점수가 문자열: 400 에러 발생
- 평가 점수가 음수: -10 입력 시 400 에러
- 평가 점수가 0: 0 입력 시 400 에러
- 평가 점수가 소수: 3.5 입력 시 400 에러
- 잘못된 evaluateeId: UUID 형식이 아닌 경우 400 에러
- 잘못된 periodId: UUID 형식이 아닌 경우 400 에러
- 잘못된 projectId: UUID 형식이 아닌 경우 400 에러
- 잘못된 evaluatorId: UUID 형식이 아닌 경우 400 에러
- 평가 내용 타입 오류: 문자열이 아닌 타입 입력 시 400 에러
- 응답 구조: 응답에 id와 message 필드 포함
- 응답 ID 검증: 응답의 id로 DB 조회 가능`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiBody({
      type: CreatePrimaryDownwardEvaluationBodyDto,
      description: '1차 하향평가 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '1차 하향평가가 성공적으로 저장되었습니다.',
      type: DownwardEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '피평가자, 평가기간 또는 프로젝트를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 2차 하향평가 저장 API 데코레이터 (Upsert: 없으면 생성, 있으면 수정)
 */
export function UpsertSecondaryDownwardEvaluation() {
  return applyDecorators(
    Post(
      'evaluatee/:evaluateeId/period/:periodId/project/:projectId/secondary',
    ),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 저장',
      description: `**중요**: 2차 하향평가를 저장합니다. Upsert 방식으로 동작하여 동일 조건(evaluatorId, evaluateeId, periodId, evaluationType)의 평가가 있으면 수정하고, 없으면 새로 생성합니다. 1차 하향평가와 독립적으로 관리됩니다.

**평가 점수 규칙:**
- 양의 정수만 허용 (1 이상)
- 음수, 0, 소수는 허용되지 않음

**선택적 필드:**
- evaluatorId: 생략 시 자동 생성 (추후 요청자 ID로 변경 예정)
- selfEvaluationId: 자기평가 ID 연결 시 제공
- downwardEvaluationContent: 평가 내용 (선택사항)
- downwardEvaluationScore: 평가 점수 (선택사항, 양의 정수)
- createdBy: 생성자 ID (선택사항)

**테스트 케이스:**
- 신규 생성: 새로운 2차 하향평가를 생성할 수 있어야 함
- 기존 수정 (Upsert): 동일 조건의 평가가 있으면 내용 업데이트
- 1차/2차 별도 생성: 같은 피평가자에 대해 1차와 2차를 별도로 생성 가능
- 자기평가 ID 포함: selfEvaluationId를 포함하여 생성 가능
- 모든 필드 생략: 선택적 필드를 모두 생략하고 생성 가능
- 데이터 무결성: 신규 생성 시 isCompleted는 false, evaluationDate 자동 설정
- 경로 파라미터 저장: evaluateeId, periodId, projectId가 DB에 올바르게 저장됨
- evaluationType 구분: evaluationType이 'secondary'로 올바르게 저장됨
- 평가 점수가 문자열: 400 에러 발생
- 평가 점수가 음수: -5 입력 시 400 에러
- 평가 점수가 0: 0 입력 시 400 에러
- 평가 점수가 소수: 2.7 입력 시 400 에러
- 응답 구조: 응답에 id와 message 필드 포함`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiBody({
      type: CreateSecondaryDownwardEvaluationBodyDto,
      description: '2차 하향평가 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '2차 하향평가가 성공적으로 저장되었습니다.',
      type: DownwardEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '피평가자, 평가기간 또는 프로젝트를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 하향평가 수정 API 데코레이터
 */
export function UpdateDownwardEvaluation() {
  return applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '하향평가 수정',
      description: '기존 하향평가를 수정합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '하향평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateDownwardEvaluationDto,
      description: '하향평가 수정 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '하향평가가 성공적으로 수정되었습니다.',
      type: DownwardEvaluationBasicDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '하향평가를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 1차 하향평가 제출 API 데코레이터
 */
export function SubmitPrimaryDownwardEvaluation() {
  return applyDecorators(
    Post(
      'evaluatee/:evaluateeId/period/:periodId/project/:projectId/primary/submit',
    ),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 제출',
      description: `**중요**: 1차 하향평가를 제출합니다. 제출 후에는 평가가 확정되어 수정이 불가능하며, isCompleted 상태가 true로 변경됩니다.

**제출 프로세스:**
1. 평가자, 피평가자, 평가기간, 프로젝트 정보로 1차 하향평가 조회
2. 평가 상태를 완료(isCompleted: true)로 변경
3. 제출 일시 기록

**선택적 필드:**
- submittedBy: 제출자 ID (선택사항, 추후 요청자 ID로 변경 예정)

**테스트 케이스:**
- 기본 제출: 저장된 1차 하향평가를 제출할 수 있어야 함
- isCompleted 변경: 제출 시 isCompleted가 true로 변경됨
- completedAt 설정: 제출 시 completedAt이 현재 시각으로 자동 설정됨
- submittedBy 없이 제출: submittedBy 생략 가능 (기본값: '시스템')
- 트랜잭션 보장: 제출 프로세스가 트랜잭션으로 안전하게 처리됨
- 제출 후 내용 불변: 제출 후 평가 내용과 점수는 변경되지 않아야 함
- 제출 후 updatedAt 갱신: 제출 시 updatedAt이 갱신되어야 함
- 제출 후 createdAt 불변: 제출 후 createdAt은 변경되지 않아야 함
- 존재하지 않는 평가: 저장되지 않은 평가 제출 시 404 에러
- 이미 제출된 평가: 재제출 시 409 에러 발생
- 잘못된 evaluateeId: UUID 형식이 아닌 경우 400 에러
- 잘못된 periodId: UUID 형식이 아닌 경우 400 에러
- 잘못된 projectId: UUID 형식이 아닌 경우 400 에러`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '1차 하향평가 제출 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '1차 하향평가가 성공적으로 제출되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '1차 하향평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 제출된 1차 하향평가입니다.',
    }),
  );
}

/**
 * 2차 하향평가 제출 API 데코레이터
 */
export function SubmitSecondaryDownwardEvaluation() {
  return applyDecorators(
    Post(
      'evaluatee/:evaluateeId/period/:periodId/project/:projectId/secondary/submit',
    ),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 제출',
      description: `**중요**: 2차 하향평가를 제출합니다. 제출 후에는 평가가 확정되어 수정이 불가능하며, isCompleted 상태가 true로 변경됩니다. 1차 하향평가와 독립적으로 제출됩니다.

**제출 프로세스:**
1. 평가자, 피평가자, 평가기간, 프로젝트 정보로 2차 하향평가 조회
2. 평가 상태를 완료(isCompleted: true)로 변경
3. 제출 일시 기록

**선택적 필드:**
- submittedBy: 제출자 ID (선택사항, 추후 요청자 ID로 변경 예정)

**테스트 케이스:**
- 기본 제출: 저장된 2차 하향평가를 제출할 수 있어야 함
- isCompleted 변경: 제출 시 isCompleted가 true로 변경됨
- completedAt 설정: 제출 시 completedAt이 현재 시각으로 자동 설정됨
- 독립적 제출: 1차와 2차 하향평가가 독립적으로 제출됨 (1차 제출 여부와 무관)
- submittedBy 없이 제출: submittedBy 생략 가능 (기본값: '시스템')
- 트랜잭션 보장: 제출 프로세스가 트랜잭션으로 안전하게 처리됨
- 존재하지 않는 2차 평가: 저장되지 않은 2차 평가 제출 시 404 에러
- 이미 제출된 2차 평가: 재제출 시 409 에러 발생
- 잘못된 evaluateeId: UUID 형식이 아닌 경우 400 에러
- 잘못된 periodId: UUID 형식이 아닌 경우 400 에러
- 잘못된 projectId: UUID 형식이 아닌 경우 400 에러`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '2차 하향평가 제출 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '2차 하향평가가 성공적으로 제출되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '2차 하향평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 제출된 2차 하향평가입니다.',
    }),
  );
}

/**
 * 하향평가 제출 API 데코레이터 (ID로 직접 제출)
 */
export function SubmitDownwardEvaluation() {
  return applyDecorators(
    Post(':id/submit'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '하향평가 제출 (ID로 직접)',
      description: `**중요**: 하향평가 ID를 사용하여 직접 제출합니다. 1차/2차 구분 없이 평가 ID만으로 제출할 때 사용하는 간편한 방법입니다. 제출 후에는 평가가 확정되어 수정이 불가능합니다.

**제출 프로세스:**
1. 하향평가 ID로 평가 조회
2. 평가 상태를 완료(isCompleted: true)로 변경
3. 제출 일시 기록

**선택적 필드:**
- submittedBy: 제출자 ID (선택사항, 추후 요청자 ID로 변경 예정)

**테스트 케이스:**
- 1차 하향평가 ID로 제출: 1차 하향평가를 ID로 직접 제출 가능
- 2차 하향평가 ID로 제출: 2차 하향평가를 ID로 직접 제출 가능
- 평가 타입 무관 제출: 1차/2차 구분 없이 ID만으로 제출 가능
- isCompleted 변경: 제출 시 isCompleted가 true로 변경됨
- completedAt 설정: 제출 시 completedAt이 현재 시각으로 자동 설정됨
- submittedBy 없이 제출: submittedBy 생략 가능 (기본값: '시스템')
- 트랜잭션 보장: 제출 프로세스가 트랜잭션으로 안전하게 처리됨
- 제출 후 내용 불변: 제출 후 평가 내용과 점수는 변경되지 않아야 함
- 제출 후 updatedAt 갱신: 제출 시 updatedAt이 갱신되어야 함
- 제출 후 createdAt 불변: 제출 후 createdAt은 변경되지 않아야 함
- 존재하지 않는 ID: 존재하지 않는 ID로 제출 시 404 에러
- 잘못된 UUID 형식: UUID 형식이 아닌 경우 400 에러
- 이미 제출된 평가: ID로 재제출 시 409 에러 발생`,
    }),
    ApiParam({
      name: 'id',
      description: '하향평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '하향평가 제출 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '하향평가가 성공적으로 제출되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '하향평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 제출된 하향평가입니다.',
    }),
  );
}

/**
 * 평가자의 하향평가 목록 조회 API 데코레이터
 */
export function GetEvaluatorDownwardEvaluations() {
  return applyDecorators(
    Get('evaluator/:evaluatorId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가자의 하향평가 목록 조회',
      description: `**중요**: 특정 평가자가 작성한 하향평가 목록을 조회합니다. 다양한 필터 옵션과 페이지네이션을 지원하여 효율적인 평가 관리가 가능합니다.

**필터 옵션:**
- evaluateeId: 피평가자 ID로 필터링
- periodId: 평가기간 ID로 필터링
- projectId: 프로젝트 ID로 필터링
- evaluationType: 평가 유형 ('primary' 또는 'secondary')으로 필터링
- isCompleted: 완료 여부 (true/false)로 필터링
- page: 페이지 번호 (기본값: 1)
- limit: 페이지 크기 (기본값: 10, 최대: 100)

**테스트 케이스:**
- 기본 조회: 평가자의 모든 하향평가 조회 가능
- 피평가자 필터: evaluateeId로 특정 피평가자 평가만 조회
- 평가기간 필터: periodId로 특정 기간 평가만 조회
- 프로젝트 필터: projectId로 특정 프로젝트 평가만 조회
- 평가 유형 필터: evaluationType으로 1차 또는 2차평가만 조회
- 완료 여부 필터: isCompleted로 완료/미완료 평가 구분 조회
- 페이지네이션: page와 limit으로 페이지별 조회 가능
- 빈 결과: 조건에 맞는 평가가 없을 때 빈 배열 반환
- 복합 필터: 여러 필터를 조합하여 조회 가능
- 정렬: 평가 생성일시 기준 정렬
- 응답 필드 검증: 각 평가 항목에 필수 필드 포함 (id, employeeId, evaluatorId, periodId 등)
- 총 개수 정확성: total 필드가 실제 평가 개수와 일치
- 잘못된 evaluatorId: UUID 형식이 아닌 경우 400 에러
- 잘못된 필터 UUID: evaluateeId, periodId, projectId가 UUID 형식이 아닌 경우 400 에러
- 잘못된 evaluationType: primary/secondary 외의 값 입력 시 400 에러
- 페이지 범위 초과: 존재하지 않는 페이지 번호로 요청 시 빈 배열 반환
- limit 범위 검증: 1~100 범위 외의 limit 입력 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiQuery({
      name: 'evaluateeId',
      description: '피평가자 ID',
      required: false,
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID',
      required: false,
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiQuery({
      name: 'projectId',
      description: '프로젝트 ID',
      required: false,
      example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    ApiQuery({
      name: 'evaluationType',
      description: '평가 유형',
      required: false,
      enum: ['primary', 'secondary'],
      example: 'primary',
    }),
    ApiQuery({
      name: 'isCompleted',
      description: '완료 여부',
      required: false,
      type: Boolean,
      example: false,
    }),
    ApiQuery({
      name: 'page',
      description: '페이지 번호 (1부터 시작)',
      required: false,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: '페이지 크기',
      required: false,
      example: 10,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '평가자의 하향평가 목록이 성공적으로 조회되었습니다.',
      type: DownwardEvaluationListResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 파라미터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가자를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 하향평가 상세정보 조회 API 데코레이터
 */
export function GetDownwardEvaluationDetail() {
  return applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '하향평가 상세정보 조회',
      description: `**중요**: 하향평가의 상세정보를 조회합니다. 평가 ID를 사용하여 평가 내용, 점수, 제출 상태, 관련 엔티티 정보 등 모든 세부 정보를 확인할 수 있습니다.

**테스트 케이스:**
- 기본 조회: 하향평가 ID로 상세정보 조회 가능
- 1차평가 조회: 1차 하향평가 상세정보 조회 가능
- 2차평가 조회: 2차 하향평가 상세정보 조회 가능
- 완료된 평가: 제출된 평가의 isCompleted가 true로 표시됨
- 미완료 평가: 저장만 된 평가의 isCompleted가 false로 표시됨
- 자기평가 연결: selfEvaluationId가 있는 경우 포함됨
- 타임스탬프 정확성: 생성/수정/제출 일시가 올바르게 반환됨
- 응답 필드 완전성: 모든 필수 필드가 응답에 포함됨
- 점수 표시: downwardEvaluationScore가 양의 정수로 표시됨
- 평가 내용 표시: downwardEvaluationContent가 정확히 표시됨
- 평가 없음: 존재하지 않는 ID로 조회 시 404 에러
- 잘못된 ID: UUID 형식이 아닌 경우 400 에러
- 삭제된 평가: 삭제된 평가 조회 시 404 에러`,
    }),
    ApiParam({
      name: 'id',
      description: '하향평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '하향평가 상세정보가 성공적으로 조회되었습니다.',
      type: DownwardEvaluationDetailResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 파라미터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증이 필요합니다.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: '권한이 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '하향평가를 찾을 수 없습니다.',
    }),
  );
}
