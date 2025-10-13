import {
  applyDecorators,
  Post,
  Get,
  Put,
  Delete,
  Patch,
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
 * WBS 할당 생성 API 데코레이터
 */
export const CreateWbsAssignment = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'WBS 할당 생성',
      description: `**중요**: 특정 직원에게 특정 평가기간의 WBS 항목을 할당합니다. 할당 시 중복 검증, 평가기간 상태 검증, 자동 평가기준 생성, 평가라인 자동 구성 등을 수행합니다.

**자동 수행 작업:**
- WBS 평가기준 자동 생성: 해당 WBS 항목에 평가기준이 없는 경우 빈 평가기준을 자동으로 생성
- 평가라인 자동 구성: 직원의 관리자를 1차 평가자, 프로젝트 PM을 2차 평가자로 자동 설정
- 중복 검증: 동일한 직원-WBS-프로젝트-평가기간 조합의 중복 할당 방지

**테스트 케이스:**
- 기본 할당: 유효한 직원, WBS 항목, 프로젝트, 평가기간으로 할당 생성
- 할당자 정보: 할당 생성 시 assignedBy, createdBy, updatedBy 정보가 올바르게 설정됨
- 할당 날짜: assignedDate가 현재 시간으로 자동 설정됨
- 평가기준 자동 생성: WBS 항목에 평가기준이 없는 경우 빈 평가기준 자동 생성 확인
- 평가라인 자동 구성: 1차 평가자(관리자), 2차 평가자(PM) 자동 설정 확인
- PM과 관리자 동일: PM이 관리자와 같은 경우 2차 평가자 미설정
- 평가라인 중복 방지: 이미 평가라인이 있는 경우 중복 생성하지 않음
- 중복 할당 방지: 동일한 직원-WBS-프로젝트-평가기간 조합 중복 생성 시 409 에러
- 중복 평가기준 처리: 동시에 동일 WBS 평가기준 생성 시 적절한 에러 반환
- 필수 필드 검증: employeeId, wbsItemId, projectId, periodId 누락 시 400 에러
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 직원 존재 검증: 존재하지 않는 직원 ID 시 404 에러
- WBS 항목 존재 검증: 존재하지 않는 WBS 항목 ID 시 404 에러
- 프로젝트 존재 검증: 존재하지 않는 프로젝트 ID 시 404 에러
- 평가기간 존재 검증: 존재하지 않는 평가기간 ID 시 404 에러
- 완료된 평가기간 제한: 완료된 평가기간에 할당 생성 시 422 에러
- 진행 중 평가기간 허용: 진행 중인 평가기간에는 할당 생성 가능
- 할당 목록 반영: 생성된 할당이 목록 조회에 즉시 반영됨
- 상세 조회 가능: 생성된 할당의 상세 정보 조회 가능
- 감사 정보: 생성일시, 수정일시, 생성자, 수정자 정보 자동 기록`,
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
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          wbsItemId: {
            type: 'string',
            format: 'uuid',
            description: 'WBS 항목 ID',
            example: '123e4567-e89b-12d3-a456-426614174001',
          },
          projectId: {
            type: 'string',
            format: 'uuid',
            description: '프로젝트 ID',
            example: '123e4567-e89b-12d3-a456-426614174002',
          },
          periodId: {
            type: 'string',
            format: 'uuid',
            description: '평가기간 ID',
            example: '123e4567-e89b-12d3-a456-426614174003',
          },
          assignedBy: {
            type: 'string',
            format: 'uuid',
            description: '할당자 ID (선택사항)',
            example: '123e4567-e89b-12d3-a456-426614174004',
          },
        },
        required: ['employeeId', 'wbsItemId', 'projectId', 'periodId'],
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
          projectId: { type: 'string', format: 'uuid' },
          periodId: { type: 'string', format: 'uuid' },
          assignedBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (필수 필드 누락, UUID 형식 오류 등)',
    }),
    ApiResponse({
      status: 404,
      description: '직원, WBS 항목, 프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 409,
      description:
        '중복된 할당입니다. (동일한 직원-WBS-프로젝트-평가기간 조합)',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간에 할당 생성 불가 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
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
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'WBS 대량 할당',
      description: `**중요**: 여러 직원에게 여러 WBS 항목을 한 번에 할당합니다. 모든 할당이 성공하거나 모두 실패하는 트랜잭션 방식으로 처리됩니다. 각 할당마다 평가기준 자동 생성과 평가라인 자동 구성이 수행됩니다.

**자동 수행 작업:**
- WBS 평가기준 자동 생성: 각 WBS 항목에 평가기준이 없는 경우 빈 평가기준을 자동으로 생성
- 평가라인 자동 구성: 각 할당마다 직원의 관리자를 1차 평가자, 프로젝트 PM을 2차 평가자로 자동 설정
- 중복 검증: 동일한 직원-WBS-프로젝트-평가기간 조합의 중복 할당 방지
- 트랜잭션 처리: 일부 할당 실패 시 전체 롤백

**테스트 케이스:**
- 다중 할당: 여러 직원을 여러 WBS 항목에 대량 할당
- 단일 직원 다중 WBS: 한 직원을 여러 WBS 항목에 할당
- 다중 직원 단일 WBS: 여러 직원을 한 WBS 항목에 할당
- 평가기준 자동 생성: 각 WBS 항목에 평가기준이 없는 경우 자동 생성 확인
- 평가기준 중복 방지: 동일 WBS 항목은 평가기준을 한 번만 생성
- 평가라인 자동 구성: 각 할당마다 1차, 2차 평가자 자동 설정 확인
- 평가라인 중복 방지: 이미 평가라인이 있는 경우 중복 생성하지 않음
- PM과 관리자 동일: PM이 관리자와 같은 경우 2차 평가자 미설정
- 트랜잭션 처리: 일부 할당 실패 시 전체 롤백 확인
- 감사 정보: 모든 할당에 assignedBy, createdBy, updatedBy 정보 설정
- 할당 날짜: 모든 할당에 assignedDate 자동 설정
- 빈 배열 검증: 빈 할당 배열로 요청 시 400 에러
- 필수 필드 검증: 각 할당의 필수 필드 누락 시 400 에러
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 직원 존재 검증: 존재하지 않는 직원 ID 포함 시 404 에러
- WBS 항목 존재 검증: 존재하지 않는 WBS 항목 ID 포함 시 404 에러
- 프로젝트 존재 검증: 존재하지 않는 프로젝트 ID 포함 시 404 에러
- 평가기간 존재 검증: 존재하지 않는 평가기간 ID 포함 시 404 에러
- 완료된 평가기간 제한: 완료된 평가기간에 할당 생성 시 422 에러
- 중복 할당 방지: 기존 할당과 중복 시 409 에러 및 전체 롤백
- 성능 테스트: 10개 이상 할당을 30초 이내 처리
- 동시성 테스트: 여러 대량 할당 요청 동시 처리
- 최소 1개 검증: 할당 목록은 최소 1개 이상 필수`,
    }),
    ApiBody({
      description: 'WBS 대량 할당 데이터',
      schema: {
        type: 'object',
        properties: {
          assignments: {
            type: 'array',
            description: 'WBS 할당 목록 (최소 1개 이상)',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                employeeId: {
                  type: 'string',
                  format: 'uuid',
                  description: '직원 ID',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
                wbsItemId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'WBS 항목 ID',
                  example: '123e4567-e89b-12d3-a456-426614174001',
                },
                projectId: {
                  type: 'string',
                  format: 'uuid',
                  description: '프로젝트 ID',
                  example: '123e4567-e89b-12d3-a456-426614174002',
                },
                periodId: {
                  type: 'string',
                  format: 'uuid',
                  description: '평가기간 ID',
                  example: '123e4567-e89b-12d3-a456-426614174003',
                },
                assignedBy: {
                  type: 'string',
                  format: 'uuid',
                  description: '할당자 ID (선택사항)',
                  example: '123e4567-e89b-12d3-a456-426614174004',
                },
              },
              required: ['employeeId', 'wbsItemId', 'projectId', 'periodId'],
            },
          },
        },
        required: ['assignments'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'WBS 대량 할당이 성공적으로 완료되었습니다.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employeeId: { type: 'string', format: 'uuid' },
            wbsItemId: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            periodId: { type: 'string', format: 'uuid' },
            assignedBy: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (빈 배열, 필수 필드 누락, UUID 형식 오류 등)',
    }),
    ApiResponse({
      status: 404,
      description: '직원, WBS 항목, 프로젝트 또는 평가기간을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 409,
      description: '중복된 할당이 포함되어 있습니다.',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간에 할당 생성 불가 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
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

/**
 * WBS 할당 순서 변경 엔드포인트 데코레이터
 */
export const ChangeWbsAssignmentOrder = () =>
  applyDecorators(
    Patch(':id/order'),
    ApiOperation({
      summary: 'WBS 할당 순서 변경',
      description: `WBS 할당의 표시 순서를 위 또는 아래로 이동합니다. 같은 프로젝트-평가기간 내에서 인접한 항목과 순서를 자동으로 교환합니다.

**기능:**
- 위로 이동(up): 현재 항목과 바로 위 항목의 순서를 교환
- 아래로 이동(down): 현재 항목과 바로 아래 항목의 순서를 교환
- 자동 재정렬: 순서 교환 시 두 항목만 업데이트되어 효율적
- 경계 처리: 첫 번째 항목을 위로, 마지막 항목을 아래로 이동 시도시 현재 상태 유지

**테스트 케이스:**
- 위로 이동: 중간 항목을 위로 이동 시 순서 교환 확인
- 아래로 이동: 중간 항목을 아래로 이동 시 순서 교환 확인
- 첫 번째 항목 위로: 이미 첫 번째 항목을 위로 이동 시 순서 변화 없음
- 마지막 항목 아래로: 이미 마지막 항목을 아래로 이동 시 순서 변화 없음
- 단일 항목: 할당이 하나만 있을 때 순서 변경 시도
- 존재하지 않는 ID: 유효하지 않은 할당 ID로 요청 시 404 에러
- 잘못된 방향: 'up' 또는 'down' 이외의 값 전달 시 400 에러
- 완료된 평가기간: 완료된 평가기간의 할당 순서 변경 시 422 에러
- 다른 프로젝트 항목: 같은 프로젝트-평가기간의 항목들만 영향받음
- 순서 일관성: 이동 후 displayOrder 값의 일관성 유지
- 동시 순서 변경: 동일 할당에 대한 동시 순서 변경 요청 처리
- 트랜잭션 보장: 순서 변경 중 오류 시 롤백 처리`,
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 할당 ID (UUID 형식)',
      example: '550e8400-e29b-41d4-a716-446655440002',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiQuery({
      name: 'direction',
      description: '이동 방향',
      enum: ['up', 'down'],
      required: true,
      example: 'up',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          updatedBy: {
            type: 'string',
            format: 'uuid',
            description: '변경 수행자 ID (UUID 형식)',
            example: '123e4567-e89b-12d3-a456-426614174003',
          },
        },
      },
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 할당 순서가 성공적으로 변경되었습니다.',
    }),
    ApiResponse({
      status: 400,
      description:
        '잘못된 요청 데이터 (UUID 형식 오류, 잘못된 direction 값 등)',
    }),
    ApiResponse({
      status: 404,
      description: 'WBS 할당을 찾을 수 없습니다.',
    }),
    ApiResponse({
      status: 422,
      description: '비즈니스 로직 오류 (완료된 평가기간의 순서 변경 제한 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }),
  );
