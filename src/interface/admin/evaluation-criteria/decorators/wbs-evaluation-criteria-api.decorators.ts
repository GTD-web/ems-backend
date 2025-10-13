import {
  applyDecorators,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
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
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
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
      example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
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
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
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
 * WBS 평가기준 저장 (Upsert) API 데코레이터
 * - 평가기준 ID가 Body에 없으면 생성
 * - 평가기준 ID가 Body에 있으면 수정
 */
export const UpsertWbsEvaluationCriteria = () =>
  applyDecorators(
    Post('wbs-item/:wbsItemId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 평가기준 저장 (Upsert)',
      description: `WBS 평가기준을 저장합니다. 평가기준 ID가 없으면 생성하고, 있으면 수정합니다.

**동작 방식:**
- Body에 id가 없으면: 새로운 평가기준 생성
- Body에 id가 있으면: 기존 평가기준 수정

**사용 사례:**
- 평가기준 최초 작성 시: id 없이 전송
- 평가기준 수정 시: 기존 id와 함께 전송`,
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiBody({
      description: 'WBS 평가기준 저장 데이터',
      schema: {
        type: 'object',
        properties: {
          criteria: {
            type: 'string',
            description: '평가기준 내용',
            example: '코드 품질 및 성능 최적화',
          },
          id: {
            type: 'string',
            format: 'uuid',
            description: '평가기준 ID (선택사항 - 있으면 수정, 없으면 생성)',
            example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
          },
          actionBy: {
            type: 'string',
            format: 'uuid',
            description: '생성/수정자 ID (선택사항)',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
        },
        required: ['criteria'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 평가기준이 성공적으로 저장되었습니다.',
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
      description: 'WBS 항목 또는 평가기준을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 평가기준 생성 API 데코레이터
 */
export const CreateWbsEvaluationCriteria = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
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
      example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
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
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
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
