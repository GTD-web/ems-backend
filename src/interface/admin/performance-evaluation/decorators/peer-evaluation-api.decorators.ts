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
- 기본 요청: 평가자, 피평가자, 평가기간을 지정하여 동료평가 요청 생성
- 질문 포함 요청: questionIds를 포함하여 특정 질문에 대한 평가 요청
- 질문 생략 요청: questionIds 없이 요청만 생성
- requestedBy 포함: 요청자 ID를 포함하여 요청 가능
- requestedBy 생략: 요청자 ID 없이도 요청 가능 (기본값 사용)
- 중복 요청 방지: 동일한 조건으로 여러 번 요청 시 중복 생성되지 않음 (동일 ID 반환)
- 응답 구조 검증: 응답에 id와 message 필드 포함
- 성공 메시지: 응답 메시지에 "성공적으로 요청" 문구 포함
- 잘못된 evaluatorId: UUID 형식이 아닌 평가자 ID 입력 시 400 에러
- 잘못된 evaluateeId: UUID 형식이 아닌 피평가자 ID 입력 시 400 에러
- 잘못된 periodId: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러
- 잘못된 questionIds: UUID 형식이 아닌 질문 ID 포함 시 400 에러
- 필수 필드 누락: evaluatorId, evaluateeId, periodId 중 하나라도 누락 시 400 에러`,
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
- 일괄 요청: 한 명의 피평가자를 여러 평가자에게 동시 요청
- 응답 구조 검증: 응답에 ids 배열, count, message 필드 포함
- IDs 배열 길이: 생성된 평가 요청 ID 배열이 요청한 평가자 수와 일치
- 생성 개수 일치: count가 evaluatorIds 배열 길이와 동일
- 성공 메시지: 응답 메시지에 "성공적으로 생성" 문구 포함
- requestedBy 포함: 요청자 ID를 포함하여 일괄 요청 가능
- requestedBy 생략: 요청자 ID 없이도 일괄 요청 가능
- 단일 평가자: 평가자가 한 명만 포함된 경우에도 정상 처리
- 많은 평가자: 50명 이상의 평가자에게 요청 가능
- 자기 평가 제외: 평가자 목록에 피평가자 자신이 포함된 경우 제외됨
- 빈 evaluatorIds 배열: 평가자 ID 배열이 비어있으면 400 에러
- 잘못된 UUID 포함: evaluatorIds에 UUID 형식이 아닌 값 포함 시 400 에러
- 잘못된 evaluateeId: UUID 형식이 아닌 피평가자 ID 입력 시 400 에러
- 잘못된 periodId: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러`,
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
- 일괄 요청: 한 명의 평가자가 여러 피평가자를 평가하도록 동시 요청
- 응답 구조 검증: 응답에 ids 배열, count, message 필드 포함
- IDs 배열 길이: 생성된 평가 요청 ID 배열이 요청한 피평가자 수와 일치
- 생성 개수 일치: count가 evaluateeIds 배열 길이와 동일
- 성공 메시지: 응답 메시지에 "성공적으로 생성" 문구 포함
- requestedBy 포함: 요청자 ID를 포함하여 일괄 요청 가능
- requestedBy 생략: 요청자 ID 없이도 일괄 요청 가능
- 단일 피평가자: 피평가자가 한 명만 포함된 경우에도 정상 처리
- 많은 피평가자: 50명 이상의 피평가자에 대해 요청 가능
- 자기 평가 제외: 피평가자 목록에 평가자 자신이 포함된 경우 제외됨
- 빈 evaluateeIds 배열: 피평가자 ID 배열이 비어있으면 400 에러
- 잘못된 UUID 포함: evaluateeIds에 UUID 형식이 아닌 값 포함 시 400 에러
- 잘못된 evaluatorId: UUID 형식이 아닌 평가자 ID 입력 시 400 에러
- 잘못된 periodId: UUID 형식이 아닌 평가기간 ID 입력 시 400 에러`,
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
      description: '동료평가를 제출합니다.',
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
      description: '특정 평가자의 동료평가 목록을 조회합니다.',
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
      
**포함되는 정보:**
- 동료평가 기본 정보 (ID, 점수, 내용, 상태 등)
- 평가자 정보 (이름, 사번, 이메일, 부서 등)
- 평가자 부서 정보 (부서명, 부서 코드)
- 피평가자 정보 (이름, 사번, 이메일, 부서 등)
- 피평가자 부서 정보 (부서명, 부서 코드)
- 메타데이터 (생성일, 수정일, 버전 등)`,
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
      description: `평가자가 평가해야 하는 피평가자 상세 목록을 조회합니다.

**포함되는 정보:**
- 피평가자 직원 정보 (이름, 사번, 이메일, 부서 등)
- 피평가자 부서 정보 (부서명, 부서 코드)
- 평가 진행 상태 (미작성, 작성중, 완료)
- 평가 점수 및 내용 (작성된 경우)

**정렬 기준:**
- 미완료 평가 우선
- 매핑일 최신순`,
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
- 취소된 평가 개수를 반환`,
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
