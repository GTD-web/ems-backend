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
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateWbsSelfEvaluationDto,
  UpdateWbsSelfEvaluationDto,
  SubmitWbsSelfEvaluationDto,
  WbsSelfEvaluationFilterDto,
  WbsSelfEvaluationResponseDto,
  WbsSelfEvaluationDetailResponseDto,
  EmployeeSelfEvaluationsResponseDto,
  WbsSelfEvaluationBasicDto,
} from '../dto/wbs-self-evaluation.dto';

/**
 * WBS 자기평가 생성 API 데코레이터
 */
export function CreateWbsSelfEvaluation() {
  return applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'WBS 자기평가 생성',
      description: '새로운 WBS 자기평가를 생성합니다.',
    }),
    ApiBody({
      type: CreateWbsSelfEvaluationDto,
      description: 'WBS 자기평가 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'WBS 자기평가가 성공적으로 생성되었습니다.',
      type: WbsSelfEvaluationResponseDto,
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
      status: HttpStatus.CONFLICT,
      description: '이미 존재하는 자기평가입니다.',
    }),
    ApiBearerAuth(),
  );
}

/**
 * WBS 자기평가 수정 API 데코레이터
 */
export function UpdateWbsSelfEvaluation() {
  return applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 자기평가 수정',
      description: '기존 WBS 자기평가를 수정합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '자기평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateWbsSelfEvaluationDto,
      description: 'WBS 자기평가 수정 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'WBS 자기평가가 성공적으로 수정되었습니다.',
      type: WbsSelfEvaluationBasicDto,
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
      description: '자기평가를 찾을 수 없습니다.',
    }),
    ApiBearerAuth(),
  );
}

/**
 * WBS 자기평가 제출 API 데코레이터
 */
export function SubmitWbsSelfEvaluation() {
  return applyDecorators(
    Post(':id/submit'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 자기평가 제출',
      description: 'WBS 자기평가를 제출합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '자기평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: SubmitWbsSelfEvaluationDto,
      description: 'WBS 자기평가 제출 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'WBS 자기평가가 성공적으로 제출되었습니다.',
      type: WbsSelfEvaluationResponseDto,
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
      description: '자기평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 제출된 자기평가입니다.',
    }),
    ApiBearerAuth(),
  );
}

/**
 * 직원의 자기평가 목록 조회 API 데코레이터
 */
export function GetEmployeeSelfEvaluations() {
  return applyDecorators(
    Get('employee/:employeeId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '직원의 자기평가 목록 조회',
      description: '특정 직원의 자기평가 목록을 조회합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
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
      description: '직원의 자기평가 목록이 성공적으로 조회되었습니다.',
      type: EmployeeSelfEvaluationsResponseDto,
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
      description: '직원을 찾을 수 없습니다.',
    }),
    ApiBearerAuth(),
  );
}

/**
 * WBS 자기평가 상세정보 조회 API 데코레이터
 */
export function GetWbsSelfEvaluationDetail() {
  return applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 자기평가 상세정보 조회',
      description: 'WBS 자기평가의 상세정보를 조회합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '자기평가 ID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'WBS 자기평가 상세정보가 성공적으로 조회되었습니다.',
      type: WbsSelfEvaluationDetailResponseDto,
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
      description: '자기평가를 찾을 수 없습니다.',
    }),
    ApiBearerAuth(),
  );
}
