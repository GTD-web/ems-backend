import { applyDecorators, Post, Get, Put, Delete, Patch } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

/**
 * WBS 할당 생성 API 데코레이터
 */
export const CreateWbsAssignment = () =>
  applyDecorators(
    Post(),
    ApiOperation({
      summary: 'WBS 할당 생성',
      description: '특정 직원에게 WBS 항목을 할당합니다.',
    }),
    ApiBody({
      description: 'WBS 할당 생성 데이터',
      schema: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            format: 'uuid',
            description: '직원 ID',
          },
          wbsItemId: {
            type: 'string',
            format: 'uuid',
            description: 'WBS 항목 ID',
          },
          periodId: {
            type: 'string',
            format: 'uuid',
            description: '평가기간 ID',
          },
          assignedBy: {
            type: 'string',
            format: 'uuid',
            description: '할당자 ID',
          },
        },
        required: ['employeeId', 'wbsItemId', 'periodId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'WBS 할당이 성공적으로 생성되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid' },
          wbsItemId: { type: 'string', format: 'uuid' },
          periodId: { type: 'string', format: 'uuid' },
          assignedBy: { type: 'string', format: 'uuid' },
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
      description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 할당 취소 API 데코레이터
 */
export const CancelWbsAssignment = () =>
  applyDecorators(
    Delete(':id'),
    ApiOperation({
      summary: 'WBS 할당 취소',
      description: '기존 WBS 할당을 취소합니다.',
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 할당 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 할당이 성공적으로 취소되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 할당을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 할당 목록 조회 API 데코레이터
 */
export const GetWbsAssignmentList = () =>
  applyDecorators(
    Get(),
    ApiOperation({
      summary: 'WBS 할당 목록 조회',
      description: '필터 조건에 따라 WBS 할당 목록을 조회합니다.',
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID',
      required: false,
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'employeeId',
      description: '직원 ID',
      required: false,
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      required: false,
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'projectId',
      description: '프로젝트 ID',
      required: false,
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'page',
      description: '페이지 번호',
      required: false,
      type: 'number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: '페이지 크기',
      required: false,
      type: 'number',
      example: 10,
    }),
    ApiQuery({
      name: 'orderBy',
      description: '정렬 기준',
      required: false,
      type: 'string',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'orderDirection',
      description: '정렬 방향',
      required: false,
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 할당 목록이 성공적으로 조회되었습니다.',
    }),
  );

/**
 * WBS 할당 상세 조회 API 데코레이터
 */
export const GetWbsAssignmentDetail = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({
      summary: 'WBS 할당 상세 조회',
      description: '특정 WBS 할당의 상세 정보를 조회합니다.',
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 할당 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 할당 상세 정보가 성공적으로 조회되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 할당을 찾을 수 없습니다.',
    }),
  );

/**
 * 직원 WBS 할당 조회 API 데코레이터
 */
export const GetEmployeeWbsAssignments = () =>
  applyDecorators(
    Get('employee/:employeeId/period/:periodId'),
    ApiOperation({
      summary: '직원 WBS 할당 조회',
      description: '특정 평가기간에 직원에게 할당된 WBS 항목들을 조회합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: '직원 WBS 할당 목록이 성공적으로 조회되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '직원 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 프로젝트 WBS 할당 조회 API 데코레이터
 */
export const GetProjectWbsAssignments = () =>
  applyDecorators(
    Get('project/:projectId/period/:periodId'),
    ApiOperation({
      summary: '프로젝트 WBS 할당 조회',
      description: '특정 평가기간에 프로젝트의 WBS 할당을 조회합니다.',
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 WBS 할당 목록이 성공적으로 조회되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 항목 할당된 직원 조회 API 데코레이터
 */
export const GetWbsItemAssignments = () =>
  applyDecorators(
    Get('wbs-item/:wbsItemId/period/:periodId'),
    ApiOperation({
      summary: 'WBS 항목 할당된 직원 조회',
      description: '특정 평가기간에 WBS 항목에 할당된 직원들을 조회합니다.',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 항목 할당된 직원 목록이 성공적으로 조회되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 항목 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 할당되지 않은 WBS 항목 조회 API 데코레이터
 */
export const GetUnassignedWbsItems = () =>
  applyDecorators(
    Get('unassigned'),
    ApiOperation({
      summary: '할당되지 않은 WBS 항목 조회',
      description:
        '특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목들을 조회합니다.',
    }),
    ApiQuery({
      name: 'projectId',
      description: '프로젝트 ID',
      required: true,
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID',
      required: true,
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'employeeId',
      description: '직원 ID (선택사항)',
      required: false,
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: '할당되지 않은 WBS 항목 목록이 성공적으로 조회되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * WBS 대량 할당 API 데코레이터
 */
export const BulkCreateWbsAssignments = () =>
  applyDecorators(
    Post('bulk'),
    ApiOperation({
      summary: 'WBS 대량 할당',
      description: '여러 직원에게 WBS 항목을 대량으로 할당합니다.',
    }),
    ApiBody({
      description: 'WBS 대량 할당 데이터',
      schema: {
        type: 'object',
        properties: {
          assignments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                employeeId: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                periodId: { type: 'string', format: 'uuid' },
                assignedBy: { type: 'string', format: 'uuid' },
              },
              required: ['employeeId', 'wbsItemId', 'periodId'],
            },
          },
        },
        required: ['assignments'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'WBS 대량 할당이 성공적으로 생성되었습니다.',
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터입니다.',
    }),
  );

/**
 * 평가기간 WBS 할당 초기화 API 데코레이터
 */
export const ResetPeriodWbsAssignments = () =>
  applyDecorators(
    Delete('period/:periodId'),
    ApiOperation({
      summary: '평가기간 WBS 할당 초기화',
      description: '특정 평가기간의 모든 WBS 할당을 초기화합니다.',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      description: '초기화 데이터',
      schema: {
        type: 'object',
        properties: {
          resetBy: {
            type: 'string',
            format: 'uuid',
            description: '초기화자 ID',
          },
        },
        required: ['resetBy'],
      },
    }),
    ApiResponse({
      status: 200,
      description: '평가기간 WBS 할당이 성공적으로 초기화되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 프로젝트 WBS 할당 초기화 API 데코레이터
 */
export const ResetProjectWbsAssignments = () =>
  applyDecorators(
    Delete('project/:projectId/period/:periodId'),
    ApiOperation({
      summary: '프로젝트 WBS 할당 초기화',
      description: '특정 평가기간의 특정 프로젝트 WBS 할당을 초기화합니다.',
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      description: '초기화 데이터',
      schema: {
        type: 'object',
        properties: {
          resetBy: {
            type: 'string',
            format: 'uuid',
            description: '초기화자 ID',
          },
        },
        required: ['resetBy'],
      },
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 WBS 할당이 성공적으로 초기화되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
  );

/**
 * 직원 WBS 할당 초기화 API 데코레이터
 */
export const ResetEmployeeWbsAssignments = () =>
  applyDecorators(
    Delete('employee/:employeeId/period/:periodId'),
    ApiOperation({
      summary: '직원 WBS 할당 초기화',
      description: '특정 평가기간의 특정 직원 WBS 할당을 초기화합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      description: '초기화 데이터',
      schema: {
        type: 'object',
        properties: {
          resetBy: {
            type: 'string',
            format: 'uuid',
            description: '초기화자 ID',
          },
        },
        required: ['resetBy'],
      },
    }),
    ApiResponse({
      status: 200,
      description: '직원 WBS 할당이 성공적으로 초기화되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '직원 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
