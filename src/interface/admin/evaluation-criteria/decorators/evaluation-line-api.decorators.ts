import { applyDecorators, Get, Post, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

/**
 * 평가라인 목록 조회 API 데코레이터
 */
export const GetEvaluationLineList = () =>
  applyDecorators(
    Get(),
    ApiOperation({
      summary: '평가라인 목록 조회',
      description: '필터 조건에 따라 평가라인 목록을 조회합니다.',
    }),
    ApiQuery({
      name: 'evaluatorType',
      description: '평가자 유형',
      required: false,
      enum: ['primary', 'secondary', 'additional'],
    }),
    ApiQuery({
      name: 'isRequired',
      description: '필수 평가자 여부',
      required: false,
      type: Boolean,
    }),
    ApiQuery({
      name: 'isAutoAssigned',
      description: '자동 할당 여부',
      required: false,
      type: Boolean,
    }),
    ApiResponse({
      status: 200,
      description: '평가라인 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            evaluatorType: {
              type: 'string',
              enum: ['primary', 'secondary', 'additional'],
            },
            order: { type: 'number' },
            isRequired: { type: 'boolean' },
            isAutoAssigned: { type: 'boolean' },
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
 * 직원 평가라인 매핑 조회 API 데코레이터
 */
export const GetEmployeeEvaluationLineMappings = () =>
  applyDecorators(
    Get('employee/:employeeId/mappings'),
    ApiOperation({
      summary: '직원 평가라인 매핑 조회',
      description: '특정 직원의 평가라인 매핑을 조회합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiResponse({
      status: 200,
      description: '직원 평가라인 매핑이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', format: 'uuid' },
          mappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                employeeId: { type: 'string', format: 'uuid' },
                evaluatorId: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                evaluationLineId: { type: 'string', format: 'uuid' },
                createdBy: { type: 'string', format: 'uuid' },
                updatedBy: { type: 'string', format: 'uuid' },
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
      description: '직원을 찾을 수 없습니다.',
    }),
  );

/**
 * 평가자별 피평가자 조회 API 데코레이터
 */
export const GetEvaluatorEmployees = () =>
  applyDecorators(
    Get('evaluator/:evaluatorId/employees'),
    ApiOperation({
      summary: '평가자별 피평가자 조회',
      description: '특정 평가자가 평가해야 하는 피평가자 목록을 조회합니다.',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      type: 'string',
      format: 'uuid',
      example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    ApiResponse({
      status: 200,
      description: '평가자별 피평가자 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          evaluatorId: { type: 'string', format: 'uuid' },
          employees: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                employeeId: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                evaluationLineId: { type: 'string', format: 'uuid' },
                createdBy: { type: 'string', format: 'uuid' },
                updatedBy: { type: 'string', format: 'uuid' },
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
      description: '평가자를 찾을 수 없습니다.',
    }),
  );

/**
 * 수정자별 평가라인 매핑 조회 API 데코레이터
 */
export const GetUpdaterEvaluationLineMappings = () =>
  applyDecorators(
    Get('updater/:updatedBy/mappings'),
    ApiOperation({
      summary: '수정자별 평가라인 매핑 조회',
      description: '특정 사용자가 수정한 평가라인 매핑을 조회합니다.',
    }),
    ApiParam({
      name: 'updatedBy',
      description: '수정자 ID',
      type: 'string',
      format: 'uuid',
      example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    ApiResponse({
      status: 200,
      description: '수정자별 평가라인 매핑이 성공적으로 조회되었습니다.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employeeId: { type: 'string', format: 'uuid' },
            evaluatorId: { type: 'string', format: 'uuid' },
            wbsItemId: { type: 'string', format: 'uuid' },
            evaluationLineId: { type: 'string', format: 'uuid' },
            createdBy: { type: 'string', format: 'uuid' },
            updatedBy: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '수정자를 찾을 수 없습니다.',
    }),
  );

/**
 * 직원-WBS별 평가라인 구성 API 데코레이터
 */
export const ConfigureEmployeeWbsEvaluationLine = () =>
  applyDecorators(
    Post('employee/:employeeId/wbs/:wbsItemId/period/:periodId/configure'),
    ApiOperation({
      summary: '직원-WBS별 평가라인 구성',
      description: '특정 직원의 특정 WBS 항목에 대한 평가라인을 구성합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiBody({
      description: '평가라인 구성 데이터',
      schema: {
        type: 'object',
        properties: {
          createdBy: {
            type: 'string',
            format: 'uuid',
            description: '생성자 ID',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
        },
        required: [],
      },
    }),
    ApiResponse({
      status: 201,
      description: '평가라인 구성이 성공적으로 완료되었습니다.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          createdLines: { type: 'number' },
          createdMappings: { type: 'number' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 직원 평가설정 통합 조회 API 데코레이터
 */
export const GetEmployeeEvaluationSettings = () =>
  applyDecorators(
    Get('employee/:employeeId/period/:periodId/settings'),
    ApiOperation({
      summary: '직원 평가설정 통합 조회',
      description:
        '특정 직원의 특정 평가기간에 대한 모든 평가설정을 통합 조회합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiResponse({
      status: 200,
      description: '직원 평가설정이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', format: 'uuid' },
          periodId: { type: 'string', format: 'uuid' },
          projectAssignments: {
            type: 'array',
            items: { type: 'object' },
          },
          wbsAssignments: {
            type: 'array',
            items: { type: 'object' },
          },
          evaluationLineMappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                employeeId: { type: 'string', format: 'uuid' },
                evaluatorId: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                evaluationLineId: { type: 'string', format: 'uuid' },
                createdBy: { type: 'string', format: 'uuid' },
                updatedBy: { type: 'string', format: 'uuid' },
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
      description: '직원 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 1차 평가자 구성 API 데코레이터
 */
export const ConfigurePrimaryEvaluator = () =>
  applyDecorators(
    Post(
      'employee/:employeeId/wbs/:wbsItemId/period/:periodId/primary-evaluator',
    ),
    ApiOperation({
      summary: '1차 평가자 구성',
      description: '특정 직원의 특정 WBS 항목에 대한 1차 평가자를 구성합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiBody({
      description: '1차 평가자 구성 데이터',
      schema: {
        type: 'object',
        properties: {
          evaluatorId: {
            type: 'string',
            format: 'uuid',
            description: '1차 평가자 ID',
            example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
          },
          createdBy: {
            type: 'string',
            format: 'uuid',
            description: '생성자 ID (선택)',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
        },
        required: ['evaluatorId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: '1차 평가자 구성이 성공적으로 완료되었습니다.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          createdLines: { type: 'number' },
          createdMappings: { type: 'number' },
          mapping: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              employeeId: { type: 'string', format: 'uuid' },
              evaluatorId: { type: 'string', format: 'uuid' },
              wbsItemId: { type: 'string', format: 'uuid' },
              evaluationLineId: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 2차 평가자 구성 API 데코레이터
 */
export const ConfigureSecondaryEvaluator = () =>
  applyDecorators(
    Post(
      'employee/:employeeId/wbs/:wbsItemId/period/:periodId/secondary-evaluator',
    ),
    ApiOperation({
      summary: '2차 평가자 구성',
      description: '특정 직원의 특정 WBS 항목에 대한 2차 평가자를 구성합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiBody({
      description: '2차 평가자 구성 데이터',
      schema: {
        type: 'object',
        properties: {
          evaluatorId: {
            type: 'string',
            format: 'uuid',
            description: '2차 평가자 ID',
            example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
          },
          createdBy: {
            type: 'string',
            format: 'uuid',
            description: '생성자 ID (선택)',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
        },
        required: ['evaluatorId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: '2차 평가자 구성이 성공적으로 완료되었습니다.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          createdLines: { type: 'number' },
          createdMappings: { type: 'number' },
          mapping: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              employeeId: { type: 'string', format: 'uuid' },
              evaluatorId: { type: 'string', format: 'uuid' },
              wbsItemId: { type: 'string', format: 'uuid' },
              evaluationLineId: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
    ApiResponse({
      status: 404,
      description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
