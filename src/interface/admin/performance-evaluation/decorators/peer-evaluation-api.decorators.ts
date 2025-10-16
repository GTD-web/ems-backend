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
- 평가자는 할당된 목록을 조회하여 평가 작성 가능

**사용 시나리오:**
1. 관리자가 평가 대상자를 지정
2. 평가자가 할당된 목록 조회
3. 평가자가 평가 작성 및 제출`,
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
- 각 평가자는 자신에게 할당된 평가를 조회 가능

**사용 시나리오:**
- 360도 평가: 한 명의 직원을 여러 동료가 평가
- 팀 내 상호 평가: 팀원들이 팀장을 평가
- 부서 간 협업 평가: 여러 부서원이 한 명을 평가`,
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
- 평가자는 자신에게 할당된 모든 평가를 조회 가능

**사용 시나리오:**
- 팀장이 팀원들을 평가
- 프로젝트 리더가 프로젝트 멤버들을 평가
- 선임이 후임들을 평가`,
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
 * 동료평가 내용 저장 API 데코레이터 (Upsert: 없으면 생성, 있으면 수정)
 */
export function UpsertPeerEvaluation() {
  return applyDecorators(
    Post('evaluatee/:evaluateeId/period/:periodId/project/:projectId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '동료평가 내용 저장',
      description: `평가자가 동료평가 내용(점수, 코멘트)을 작성/수정합니다.

**동작:**
- 관리자가 먼저 평가 요청을 생성해야 함 (PENDING 상태)
- 평가자가 평가 내용(점수, 코멘트)을 입력
- 기존 내용이 있으면 수정, 없으면 새로 생성
- 저장 후에도 여러 번 수정 가능 (제출 전까지)

**사용 시나리오:**
- 평가자가 할당된 평가 목록을 확인
- 평가 내용을 작성하고 임시 저장
- 여러 번 수정 후 최종 제출`,
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
      type: CreatePeerEvaluationBodyDto,
      description: '동료평가 내용 정보 (점수, 코멘트)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '동료평가 내용이 성공적으로 저장되었습니다.',
      type: PeerEvaluationResponseDto,
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
- 평가자는 더 이상 해당 평가를 볼 수 없음

**사용 시나리오:**
- 잘못 할당된 평가 요청을 철회
- 조직 변경으로 인한 평가 요청 무효화`,
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

**사용 시나리오:**
- 피평가자가 퇴사하거나 평가 대상에서 제외된 경우
- 평가기간이 무효화된 경우
- 대량 평가 요청을 일괄 철회해야 하는 경우`,
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
