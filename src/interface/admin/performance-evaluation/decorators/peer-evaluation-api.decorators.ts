import {
  applyDecorators,
  Post,
  Get,
  Put,
  Delete,
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
  RequestPeerEvaluationDto,
  RequestPeerEvaluationToMultipleEvaluatorsDto,
  RequestMultiplePeerEvaluationsDto,
  CreatePeerEvaluationBodyDto,
  UpdatePeerEvaluationDto,
  SubmitPeerEvaluationDto,
  PeerEvaluationFilterDto,
  PeerEvaluationResponseDto,
  BulkPeerEvaluationRequestResponseDto,
  PeerEvaluationBasicDto,
  PeerEvaluationListResponseDto,
  PeerEvaluationDetailResponseDto,
  GetEvaluatorAssignedEvaluateesQueryDto,
  AssignedEvaluateeDto,
} from '../dto/peer-evaluation.dto';

/**
 * 동료평가 요청(할당) API 데코레이터
 */
export function RequestPeerEvaluation() {
  return applyDecorators(
    Post('requests'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '동료평가 요청(할당)',
      description: `관리자가 평가자에게 피평가자를 평가하도록 요청(할당)합니다.

**동작:**
- 평가자에게 피평가자를 평가하도록 할당
- 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 해당 질문들에 대해 작성 요청 (질문 매핑 자동 생성)
- questionIds 생략 시 질문 없이 요청만 생성
- 평가자는 할당된 목록을 조회하여 평가 작성 가능

**테스트 케이스:**
- 기본 동료평가 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 동료평가 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 동료평가 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 동료평가 요청을 생성할 수 있어야 한다
- requestedBy 없이 동료평가 요청을 생성할 수 있어야 한다
- 동일한 평가자가 여러 피평가자에게 평가 요청을 받을 수 있어야 한다
- 한 피평가자를 여러 평가자가 평가하도록 요청할 수 있어야 한다
- 잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- evaluatorId 누락 시 400 에러가 발생해야 한다
- evaluateeId 누락 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 evaluatorId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 evaluateeId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 periodId로 요청 시 404 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 응답의 ID가 유효한 UUID 형식이어야 한다
- 생성된 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 createdAt과 updatedAt이 설정되어야 한다`,
    }),
    ApiBody({
      type: RequestPeerEvaluationDto,
      description: '동료평가 요청 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '동료평가가 성공적으로 요청되었습니다.',
      type: PeerEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 동일한 동료평가 요청이 존재합니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가자, 피평가자 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 한 명의 피평가자를 여러 평가자에게 요청 API 데코레이터
 */
export function RequestPeerEvaluationToMultipleEvaluators() {
  return applyDecorators(
    Post('requests/bulk/one-evaluatee-to-many-evaluators'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '한 명의 피평가자를 여러 평가자에게 요청',
      description: `한 명의 피평가자를 여러 평가자가 평가하도록 일괄 요청합니다.

**동작:**
- 여러 평가자에게 동일한 피평가자에 대한 평가 요청 생성
- 모든 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 모든 평가자에게 동일한 질문들에 대해 작성 요청
- questionIds 생략 시 질문 없이 요청만 생성
- 각 평가자는 자신에게 할당된 평가를 조회 가능

**테스트 케이스:**
- 기본 일괄 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 일괄 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy 없이 일괄 요청을 생성할 수 있어야 한다
- 단일 평가자에게 요청할 수 있어야 한다
- 많은 평가자에게 동시에 요청할 수 있어야 한다
- 잘못된 형식의 evaluatorIds로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- 빈 evaluatorIds 배열로 요청 시 400 에러가 발생해야 한다
- evaluatorIds 누락 시 400 에러가 발생해야 한다
- evaluateeId 누락 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 evaluatorId 포함 시 해당 평가자는 건너뛰고 나머지만 생성해야 한다
- 존재하지 않는 evaluateeId로 요청 시 404 에러가 발생해야 한다
- 존재하지 않는 periodId로 요청 시 아무것도 생성되지 않아야 한다
- 응답에 필수 필드가 모두 포함되어야 한다 (results, summary, message)
- 응답의 results에 각 요청 결과가 포함되어야 한다 (성공/실패 상태, 에러 정보 등)
- 응답의 summary에 요약 정보가 포함되어야 한다 (total, success, failed)
- 응답의 IDs가 모두 유효한 UUID 형식이어야 한다
- 응답의 count가 생성된 평가 개수와 일치해야 한다
- 생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 모든 평가에 createdAt과 updatedAt이 설정되어야 한다
- 평가자 목록에 피평가자 자신이 포함된 경우 제외되어야 한다`,
    }),
    ApiBody({
      type: RequestPeerEvaluationToMultipleEvaluatorsDto,
      description: '일괄 동료평가 요청 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '동료평가 요청들이 성공적으로 생성되었습니다.',
      type: BulkPeerEvaluationRequestResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가자, 피평가자 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 한 명의 평가자가 여러 피평가자를 평가하도록 요청 API 데코레이터
 */
export function RequestMultiplePeerEvaluations() {
  return applyDecorators(
    Post('requests/bulk/one-evaluator-to-many-evaluatees'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: '한 명의 평가자가 여러 피평가자를 평가하도록 요청',
      description: `한 명의 평가자가 여러 피평가자를 평가하도록 일괄 요청합니다.

**동작:**
- 한 명의 평가자에게 여러 피평가자에 대한 평가 요청 생성
- 모든 평가 상태는 PENDING으로 생성됨
- questionIds 제공 시 모든 피평가자에 대해 동일한 질문들에 대해 작성 요청
- questionIds 생략 시 질문 없이 요청만 생성
- 평가자는 자신에게 할당된 모든 평가를 조회 가능

**테스트 케이스:**
- 기본 일괄 요청을 생성할 수 있어야 한다
- 요청 마감일을 포함하여 일괄 요청을 생성할 수 있어야 한다
- 질문 ID 목록을 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy를 포함하여 일괄 요청을 생성할 수 있어야 한다
- requestedBy 없이 일괄 요청을 생성할 수 있어야 한다
- 단일 피평가자에게 요청할 수 있어야 한다
- 많은 피평가자에게 동시에 요청할 수 있어야 한다
- 잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 evaluateeIds로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- 빈 evaluateeIds 배열로 요청 시 400 에러가 발생해야 한다
- evaluatorId 누락 시 400 에러가 발생해야 한다
- evaluateeIds 누락 시 400 에러가 발생해야 한다
- periodId 누락 시 400 에러가 발생해야 한다
- 잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다
- 존재하지 않는 evaluatorId로 요청 시 아무것도 생성되지 않아야 한다
- 존재하지 않는 evaluateeId 포함 시 해당 피평가자는 건너뛰고 나머지만 생성해야 한다
- 존재하지 않는 periodId로 요청 시 아무것도 생성되지 않아야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 응답의 IDs가 모두 유효한 UUID 형식이어야 한다
- 응답의 count가 생성된 평가 개수와 일치해야 한다
- 생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다
- 생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다
- 생성 시 모든 평가에 createdAt과 updatedAt이 설정되어야 한다
- 피평가자 목록에 평가자 자신이 포함된 경우 제외되어야 한다`,
    }),
    ApiBody({
      type: RequestMultiplePeerEvaluationsDto,
      description: '일괄 동료평가 요청 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: '동료평가 요청들이 성공적으로 생성되었습니다.',
      type: BulkPeerEvaluationRequestResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '평가자, 피평가자 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 동료평가 수정 API 데코레이터
 */
export function UpdatePeerEvaluation() {
  return applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '동료평가 수정',
      description: '기존 동료평가를 수정합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '동료평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdatePeerEvaluationDto,
      description: '동료평가 수정 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '동료평가가 성공적으로 수정되었습니다.',
      type: PeerEvaluationBasicDto,
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
      description: '동료평가를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 동료평가 제출 API 데코레이터
 */
export function SubmitPeerEvaluation() {
  return applyDecorators(
    Post(':id/submit'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '동료평가 제출',
      description: `동료평가를 제출합니다.

**동작:**
- 동료평가를 완료 상태로 변경
- 평가에 매핑된 모든 질문에 대한 응답이 있어야 제출 가능
- 제출 후 isCompleted가 true로 설정됨
- 제출 후 completedAt에 제출 시각이 기록됨

**테스트 케이스:**
- 기본 동료평가 제출을 할 수 있어야 한다
- submittedBy를 포함하여 동료평가 제출을 할 수 있어야 한다
- submittedBy 없이 동료평가 제출을 할 수 있어야 한다
- 잘못된 형식의 평가 ID로 제출 시 400 에러가 발생해야 한다
- 존재하지 않는 평가 ID로 제출 시 400 에러가 발생해야 한다
- 이미 제출된 평가를 다시 제출 시 400 에러가 발생해야 한다
- 잘못된 형식의 submittedBy로 제출 시 400 에러가 발생해야 한다
- 응답 없이 평가 제출 시 400 에러가 발생해야 한다
- 질문이 없는 평가를 제출 시 400 에러가 발생해야 한다
- 제출 성공 시 200 상태 코드를 반환해야 한다
- 제출 후 isCompleted가 true로 변경되어야 한다
- 제출 후 status가 적절히 변경되어야 한다
- 제출 시 completedAt이 설정되어야 한다
- 제출 시 updatedAt이 갱신되어야 한다
- 제출된 평가의 모든 필수 정보가 유지되어야 한다`,
    }),
    ApiParam({
      name: 'id',
      description: '동료평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: SubmitPeerEvaluationDto,
      description: '동료평가 제출 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '동료평가가 성공적으로 제출되었습니다.',
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
      description: '동료평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 제출된 동료평가입니다.',
    }),
  );
}

/**
 * 평가자의 동료평가 목록 조회 API 데코레이터
 */
export function GetEvaluatorPeerEvaluations() {
  return applyDecorators(
    Get('evaluator/:evaluatorId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가자의 동료평가 목록 조회',
      description: `특정 평가자의 동료평가 목록을 페이지네이션 형태로 조회합니다.

**동작:**
- 평가자에게 할당된 모든 동료평가 목록 조회
- 다양한 필터 조건 지원 (피평가자, 평가기간, 프로젝트, 상태)
- 페이지네이션 지원 (기본값: page=1, limit=10)
- 평가 기본 정보만 포함 (상세 정보는 detail 엔드포인트 사용)

**응답 구조:**
- evaluations: 평가 목록 배열
- page: 현재 페이지 번호
- limit: 페이지당 항목 수
- total: 전체 항목 수

**테스트 케이스:**
- 기본 목록을 조회할 수 있어야 한다
- 여러 개의 평가 목록을 조회할 수 있어야 한다
- evaluateeId로 필터링할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- 페이지네이션이 작동해야 한다
- 평가가 없는 평가자의 경우 빈 배열을 반환해야 한다
- 잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 평가 항목에 필수 필드가 포함되어야 한다
- UUID 필드가 유효한 UUID 형식이어야 한다`,
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
      name: 'status',
      description: '평가 상태',
      required: false,
      enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
      example: 'DRAFT',
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
      description: '평가자의 동료평가 목록이 성공적으로 조회되었습니다.',
      type: PeerEvaluationListResponseDto,
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
 * 동료평가 상세정보 조회 API 데코레이터
 */
export function GetPeerEvaluationDetail() {
  return applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '동료평가 상세정보 조회',
      description: `동료평가의 상세정보를 조회합니다.

**동작:**
- 동료평가의 모든 필드 정보 조회
- 평가기간 정보를 객체로 포함 (id, name, startDate, endDate, status)
- 평가자와 피평가자의 직원 정보를 객체로 포함
- 평가자와 피평가자의 부서 정보를 객체로 포함
- 매핑자, 생성자, 수정자의 직원 정보를 객체로 포함
- 평가 상태 및 완료 여부 정보 포함
- 할당된 평가질문 목록 포함 (표시 순서대로 정렬)
- ID 중복 제거: 객체로 제공되는 정보의 ID는 별도 필드로 제공하지 않음

**테스트 케이스:**
- 기본 조회: 평가 ID로 동료평가 상세 정보를 조회할 수 있음
- 모든 필드 조회: 생성된 동료평가의 모든 필드가 조회됨
- 직원 정보 포함: 평가자와 피평가자의 정보가 응답에 포함됨
- 부서 정보 포함: 평가자와 피평가자의 부서 정보가 응답에 포함됨
- 잘못된 UUID 형식: 잘못된 형식의 평가 ID로 조회 시 400 에러
- 존재하지 않는 평가: 존재하지 않는 평가 ID로 조회 시 404 에러
- 필수 필드 검증: 응답에 필수 필드가 모두 포함됨
- UUID 형식 검증: UUID 필드가 유효한 UUID 형식임
- 날짜 형식 검증: 날짜 필드가 유효한 날짜 형식임
- DB 데이터 일치: 조회된 데이터가 DB의 실제 데이터와 일치함
- 초기 상태 검증: 생성 시 isCompleted가 false임
- 대기 상태 검증: 생성 시 status가 pending임`,
    }),
    ApiParam({
      name: 'id',
      description: '동료평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '동료평가 상세정보가 성공적으로 조회되었습니다. 평가자와 피평가자의 직원 정보 및 부서 정보를 포함합니다.',
      type: PeerEvaluationDetailResponseDto,
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
      description: '동료평가를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 평가자에게 할당된 피평가자 목록 조회 API 데코레이터
 */
export function GetEvaluatorAssignedEvaluatees() {
  return applyDecorators(
    Get('evaluator/:evaluatorId/assigned-evaluatees'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가자에게 할당된 피평가자 목록 조회',
      description: `평가자가 평가해야 하는 피평가자 상세 목록을 배열 형태로 조회합니다.

**동작:**
- 평가자에게 할당된 모든 피평가자 목록 조회
- 피평가자 직원 정보 및 부서 정보 포함
- 평가 진행 상태 정보 포함 (status, isCompleted, completedAt)
- 요청 마감일 정보 포함 (requestDeadline)
- 기본적으로 완료되지 않은 평가만 조회 (includeCompleted=false)
- periodId로 특정 평가기간 필터링 가능

**응답 구조:**
- 배열 형태의 직접 반환 (페이지네이션 없음)
- 각 항목에 평가 정보 + 피평가자 정보 + 부서 정보 포함

**정렬 기준:**
- 미완료 평가 우선
- 매핑일 최신순

**테스트 케이스:**
- 기본 목록을 조회할 수 있어야 한다
- 여러 명의 피평가자를 조회할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- 완료된 평가를 제외할 수 있어야 한다 (기본 동작)
- 완료된 평가를 포함할 수 있어야 한다
- 평가가 없는 평가자의 경우 빈 배열을 반환해야 한다
- 잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 조회 시 400 에러가 발생해야 한다
- 응답이 배열 형태여야 한다
- 피평가자 항목에 필수 필드가 포함되어야 한다
- 피평가자 정보에 직원 필드가 포함되어야 한다
- 피평가자 부서 정보가 포함되어야 한다
- UUID 필드가 유효한 UUID 형식이어야 한다`,
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID (필터)',
      required: false,
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiQuery({
      name: 'includeCompleted',
      description: '완료된 평가 포함 여부',
      required: false,
      type: String,
      example: 'false',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '평가자에게 할당된 피평가자 목록이 성공적으로 조회되었습니다.',
      type: [AssignedEvaluateeDto],
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
 * 동료평가 요청 취소 API 데코레이터
 */
export function CancelPeerEvaluation() {
  return applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '동료평가 요청 취소',
      description: `관리자가 보낸 동료평가 요청을 취소합니다.

**동작:**
- 평가 상태를 "cancelled"로 변경
- 작성 중이거나 완료된 평가도 취소 가능
- 평가자는 더 이상 해당 평가를 볼 수 없음`,
    }),
    ApiParam({
      name: 'id',
      description: '동료평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '동료평가 요청이 성공적으로 취소되었습니다.',
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
      description: '동료평가를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 평가기간의 피평가자의 모든 동료평가 요청 취소 API 데코레이터
 */
export function CancelPeerEvaluationsByPeriod() {
  return applyDecorators(
    Delete('evaluatee/:evaluateeId/period/:periodId/cancel-all'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기간의 피평가자의 모든 동료평가 요청 취소',
      description: `특정 피평가자의 특정 평가기간 내 모든 동료평가 요청을 일괄 취소합니다.

**동작:**
- 해당 피평가자에게 할당된 모든 평가 요청을 취소
- 모든 평가 상태를 "cancelled"로 변경
- 취소된 평가 개수를 반환
- 완료된 평가도 취소 가능

**테스트 케이스:**
- 기본 일괄 취소: 피평가자와 평가기간을 지정하여 모든 평가를 취소할 수 있음
- 다중 평가 취소: 여러 평가자의 평가를 한 번에 취소할 수 있음
- 평가기간 필터링: 특정 평가기간의 평가만 취소됨
- 취소할 평가 없음: 취소할 평가가 없으면 0을 반환함
- 잘못된 evaluateeId: 잘못된 형식의 evaluateeId로 요청 시 400 에러
- 잘못된 periodId: 잘못된 형식의 periodId로 요청 시 400 에러
- 존재하지 않는 evaluateeId: 존재하지 않는 evaluateeId로 요청 시 200 반환, cancelledCount는 0
- 존재하지 않는 periodId: 존재하지 않는 periodId로 요청 시 200 반환, cancelledCount는 0
- 필수 필드 검증: 응답에 message와 cancelledCount 필드가 포함됨
- 숫자 형식 검증: cancelledCount가 숫자 형식임
- 문자열 형식 검증: message가 문자열 형식임
- 상태 변경 검증: 취소된 평가의 상태가 'cancelled'로 변경됨
- 타임스탬프 갱신: 취소된 평가의 updatedAt이 갱신됨
- 격리성 검증: 다른 피평가자의 평가는 영향받지 않음
- 완료된 평가 취소: 완료된 평가도 취소할 수 있음`,
    }),
    ApiParam({
      name: 'evaluateeId',
      description: '피평가자 ID',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '동료평가 요청들이 성공적으로 취소되었습니다.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: '동료평가 요청들이 성공적으로 취소되었습니다.',
          },
          cancelledCount: {
            type: 'number',
            example: 5,
            description: '취소된 동료평가 요청 개수',
          },
        },
      },
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
      description: '피평가자 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
}
