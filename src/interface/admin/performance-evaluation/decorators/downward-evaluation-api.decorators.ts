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
      description:
        '1차 하향평가를 저장합니다. 기존 평가가 있으면 수정하고, 없으면 새로 생성합니다.',
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
      description:
        '2차 하향평가를 저장합니다. 기존 평가가 있으면 수정하고, 없으면 새로 생성합니다.',
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
      description:
        '1차 하향평가를 제출합니다. 제출 후에는 수정이 불가능합니다.',
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
      description:
        '2차 하향평가를 제출합니다. 제출 후에는 수정이 불가능합니다.',
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
      description:
        '하향평가 ID를 사용하여 직접 제출합니다. 1차/2차 구분 없이 ID로 제출할 때 사용합니다.',
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
      description: '특정 평가자의 하향평가 목록을 조회합니다.',
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
      description: '하향평가의 상세정보를 조회합니다.',
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
