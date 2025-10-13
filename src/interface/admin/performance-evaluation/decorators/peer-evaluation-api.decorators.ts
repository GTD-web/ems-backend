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
  CreatePeerEvaluationBodyDto,
  UpdatePeerEvaluationDto,
  SubmitPeerEvaluationDto,
  PeerEvaluationFilterDto,
  PeerEvaluationResponseDto,
  PeerEvaluationBasicDto,
  PeerEvaluationListResponseDto,
  PeerEvaluationDetailResponseDto,
} from '../dto/peer-evaluation.dto';

/**
 * 동료평가 저장 API 데코레이터 (Upsert: 없으면 생성, 있으면 수정)
 */
export function UpsertPeerEvaluation() {
  return applyDecorators(
    Post('evaluatee/:evaluateeId/period/:periodId/project/:projectId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '동료평가 저장',
      description:
        '동료평가를 저장합니다. 기존 평가가 있으면 수정하고, 없으면 새로 생성합니다.',
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
      description: '동료평가 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '동료평가가 성공적으로 저장되었습니다.',
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
      description: '동료평가의 상세정보를 조회합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '동료평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '동료평가 상세정보가 성공적으로 조회되었습니다.',
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
 * 동료평가 취소 API 데코레이터
 */
export function CancelPeerEvaluation() {
  return applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: '동료평가 취소',
      description:
        '단일 동료평가를 취소합니다. 상태가 "cancelled"로 변경됩니다.',
    }),
    ApiParam({
      name: 'id',
      description: '동료평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '동료평가가 성공적으로 취소되었습니다.',
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
 * 평가기간의 피평가자의 모든 동료평가 취소 API 데코레이터
 */
export function CancelPeerEvaluationsByPeriod() {
  return applyDecorators(
    Delete('evaluatee/:evaluateeId/period/:periodId/cancel-all'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기간의 피평가자의 모든 동료평가 취소',
      description:
        '특정 피평가자의 특정 평가기간 내 모든 동료평가를 일괄 취소합니다.',
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
      description: '동료평가들이 성공적으로 취소되었습니다.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: '동료평가들이 성공적으로 취소되었습니다.',
          },
          cancelledCount: {
            type: 'number',
            example: 5,
            description: '취소된 동료평가 개수',
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
