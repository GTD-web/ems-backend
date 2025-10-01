import {
  applyDecorators,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

/**
 * WBS 평가기준 목록 조회 API 데코레이터
 */
export const GetWbsEvaluationCriteriaList = () =>
  applyDecorators(
    Get(),
    ApiOperation({
      summary: 'WBS 평가기준 목록 조회',
      description: '필터 조건에 따라 WBS 평가기준 목록을 조회합니다.',
    }),
    ApiQuery({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      required: false,
      type: String,
    }),
    ApiQuery({
      name: 'criteriaSearch',
      description: '기준 내용 검색 (부분 일치)',
      required: false,
      type: String,
    }),
    ApiQuery({
      name: 'criteriaExact',
      description: '기준 내용 완전 일치',
      required: false,
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            wbsItemId: { type: 'string', format: 'uuid' },
            criteria: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
  );

/**
 * WBS 평가기준 상세 조회 API 데코레이터
 */
export const GetWbsEvaluationCriteriaDetail = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: 'WBS 평가기준 상세 조회',
      description: '특정 WBS 평가기준의 상세 정보를 조회합니다.',
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 평가기준 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준 상세 정보가 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 항목별 평가기준 조회 API 데코레이터
 */
export const GetWbsItemEvaluationCriteria = () =>
  applyDecorators(
    Get('wbs-item/:wbsItemId'),
    ApiOperation({
      summary: 'WBS 항목별 평가기준 조회',
      description: '특정 WBS 항목의 모든 평가기준을 조회합니다.',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 항목별 평가기준이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                criteria: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 생성 API 데코레이터
 */
export const CreateWbsEvaluationCriteria = () =>
  applyDecorators(
    Post(),
    ApiOperation({
      summary: 'WBS 평가기준 생성',
      description: '새로운 WBS 평가기준을 생성합니다.',
    }),
    ApiBody({
      description: 'WBS 평가기준 생성 데이터',
      schema: {
        type: 'object',
        properties: {
          wbsItemId: {
            type: 'string',
            format: 'uuid',
            description: 'WBS 항목 ID',
          },
          criteria: {
            type: 'string',
            description: '평가기준 내용',
          },
        },
        required: ['wbsItemId', 'criteria'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'WBS 평가기준이 성공적으로 생성되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 수정 API 데코레이터
 */
export const UpdateWbsEvaluationCriteria = () =>
  applyDecorators(
    Put(':id'),
    ApiOperation({
      summary: 'WBS 평가기준 수정',
      description: '기존 WBS 평가기준을 수정합니다.',
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 평가기준 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      description: 'WBS 평가기준 수정 데이터',
      schema: {
        type: 'object',
        properties: {
          criteria: {
            type: 'string',
            description: '평가기준 내용',
          },
        },
        required: ['criteria'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준이 성공적으로 수정되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          criteria: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 삭제 API 데코레이터
 */
export const DeleteWbsEvaluationCriteria = () =>
  applyDecorators(
    Delete(':id'),
    ApiOperation({
      summary: 'WBS 평가기준 삭제',
      description: '기존 WBS 평가기준을 삭제합니다.',
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 평가기준 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준이 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 항목 평가기준 전체 삭제 API 데코레이터
 */
export const DeleteWbsItemEvaluationCriteria = () =>
  applyDecorators(
    Delete('wbs-item/:wbsItemId'),
    ApiOperation({
      summary: 'WBS 항목 평가기준 전체 삭제',
      description: '특정 WBS 항목의 모든 평가기준을 삭제합니다.',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 항목의 모든 평가기준이 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목을 찾을 수 없습니다.',
    }),
  );
