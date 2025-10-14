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
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 할당 취소',
      description: `**중요**: 기존 WBS 할당을 취소(소프트 삭제)합니다. 할당 취소 시 평가기준 정리 및 멱등성 보장을 수행합니다.

**자동 수행 작업:**
- 소프트 삭제: 실제 레코드 삭제가 아닌 deletedAt 필드를 업데이트
- 평가기준 정리: 해당 WBS 항목의 마지막 할당인 경우 관련 평가기준도 자동 삭제
- 평가라인 매핑 정리: 할당과 연결된 평가라인 매핑 자동 삭제
- 멱등성 보장: 이미 취소되었거나 존재하지 않는 할당 ID로 요청해도 200 OK 반환

**테스트 케이스:**
- 기본 할당 취소: 유효한 할당 ID로 취소 시 성공
- 소프트 삭제 확인: deletedAt 필드가 설정되고 물리적 삭제는 되지 않음
- 마지막 할당 취소: 해당 WBS의 마지막 할당 취소 시 평가기준도 자동 삭제
- 평가기준 유지: 다른 할당이 남아있으면 평가기준은 유지됨
- 여러 할당 순차 취소: 동일 직원의 여러 할당을 순차적으로 취소 가능
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 멱등성 - 존재하지 않는 ID: 유효한 UUID이지만 존재하지 않는 할당 ID로 취소 시도 시 200 성공 반환
- 멱등성 - 이미 취소된 할당: 이미 취소된 할당을 다시 취소 시도 시 200 성공 반환
- 할당 목록 제외: 취소된 할당은 목록 조회에서 제외됨
- 상세 조회 불가: 취소된 할당은 상세 조회 시 404 반환
- 대량 할당 후 전체 취소: 모든 할당을 취소하면 평가기준도 모두 삭제됨
- 트랜잭션 보장: 할당 취소와 평가기준 정리가 원자적으로 수행됨`,
    }),
    ApiParam({
      name: 'id',
      description: 'WBS 할당 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 할당이 성공적으로 취소되었습니다.',
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (UUID 형식 오류)',
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
      description: `**중요**: 필터 조건에 따라 WBS 할당 목록을 조회합니다. 페이징, 정렬, 다중 필터 조건을 지원하며 취소된 할당은 자동으로 제외됩니다.

**기능:**
- 필터링: 평가기간, 직원, 프로젝트, WBS 항목 등 다양한 조건으로 필터링
- 페이징: page, limit 파라미터로 페이징 지원
- 정렬: orderBy, orderDirection으로 정렬 기준 및 방향 설정
- 연관 데이터: 직원명, 프로젝트명, WBS 항목명 등 연관 정보 자동 포함
- 취소 제외: 취소(소프트 삭제)된 할당은 자동으로 제외

**테스트 케이스:**
- 기본 목록 조회: 필터 없이 전체 WBS 할당 목록 조회
- 빈 목록 조회: 할당이 없을 때 빈 배열 반환
- 평가기간 필터링: 특정 평가기간의 할당만 조회
- 직원 필터링: 특정 직원에게 할당된 WBS만 조회
- 프로젝트 필터링: 특정 프로젝트의 WBS 할당만 조회
- WBS 항목 필터링: 특정 WBS 항목에 대한 할당만 조회
- 복합 필터링: 여러 필터 조건을 동시에 적용하여 조회
- 페이지 크기 지정: limit 파라미터로 한 페이지에 표시할 항목 수 지정
- 특정 페이지 조회: page 파라미터로 원하는 페이지 조회
- 할당일 오름차순: assignedDate 기준 오름차순 정렬
- 할당일 내림차순: assignedDate 기준 내림차순 정렬
- 잘못된 UUID - periodId: 잘못된 UUID 형식의 periodId 전달 시 400 에러
- 잘못된 UUID - employeeId: 잘못된 UUID 형식의 employeeId 전달 시 400 에러
- 잘못된 page 값: 음수나 0 등 잘못된 page 값 전달 시 적절한 처리
- 잘못된 orderDirection: ASC, DESC 이외의 값 전달 시 400 에러
- 필터링, 페이징, 정렬 동시 적용: 모든 기능을 동시에 사용하여 조회
- 취소된 할당 제외: 취소된 할당은 목록에서 자동 제외
- 대용량 데이터: 1000개 이상의 할당 목록 조회 성능 검증
- 동시 조회: 동일한 조건으로 동시에 여러 조회 요청 처리
- 연관 데이터 포함: 직원명, 프로젝트명, WBS 코드 등 조인 데이터 포함`,
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      required: false,
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiQuery({
      name: 'employeeId',
      description: '직원 ID (UUID 형식)',
      required: false,
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiQuery({
      name: 'wbsItemId',
      description: 'WBS 항목 ID (UUID 형식)',
      required: false,
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiQuery({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식)',
      required: false,
      type: 'string',
      format: 'uuid',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    ApiQuery({
      name: 'page',
      description: '페이지 번호 (1부터 시작)',
      required: false,
      type: 'number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: '페이지당 항목 수 (기본값: 10)',
      required: false,
      type: 'number',
      example: 10,
    }),
    ApiQuery({
      name: 'orderBy',
      description: '정렬 기준 필드 (기본값: assignedDate)',
      required: false,
      type: 'string',
      example: 'assignedDate',
    }),
    ApiQuery({
      name: 'orderDirection',
      description: '정렬 방향 (ASC: 오름차순, DESC: 내림차순)',
      required: false,
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 할당 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          assignments: {
            type: 'array',
            description: 'WBS 할당 목록',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: '550e8400-e29b-41d4-a716-446655440000',
                },
                periodId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                },
                employeeId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                },
                projectId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                },
                wbsItemId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                },
                assignedDate: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                assignedBy: {
                  type: 'string',
                  format: 'uuid',
                  example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                },
                employeeName: {
                  type: 'string',
                  example: '홍길동',
                },
                projectName: {
                  type: 'string',
                  example: '루미르 통합 포털 프로젝트',
                },
                wbsCode: {
                  type: 'string',
                  example: 'WBS-001',
                },
                wbsName: {
                  type: 'string',
                  example: '백엔드 API 개발',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
              },
            },
          },
          totalCount: {
            type: 'number',
            description: '전체 항목 수',
            example: 25,
          },
          page: {
            type: 'number',
            description: '현재 페이지 번호',
            example: 1,
          },
          limit: {
            type: 'number',
            description: '페이지당 항목 수',
            example: 10,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (UUID 형식 오류, 잘못된 정렬 방향 등)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
    }),
  );

/**
 * WBS 할당 상세 조회 API 데코레이터
 */
export const GetWbsAssignmentDetail = () =>
  applyDecorators(
    Get('detail'),
    ApiOperation({
      summary: 'WBS 할당 상세 조회',
      description: `특정 WBS 할당의 상세 정보를 조회합니다. 직원, 프로젝트, WBS 항목, 평가기간을 기준으로 조회합니다.

**기능:**
- WBS 할당 상세 정보 조회
- 관련 정보 포함: 직원, 부서, 프로젝트, WBS 항목, 평가기간, 할당자 정보
- 취소되지 않은 할당만 조회

**반환 정보:**
- 할당 기본 정보: id, periodId, employeeId, projectId, wbsItemId, assignedDate 등
- 직원 정보: name, employeeNumber, email, departmentId, status
- 부서 정보: name, code
- 프로젝트 정보: name, code, status, startDate, endDate
- WBS 항목 정보: wbsCode, title, status, level, startDate, endDate, progressPercentage
- 평가기간 정보: name, startDate, endDate, status
- 할당자 정보: name, employeeNumber`,
    }),
    ApiQuery({
      name: 'employeeId',
      description: '직원 ID (UUID 형식, 필수)',
      required: true,
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiQuery({
      name: 'wbsItemId',
      description: 'WBS 항목 ID (UUID 형식, 필수)',
      required: true,
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiQuery({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식, 필수)',
      required: true,
      type: 'string',
      format: 'uuid',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식, 필수)',
      required: true,
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiResponse({
      status: 200,
      description:
        'WBS 할당 상세 정보가 성공적으로 조회되었습니다. (관련 정보 모두 포함)',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'WBS 할당 ID',
            example: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
          },
          periodId: {
            type: 'string',
            format: 'uuid',
            description: '평가기간 ID',
            example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
          },
          employeeId: {
            type: 'string',
            format: 'uuid',
            description: '직원 ID',
            example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          },
          projectId: {
            type: 'string',
            format: 'uuid',
            description: '프로젝트 ID',
            example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
          },
          wbsItemId: {
            type: 'string',
            format: 'uuid',
            description: 'WBS 항목 ID',
            example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          },
          assignedDate: {
            type: 'string',
            format: 'date-time',
            description: '할당 날짜',
            example: '2024-10-01T09:00:00.000Z',
          },
          assignedBy: {
            type: 'string',
            format: 'uuid',
            description: '할당자 ID',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
          displayOrder: {
            type: 'number',
            nullable: true,
            description: '표시 순서',
            example: 1,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '생성일시',
            example: '2024-10-01T09:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '수정일시',
            example: '2024-10-01T09:00:00.000Z',
          },
          createdBy: {
            type: 'string',
            format: 'uuid',
            description: '생성자 ID',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
          updatedBy: {
            type: 'string',
            format: 'uuid',
            description: '수정자 ID',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          },
          employee: {
            type: 'object',
            nullable: true,
            description: '직원 정보',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: '홍길동' },
              employeeNumber: { type: 'string', example: 'EMP-001' },
              email: { type: 'string', example: 'hong@example.com' },
              departmentId: { type: 'string', example: 'dept-001' },
              status: { type: 'string', example: 'ACTIVE' },
            },
          },
          department: {
            type: 'object',
            nullable: true,
            description: '부서 정보',
            properties: {
              id: { type: 'string', example: 'dept-001' },
              name: { type: 'string', example: '개발팀' },
              code: { type: 'string', example: 'DEV' },
            },
          },
          project: {
            type: 'object',
            nullable: true,
            description: '프로젝트 정보',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: '루미르 통합 포털 프로젝트' },
              code: { type: 'string', example: 'LUMIR-001' },
              status: { type: 'string', example: 'IN_PROGRESS' },
              startDate: {
                type: 'string',
                format: 'date',
                example: '2024-01-01',
              },
              endDate: {
                type: 'string',
                format: 'date',
                example: '2024-12-31',
              },
            },
          },
          wbsItem: {
            type: 'object',
            nullable: true,
            description: 'WBS 항목 정보',
            properties: {
              id: { type: 'string', format: 'uuid' },
              wbsCode: { type: 'string', example: '1.1' },
              title: { type: 'string', example: '요구사항 분석' },
              status: { type: 'string', example: 'IN_PROGRESS' },
              level: { type: 'number', example: 1 },
              startDate: {
                type: 'string',
                format: 'date',
                example: '2024-01-01',
              },
              endDate: {
                type: 'string',
                format: 'date',
                example: '2024-01-31',
              },
              progressPercentage: { type: 'string', example: '35.50' },
            },
          },
          period: {
            type: 'object',
            nullable: true,
            description: '평가기간 정보',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: '2024년 상반기 평가' },
              startDate: {
                type: 'string',
                format: 'date',
                example: '2024-01-01',
              },
              endDate: {
                type: 'string',
                format: 'date',
                example: '2024-06-30',
              },
              status: { type: 'string', example: 'IN_PROGRESS' },
            },
          },
          assignedByEmployee: {
            type: 'object',
            nullable: true,
            description: '할당자 정보',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: '관리자' },
              employeeNumber: { type: 'string', example: 'ADMIN-001' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (필수 파라미터 누락 또는 UUID 형식 오류)',
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
      description: `**중요**: 특정 평가기간에 특정 직원에게 할당된 모든 WBS 항목을 조회합니다. 취소된 할당은 자동으로 제외됩니다.

**기능:**
- 직원별 WBS 조회: 특정 직원의 WBS 할당 전체 목록 조회
- 평가기간 필터: 특정 평가기간의 할당만 조회
- 취소 제외: 취소(소프트 삭제)된 할당은 자동으로 제외
- 연관 데이터: 프로젝트명, WBS 항목명 등 연관 정보 자동 포함
- 빈 결과 처리: 할당이 없으면 빈 배열 반환

**테스트 케이스:**
- 기본 조회: 특정 직원의 특정 평가기간 WBS 할당 조회
- 빈 결과: WBS 할당이 없는 경우 빈 배열 반환
- 다중 WBS 할당: 여러 WBS가 할당된 경우 모두 조회
- 취소된 할당 제외: 취소된 WBS 할당은 조회 결과에서 제외
- 다른 직원 격리: 다른 직원의 WBS 할당은 조회되지 않음
- 다른 평가기간 격리: 다른 평가기간의 WBS 할당은 조회되지 않음
- 잘못된 UUID - employeeId: 잘못된 UUID 형식의 employeeId 전달 시 400 에러
- 잘못된 UUID - periodId: 잘못된 UUID 형식의 periodId 전달 시 400 에러
- 존재하지 않는 직원: 존재하지 않는 직원 ID로 요청 시 빈 배열 반환
- 존재하지 않는 평가기간: 존재하지 않는 평가기간 ID로 요청 시 빈 배열 반환
- 연관 데이터 포함: 조회 결과에 프로젝트, WBS 항목 등 필수 연관 데이터 포함
- 복합 할당: 한 프로젝트 내 여러 WBS 할당을 한 번에 조회`,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiResponse({
      status: 200,
      description: '직원 WBS 할당 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          wbsAssignments: {
            type: 'array',
            description: 'WBS 할당 목록',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
                },
                employeeId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                },
                wbsItemId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                },
                projectId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                },
                periodId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                },
                assignedDate: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                assignedBy: {
                  type: 'string',
                  format: 'uuid',
                  example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (UUID 형식 오류)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
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
      description: `**중요**: 특정 평가기간에 특정 프로젝트의 모든 WBS 할당을 조회합니다. 취소된 할당은 자동으로 제외됩니다.

**기능:**
- 프로젝트별 WBS 조회: 특정 프로젝트의 모든 WBS 할당 조회
- 평가기간 필터: 특정 평가기간의 할당만 조회
- 취소 제외: 취소(소프트 삭제)된 할당은 자동으로 제외
- 연관 데이터: 직원명, WBS 항목명 등 연관 정보 자동 포함
- 빈 결과 처리: 할당이 없으면 빈 배열 반환

**테스트 케이스:**
- 기본 조회: 특정 프로젝트의 특정 평가기간 WBS 할당 조회
- 빈 결과: WBS 할당이 없는 경우 빈 배열 반환
- 다중 WBS 할당: 여러 직원에게 여러 WBS가 할당된 경우 모두 조회
- 취소된 할당 제외: 취소된 WBS 할당은 조회 결과에서 제외
- 다른 프로젝트 격리: 다른 프로젝트의 WBS 할당은 조회되지 않음
- 다른 평가기간 격리: 다른 평가기간의 WBS 할당은 조회되지 않음
- 잘못된 UUID - projectId: 잘못된 UUID 형식의 projectId 전달 시 400 에러
- 잘못된 UUID - periodId: 잘못된 UUID 형식의 periodId 전달 시 400 에러
- 존재하지 않는 프로젝트: 존재하지 않는 프로젝트 ID로 요청 시 빈 배열 반환
- 존재하지 않는 평가기간: 존재하지 않는 평가기간 ID로 요청 시 빈 배열 반환
- 연관 데이터 포함: 조회 결과에 직원명, WBS 항목명 등 필수 연관 데이터 포함`,
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiResponse({
      status: 200,
      description: '프로젝트 WBS 할당 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          wbsAssignments: {
            type: 'array',
            description: 'WBS 할당 목록',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
                },
                employeeId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                },
                employeeName: {
                  type: 'string',
                  example: '홍길동',
                },
                wbsItemId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                },
                wbsCode: {
                  type: 'string',
                  example: 'WBS-001',
                },
                wbsName: {
                  type: 'string',
                  example: '백엔드 API 개발',
                },
                projectId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                },
                periodId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                },
                assignedDate: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                assignedBy: {
                  type: 'string',
                  format: 'uuid',
                  example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (UUID 형식 오류)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
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
      description: `**중요**: 특정 평가기간에 특정 WBS 항목에 할당된 모든 직원을 조회합니다. 취소된 할당은 자동으로 제외됩니다.

**기능:**
- WBS 항목별 직원 조회: 특정 WBS에 할당된 모든 직원 조회
- 평가기간 필터: 특정 평가기간의 할당만 조회
- 취소 제외: 취소(소프트 삭제)된 할당은 자동으로 제외
- 연관 데이터: 직원명, 부서명, 프로젝트명 등 연관 정보 자동 포함
- 빈 결과 처리: 할당이 없으면 빈 배열 반환

**사용 시나리오:**
- WBS 작업 담당자 확인: 특정 WBS 항목을 누가 수행하는지 확인
- 평가자 배정: 해당 WBS에 평가자를 배정하기 위한 직원 목록 조회
- 작업 분배 검토: WBS 항목별 작업 분배 현황 확인

**테스트 케이스:**
- 기본 조회: 특정 WBS 항목의 특정 평가기간 직원 할당 조회
- 빈 결과: 직원 할당이 없는 경우 빈 배열 반환
- 다중 직원 할당: 여러 직원이 할당된 경우 모두 조회
- 취소된 할당 제외: 취소된 할당은 조회 결과에서 제외
- 다른 WBS 항목 격리: 다른 WBS 항목의 할당은 조회되지 않음
- 다른 평가기간 격리: 다른 평가기간의 할당은 조회되지 않음
- 잘못된 UUID - wbsItemId: 잘못된 UUID 형식의 wbsItemId 전달 시 400 에러
- 잘못된 UUID - periodId: 잘못된 UUID 형식의 periodId 전달 시 400 에러
- 존재하지 않는 WBS 항목: 존재하지 않는 WBS 항목 ID로 요청 시 빈 배열 반환
- 존재하지 않는 평가기간: 존재하지 않는 평가기간 ID로 요청 시 빈 배열 반환
- 연관 데이터 포함: 조회 결과에 직원명, 부서명, 프로젝트명 등 필수 연관 데이터 포함`,
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiResponse({
      status: 200,
      description: 'WBS 항목 할당된 직원 목록이 성공적으로 조회되었습니다.',
      schema: {
        type: 'object',
        properties: {
          wbsAssignments: {
            type: 'array',
            description: '할당된 직원 목록',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
                },
                employeeId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                },
                employeeName: {
                  type: 'string',
                  example: '홍길동',
                },
                departmentName: {
                  type: 'string',
                  example: '개발팀',
                },
                wbsItemId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                },
                projectId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                },
                projectName: {
                  type: 'string',
                  example: '루미르 통합 포털 프로젝트',
                },
                periodId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                },
                assignedDate: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                assignedBy: {
                  type: 'string',
                  format: 'uuid',
                  example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T09:00:00.000Z',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (UUID 형식 오류)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
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
      description: `특정 평가기간에 프로젝트에서 아직 할당되지 않은 WBS 항목들을 조회합니다. 선택적으로 특정 직원에게 할당되지 않은 WBS 항목만 조회할 수 있습니다.

**기능:**
- 미할당 WBS 조회: 특정 프로젝트에서 할당되지 않은 WBS 항목 조회
- 직원별 미할당 조회: 특정 직원에게 할당되지 않은 WBS 항목 조회 (employeeId 제공 시)
- 평가기간 필터: 특정 평가기간의 할당 상태만 고려
- 취소된 할당 반영: 취소된 할당은 미할당으로 간주
- WBS 항목 전체 정보 반환: ID뿐만 아니라 WBS 항목의 모든 상세 정보 포함

**테스트 케이스:**
- 전체 미할당 조회: employeeId 없이 프로젝트의 모든 미할당 WBS 조회
- 직원별 미할당 조회: 특정 직원에게 할당되지 않은 WBS만 조회
- 모두 할당된 경우: 모든 WBS가 할당된 경우 빈 배열 반환
- 일부 할당된 경우: 일부만 할당된 경우 미할당 WBS만 반환
- 취소된 할당 반영: 취소된 할당은 미할당으로 간주하여 조회됨
- 다른 직원 할당 제외: 다른 직원에게 할당된 WBS는 미할당으로 간주
- 다른 평가기간 무시: 다른 평가기간의 할당은 고려하지 않음
- 필수 파라미터 검증: projectId, periodId 누락 시 400 에러
- 잘못된 UUID 검증: 잘못된 UUID 형식 시 400 에러
- 존재하지 않는 프로젝트: 존재하지 않는 프로젝트 ID로 요청 시 400 에러
- 존재하지 않는 평가기간: 존재하지 않는 평가기간 ID로 요청 시 400 에러
- 존재하지 않는 직원: 존재하지 않는 직원 ID로 요청 시 400 에러`,
    }),
    ApiQuery({
      name: 'projectId',
      description: '프로젝트 ID (UUID 형식, 필수)',
      required: true,
      type: 'string',
      format: 'uuid',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    ApiQuery({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식, 필수)',
      required: true,
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    ApiQuery({
      name: 'employeeId',
      description:
        '직원 ID (UUID 형식, 선택사항) - 제공 시 해당 직원에게 할당되지 않은 WBS만 조회',
      required: false,
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    ApiResponse({
      status: 200,
      description:
        '할당되지 않은 WBS 항목 목록이 성공적으로 조회되었습니다. (전체 정보 포함)',
      schema: {
        type: 'object',
        properties: {
          wbsItems: {
            type: 'array',
            description: '할당되지 않은 WBS 항목 목록 (전체 정보)',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'WBS 항목 ID',
                  example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                },
                wbsCode: {
                  type: 'string',
                  description: 'WBS 코드',
                  example: '1.1',
                },
                title: {
                  type: 'string',
                  description: 'WBS 제목',
                  example: '요구사항 분석',
                },
                status: {
                  type: 'string',
                  description: 'WBS 상태',
                  enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
                  example: 'IN_PROGRESS',
                },
                projectId: {
                  type: 'string',
                  format: 'uuid',
                  description: '프로젝트 ID',
                  example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                },
                parentWbsId: {
                  type: 'string',
                  format: 'uuid',
                  description: '상위 WBS ID (최상위인 경우 null)',
                  example: null,
                  nullable: true,
                },
                level: {
                  type: 'number',
                  description: 'WBS 레벨 (1: 최상위)',
                  example: 1,
                },
                startDate: {
                  type: 'string',
                  format: 'date',
                  description: 'WBS 시작일',
                  example: '2024-01-01',
                },
                endDate: {
                  type: 'string',
                  format: 'date',
                  description: 'WBS 종료일',
                  example: '2024-01-31',
                },
                progressPercentage: {
                  type: 'string',
                  description: '진행률 (%)',
                  example: '35.50',
                },
              },
            },
            example: [
              {
                id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                wbsCode: '1.1',
                title: '요구사항 분석',
                status: 'IN_PROGRESS',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                parentWbsId: null,
                level: 1,
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                progressPercentage: '35.50',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 데이터 (필수 파라미터 누락, UUID 형식 오류)',
    }),
    ApiResponse({
      status: 500,
      description: '서버 내부 오류',
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
      description: `**중요**: 특정 평가기간의 모든 WBS 할당을 일괄 초기화합니다. 초기화 시 관련 평가기준도 함께 삭제되며, 모든 프로젝트의 할당이 삭제됩니다.

**자동 수행 작업:**
- WBS 할당 전체 삭제: 해당 평가기간의 모든 프로젝트, 모든 직원의 WBS 할당 삭제
- 평가기준 정리: 삭제된 할당과 연관된 WBS 평가기준 자동 삭제
- 평가라인 정리: 삭제된 할당과 연관된 평가라인 자동 삭제
- 멱등성 보장: 이미 초기화된 평가기간을 다시 초기화해도 오류 없이 성공 처리

**범위:**
- 동일 평가기간 내 모든 프로젝트의 할당 삭제
- 동일 평가기간 내 모든 직원의 할당 삭제
- 다른 평가기간의 할당은 영향받지 않음

**테스트 케이스:**
- 전체 초기화: 평가기간의 모든 WBS 할당이 삭제됨
- 여러 프로젝트 초기화: 동일 평가기간 내 여러 프로젝트의 할당이 모두 초기화됨
- 다른 평가기간 격리: 다른 평가기간의 할당은 영향받지 않음
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 멱등성 보장: 존재하지 않는 평가기간으로 초기화 시도 시 성공 처리 (200)
- 재초기화 가능: 이미 초기화된 평가기간을 다시 초기화해도 성공 처리 (200)
- 평가기준 정리: 초기화 후 관련 평가기준도 함께 삭제됨
- 목록 조회 반영: 초기화 후 목록 조회 시 결과가 비어있음
- 감사 정보: 초기화 일시, 초기화자 정보 자동 기록`,
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
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
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
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
      status: 400,
      description:
        '잘못된 요청입니다. UUID 형식이 올바르지 않거나 필수 필드가 누락되었습니다.',
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
      description: `**중요**: 특정 평가기간의 특정 프로젝트에 속한 모든 WBS 할당을 초기화합니다. 프로젝트 단위로 할당을 일괄 삭제하며, 관련 평가기준도 함께 삭제됩니다.

**자동 수행 작업:**
- 프로젝트별 WBS 할당 삭제: 해당 프로젝트-평가기간 조합의 모든 직원 WBS 할당 삭제
- 평가기준 정리: 삭제된 할당과 연관된 WBS 평가기준 자동 삭제
- 평가라인 정리: 삭제된 할당과 연관된 평가라인 자동 삭제
- 멱등성 보장: 이미 초기화된 프로젝트를 다시 초기화해도 오류 없이 성공 처리

**범위:**
- 지정된 프로젝트-평가기간의 모든 할당만 삭제
- 다른 프로젝트의 할당은 영향받지 않음
- 다른 평가기간의 동일 프로젝트 할당은 영향받지 않음

**사용 시나리오:**
- 특정 프로젝트의 평가 설정을 전체 재구성할 때
- 프로젝트 구성원이 크게 변경되어 할당을 새로 설정할 때
- 잘못된 할당 설정을 일괄 초기화하고 다시 시작할 때

**테스트 케이스:**
- 프로젝트별 초기화: 특정 프로젝트의 모든 WBS 할당이 삭제됨
- 다른 프로젝트 격리: 다른 프로젝트의 할당은 영향받지 않음
- 다른 평가기간 격리: 다른 평가기간의 동일 프로젝트 할당은 영향받지 않음
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 부분 초기화: 전체가 아닌 특정 프로젝트만 선택적으로 초기화 가능
- 데이터 유지: 다른 범위의 데이터는 정상적으로 유지됨
- 감사 정보: 초기화 일시, 초기화자 정보 자동 기록`,
    }),
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
      example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
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
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
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
      status: 400,
      description:
        '잘못된 요청입니다. UUID 형식이 올바르지 않거나 필수 필드가 누락되었습니다.',
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
      description: `**중요**: 특정 평가기간의 특정 직원에게 할당된 모든 WBS 항목을 초기화합니다. 직원 단위로 할당을 일괄 삭제하며, 관련 평가기준도 함께 삭제됩니다.

**자동 수행 작업:**
- 직원별 WBS 할당 삭제: 해당 직원-평가기간 조합의 모든 WBS 할당 삭제 (모든 프로젝트 포함)
- 평가기준 정리: 삭제된 할당과 연관된 WBS 평가기준 자동 삭제
- 평가라인 정리: 삭제된 할당과 연관된 평가라인 자동 삭제
- 멱등성 보장: 이미 초기화된 직원을 다시 초기화해도 오류 없이 성공 처리

**범위:**
- 지정된 직원-평가기간의 모든 할당만 삭제 (모든 프로젝트의 WBS 포함)
- 다른 직원의 할당은 영향받지 않음
- 다른 평가기간의 동일 직원 할당은 영향받지 않음

**사용 시나리오:**
- 특정 직원의 평가 설정을 전체 재구성할 때
- 직원이 담당 프로젝트를 변경하여 할당을 새로 설정할 때
- 직원이 퇴사하거나 휴직하여 할당을 일괄 제거할 때
- 잘못된 할당 설정을 초기화하고 다시 시작할 때

**테스트 케이스:**
- 직원별 초기화: 특정 직원의 모든 WBS 할당이 삭제됨 (모든 프로젝트)
- 다른 직원 격리: 다른 직원의 할당은 영향받지 않음
- 다른 평가기간 격리: 다른 평가기간의 동일 직원 할당은 영향받지 않음
- UUID 형식 검증: 잘못된 UUID 형식 시 400 에러
- 부분 초기화: 전체가 아닌 특정 직원만 선택적으로 초기화 가능
- 데이터 유지: 다른 범위의 데이터는 정상적으로 유지됨
- 감사 정보: 초기화 일시, 초기화자 정보 자동 기록`,
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
    ApiBody({
      description: '초기화 데이터',
      schema: {
        type: 'object',
        properties: {
          resetBy: {
            type: 'string',
            format: 'uuid',
            description: '초기화자 ID',
            example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
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
      status: 400,
      description:
        '잘못된 요청입니다. UUID 형식이 올바르지 않거나 필수 필드가 누락되었습니다.',
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
