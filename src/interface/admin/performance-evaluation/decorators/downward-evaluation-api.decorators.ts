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
    Post('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 저장',
      description: `**중요**: 1차 하향평가를 저장합니다. Upsert 방식으로 동작하여 동일 조건(evaluatorId, evaluateeId, periodId, wbsId, evaluationType)의 평가가 있으면 수정하고, 없으면 새로 생성합니다.

**동작:**
- 평가자가 피평가자에 대한 1차 하향평가를 작성
- 동일 조건의 평가가 있으면 수정(UPDATE), 없으면 생성(INSERT)
- 평가 내용, 점수, 자기평가 연결 등을 저장
- 신규 생성 시 isCompleted는 false로 초기화
- 평가라인 권한 검증 (1차 평가자만 저장 가능)

**테스트 케이스:**
- 신규 1차 하향평가 생성
- 기존 1차 하향평가 수정 (Upsert)
- 자기평가 ID를 포함하여 생성
- 평가 내용 없이 생성 가능
- 다양한 평가 점수 저장 (1, 5, 10, 50, 100, 120)
- 동일한 평가를 여러 번 수정 가능
- 모든 필드 생략 시 400 에러
- 평가 점수가 숫자가 아닐 때 400 에러
- 평가 점수가 음수일 때 400 에러
- 평가 점수가 0일 때 400 에러
- 평가 점수가 소수일 때 400 에러
- 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 형식의 periodId로 요청 시 400 에러
- 잘못된 형식의 wbsId로 요청 시 400 에러
- 잘못된 형식의 evaluatorId로 요청 시 400 에러
- 평가 내용이 문자열이 아닐 때 400 에러
- 1차 평가라인에 지정되지 않은 평가자는 저장 불가 (403 에러)
- 응답에 id와 message 필드 포함
- 신규 생성 시 isCompleted는 false
- 하향평가 저장 시 evaluationDate 설정
- 경로 파라미터 정보가 올바르게 저장
- 동일 조건의 중복 평가는 Upsert 방식으로 처리`,
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
      name: 'wbsId',
      description: 'WBS ID',
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
      description: '피평가자, 평가기간 또는 WBS를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 2차 하향평가 저장 API 데코레이터 (Upsert: 없으면 생성, 있으면 수정)
 */
export function UpsertSecondaryDownwardEvaluation() {
  return applyDecorators(
    Post('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 저장',
      description: `**중요**: 2차 하향평가를 저장합니다. Upsert 방식으로 동작하여 동일 조건(evaluatorId, evaluateeId, periodId, wbsId, evaluationType)의 평가가 있으면 수정하고, 없으면 새로 생성합니다. 1차 하향평가와 독립적으로 관리됩니다.

**동작:**
- 평가자가 피평가자에 대한 2차 하향평가를 작성
- 동일 조건의 평가가 있으면 수정(UPDATE), 없으면 생성(INSERT)
- 1차 하향평가와 독립적으로 관리
- 평가 내용, 점수, 자기평가 연결 등을 저장
- 신규 생성 시 isCompleted는 false로 초기화
- 평가라인 권한 검증 (2차 평가자만 저장 가능)

**테스트 케이스:**
- 신규 2차 하향평가 생성
- 기존 2차 하향평가 수정 (Upsert)
- 1차와 2차 하향평가를 별도로 생성 가능
- 자기평가 ID를 포함하여 생성
- 모든 필드 생략 시 400 에러
- 평가 점수가 숫자가 아닐 때 400 에러
- 평가 점수가 음수일 때 400 에러
- 평가 점수가 0일 때 400 에러
- 평가 점수가 소수일 때 400 에러
- 2차 평가라인에 지정되지 않은 평가자는 저장 불가 (403 에러)
- 응답에 id와 message 필드 포함`,
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
      name: 'wbsId',
      description: 'WBS ID',
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
      description: '피평가자, 평가기간 또는 WBS를 찾을 수 없습니다.',
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
    Post('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary/submit'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 제출',
      description: `**중요**: 1차 하향평가를 제출합니다. 제출 후에는 평가가 확정되어 수정이 불가능하며, isCompleted 상태가 true로 변경됩니다.

**동작:**
- 평가자, 피평가자, 평가기간, WBS로 1차 하향평가 조회
- 평가 상태를 완료(isCompleted: true)로 변경
- 제출 일시(completedAt) 기록
- 제출 후 평가 내용은 변경 불가

**테스트 케이스:**
- 저장된 1차 하향평가를 제출할 수 있어야 함
- 제출 시 isCompleted가 true로 변경
- submittedBy 없이도 제출 가능
- 존재하지 않는 평가를 제출하면 404 에러
- 이미 제출된 평가를 재제출하면 409 에러
- 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 형식의 periodId로 요청 시 400 에러
- 잘못된 형식의 wbsId로 요청 시 400 에러`,
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
      name: 'wbsId',
      description: 'WBS ID',
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
    Post('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary/submit'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 제출',
      description: `**중요**: 2차 하향평가를 제출합니다. 제출 후에는 평가가 확정되어 수정이 불가능하며, isCompleted 상태가 true로 변경됩니다. 1차 하향평가와 독립적으로 제출됩니다.

**동작:**
- 평가자, 피평가자, 평가기간, WBS로 2차 하향평가 조회
- 평가 상태를 완료(isCompleted: true)로 변경
- 제출 일시(completedAt) 기록
- 1차 하향평가와 독립적으로 제출
- 제출 후 평가 내용은 변경 불가

**테스트 케이스:**
- 저장된 2차 하향평가를 제출할 수 있어야 함
- 1차와 2차 하향평가를 독립적으로 제출 가능
- 존재하지 않는 2차 평가를 제출하면 404 에러
- 이미 제출된 2차 평가를 재제출하면 409 에러`,
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
      name: 'wbsId',
      description: 'WBS ID',
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

**동작:**
- 하향평가 ID로 평가 조회
- 평가 상태를 완료(isCompleted: true)로 변경
- 제출 일시(completedAt) 기록
- 1차/2차 구분 없이 제출 가능
- 제출 후 평가 내용은 변경 불가

**테스트 케이스:**
- 1차 하향평가 ID로 직접 제출 가능
- 2차 하향평가 ID로 직접 제출 가능
- 평가 타입에 관계없이 ID만으로 제출 가능
- 존재하지 않는 ID로 제출 시 404 에러
- 잘못된 UUID 형식으로 제출 시 400 에러
- 이미 제출된 평가를 ID로 재제출 시 409 에러
- 제출 후 평가 내용과 점수는 변경되지 않음
- 제출 후 updatedAt이 갱신
- 제출 후 createdAt은 변경되지 않음`,
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
 * 1차 하향평가 미제출 상태 변경 API 데코레이터
 */
export function ResetPrimaryDownwardEvaluation() {
  return applyDecorators(
    Post('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary/reset'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '1차 하향평가 미제출 상태 변경',
      description: `**중요**: 제출된 1차 하향평가를 미제출 상태로 되돌립니다. 평가 내용은 유지되며, isCompleted 상태만 false로 변경됩니다.

**동작:**
- 평가자, 피평가자, 평가기간, WBS로 1차 하향평가 조회
- 평가 상태를 미완료(isCompleted: false)로 변경
- 수정 일시(updatedAt) 갱신
- 평가 내용과 점수는 유지
- 초기화 후 다시 제출 가능

**테스트 케이스:**
- 제출된 1차 하향평가를 미제출 상태로 변경 가능
- 초기화 시 isCompleted가 false로 변경
- 초기화 후에도 평가 내용과 점수는 유지
- 초기화 후 다시 제출 가능
- 초기화 시 updatedAt이 갱신
- 존재하지 않는 평가를 초기화하려고 하면 404 에러
- 미제출 상태인 평가를 초기화하려고 하면 400 에러
- 잘못된 evaluateeId UUID 형식이면 400 에러
- 잘못된 periodId UUID 형식이면 400 에러
- 잘못된 wbsId UUID 형식이면 400 에러`,
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
      name: 'wbsId',
      description: 'WBS ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '1차 하향평가 초기화 정보 (evaluatorId 포함)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '1차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
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
  );
}

/**
 * 2차 하향평가 미제출 상태 변경 API 데코레이터
 */
export function ResetSecondaryDownwardEvaluation() {
  return applyDecorators(
    Post('evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary/reset'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '2차 하향평가 미제출 상태 변경',
      description: `**중요**: 제출된 2차 하향평가를 미제출 상태로 되돌립니다. 평가 내용은 유지되며, isCompleted 상태만 false로 변경됩니다. 1차 하향평가와 독립적으로 초기화됩니다.

**동작:**
- 평가자, 피평가자, 평가기간, WBS로 2차 하향평가 조회
- 평가 상태를 미완료(isCompleted: false)로 변경
- 수정 일시(updatedAt) 갱신
- 1차 하향평가와 독립적으로 초기화
- 평가 내용과 점수는 유지
- 초기화 후 다시 제출 가능

**테스트 케이스:**
- 제출된 2차 하향평가를 미제출 상태로 변경 가능
- 2차 하향평가 초기화 후에도 평가 내용과 점수는 유지
- 1차와 2차 하향평가를 독립적으로 초기화 가능
- 2차 하향평가 초기화 후 다시 제출 가능
- 1차와 2차를 각각 초기화하고 다시 제출하는 전체 플로우 정상 동작
- 여러 번 초기화와 제출을 반복해도 정상 동작
- 존재하지 않는 2차 평가를 초기화하려고 하면 404 에러
- 미제출 상태인 2차 평가를 초기화하려고 하면 400 에러
- 잘못된 UUID 형식으로 요청하면 400 에러`,
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
      name: 'wbsId',
      description: 'WBS ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiBody({
      type: SubmitDownwardEvaluationDto,
      description: '2차 하향평가 초기화 정보 (evaluatorId 포함)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '2차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
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

**동작:**
- 평가자 ID로 하향평가 목록 조회
- 필터 옵션으로 조건에 맞는 평가만 선택
- 페이지네이션으로 대량 데이터 효율적 처리
- 응답에 평가 목록, 총 개수, 페이지 정보 포함

**테스트 케이스:**
- 평가자의 모든 하향평가를 조회할 수 있어야 함
- evaluateeId 필터로 특정 피평가자의 평가만 조회
- periodId 필터로 특정 평가기간의 평가만 조회
- wbsId 필터로 특정 WBS의 평가만 조회
- evaluationType 필터로 1차 또는 2차 평가만 조회
- isCompleted 필터로 완료/미완료 평가를 구분 조회
- 페이지네이션이 올바르게 동작
- 복합 필터를 사용하여 조회
- 조건에 맞는 평가가 없을 때 빈 배열 반환
- 잘못된 evaluatorId 형식으로 요청 시 400 에러
- 잘못된 evaluateeId 필터로 요청 시 400 에러
- 잘못된 periodId 필터로 요청 시 400 에러
- 잘못된 wbsId 필터로 요청 시 400 에러
- 잘못된 evaluationType 값으로 요청 시 400 에러
- page가 0 이하일 때 400 에러
- limit이 100을 초과할 때 400 에러`,
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
      name: 'wbsId',
      description: 'WBS ID',
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

**동작:**
- 하향평가 ID로 상세정보 조회
- 평가 내용, 점수, 제출 상태 포함
- 관련 엔티티 정보 포함 (피평가자, 평가자, WBS, 평가기간, 자기평가)
- 타임스탬프 정보 포함 (생성/수정/제출 일시)

**테스트 케이스:**
- 하향평가 ID로 상세정보 조회 가능
- 1차 하향평가의 상세정보 조회
- 2차 하향평가의 상세정보 조회
- 완료된 평가는 completedAt이 포함
- 미완료 평가는 completedAt이 null
- selfEvaluationId가 있는 경우 selfEvaluation 객체가 포함
- 타임스탬프 필드들이 올바르게 반환
- 관련 엔티티 정보 포함 (employee, evaluator, wbsItem, period)
- 존재하지 않는 ID로 조회 시 404 에러
- 잘못된 UUID 형식으로 조회 시 400 에러`,
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
