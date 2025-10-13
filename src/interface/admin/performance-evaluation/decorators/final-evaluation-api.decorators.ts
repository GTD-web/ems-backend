import { applyDecorators, Get, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import {
  UpsertFinalEvaluationBodyDto,
  UpdateFinalEvaluationBodyDto,
  ConfirmFinalEvaluationBodyDto,
  CancelConfirmationBodyDto,
  FinalEvaluationResponseDto,
  FinalEvaluationBasicDto,
  FinalEvaluationDetailDto,
  FinalEvaluationListResponseDto,
  FinalEvaluationFilterDto,
} from '../dto/final-evaluation.dto';

/**
 * 최종평가 저장 (Upsert) API 데코레이터
 */
export function UpsertFinalEvaluation() {
  return applyDecorators(
    Post('employee/:employeeId/period/:periodId'),
    ApiOperation({
      summary: '최종평가 저장 (Upsert)',
      description:
        '직원과 평가기간 조합으로 최종평가를 저장합니다. 이미 존재하면 수정, 없으면 생성됩니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      example: 'employee-uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      example: 'period-uuid',
    }),
    ApiBody({ type: UpsertFinalEvaluationBodyDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '최종평가가 성공적으로 저장되었습니다.',
      type: FinalEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: '잘못된 요청 데이터',
    }),
    ApiResponse({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      description: '확정된 평가는 수정할 수 없습니다.',
    }),
  );
}

/**
 * 최종평가 확정 API 데코레이터
 */
export function ConfirmFinalEvaluation() {
  return applyDecorators(
    Post(':id/confirm'),
    ApiOperation({
      summary: '최종평가 확정',
      description:
        '최종평가를 확정합니다. 확정 후에는 수정/삭제가 불가능합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '최종평가 ID',
      example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    ApiBody({ type: ConfirmFinalEvaluationBodyDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '최종평가가 성공적으로 확정되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '최종평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '이미 확정된 평가입니다.',
    }),
  );
}

/**
 * 최종평가 확정 취소 API 데코레이터
 */
export function CancelConfirmationFinalEvaluation() {
  return applyDecorators(
    Post(':id/cancel-confirmation'),
    ApiOperation({
      summary: '최종평가 확정 취소',
      description: '확정된 최종평가를 취소하여 다시 수정 가능하게 합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '최종평가 ID',
      example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    ApiBody({ type: CancelConfirmationBodyDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '최종평가 확정이 성공적으로 취소되었습니다.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '최종평가를 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      description: '확정되지 않은 평가입니다.',
    }),
  );
}

/**
 * 최종평가 단일 조회 API 데코레이터
 */
export function GetFinalEvaluation() {
  return applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: '최종평가 조회',
      description: 'ID로 최종평가 상세정보를 조회합니다.',
    }),
    ApiParam({
      name: 'id',
      description: '최종평가 ID',
      example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '최종평가 조회 성공',
      type: FinalEvaluationDetailDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '최종평가를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 최종평가 목록 조회 API 데코레이터
 */
export function GetFinalEvaluationList() {
  return applyDecorators(
    Get(),
    ApiOperation({
      summary: '최종평가 목록 조회',
      description: '필터 조건에 따라 최종평가 목록을 조회합니다.',
    }),
    ApiQuery({ type: FinalEvaluationFilterDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '최종평가 목록 조회 성공',
      type: FinalEvaluationListResponseDto,
    }),
  );
}

/**
 * 직원-평가기간별 최종평가 조회 API 데코레이터
 */
export function GetFinalEvaluationByEmployeePeriod() {
  return applyDecorators(
    Get('employee/:employeeId/period/:periodId'),
    ApiOperation({
      summary: '직원-평가기간별 최종평가 조회',
      description: '특정 직원의 특정 평가기간 최종평가를 조회합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      example: '234e5678-e89b-12d3-a456-426614174001',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '최종평가 조회 성공',
      type: FinalEvaluationDetailDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '최종평가를 찾을 수 없습니다.',
    }),
  );
}
