import {
  applyDecorators,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateWbsSelfEvaluationBodyDto,
  EmployeeSelfEvaluationsResponseDto,
  ResetAllWbsSelfEvaluationsResponseDto,
  SubmitAllWbsSelfEvaluationsResponseDto,
  SubmitWbsSelfEvaluationDto,
  UpdateWbsSelfEvaluationDto,
  WbsSelfEvaluationBasicDto,
  WbsSelfEvaluationDetailResponseDto,
  WbsSelfEvaluationResponseDto,
  SubmitWbsSelfEvaluationsByProjectResponseDto,
  ResetWbsSelfEvaluationsByProjectResponseDto,
  ClearAllWbsSelfEvaluationsResponseDto,
  ClearWbsSelfEvaluationsByProjectResponseDto,
} from '../dto/wbs-self-evaluation.dto';

/**
 * WBS 자기평가 저장 API 데코레이터 (Upsert: 없으면 생성, 있으면 수정)
 */
export function UpsertWbsSelfEvaluation() {
  return applyDecorators(
    Post('employee/:employeeId/wbs/:wbsItemId/period/:periodId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'WBS 자기평가 저장',
      description:
        'WBS 자기평가를 저장합니다. 기존 평가가 있으면 수정하고, 없으면 새로 생성합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID',
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
    ApiBody({
      type: CreateWbsSelfEvaluationBodyDto,
      description: 'WBS 자기평가 생성 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'WBS 자기평가가 성공적으로 저장되었습니다.',
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
      description: '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다.',
    }),
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
  );
}

/**
 * WBS 자기평가 제출 API 데코레이터
 */
export function SubmitWbsSelfEvaluation() {
  return applyDecorators(
    Patch(':id/submit'),
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
  );
}

/**
 * 직원의 전체 WBS 자기평가 제출 API 데코레이터
 */
export function SubmitAllWbsSelfEvaluationsByEmployeePeriod() {
  return applyDecorators(
    Patch('employee/:employeeId/period/:periodId/submit-all'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '직원의 전체 WBS 자기평가 제출',
      description:
        '특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 한 번에 제출하고 완료 상태로 변경합니다.',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '직원의 전체 WBS 자기평가가 성공적으로 제출되었습니다. 제출된 평가 개수와 실패한 평가 정보를 반환합니다.',
      type: SubmitAllWbsSelfEvaluationsResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터이거나 제출할 자기평가가 존재하지 않습니다.',
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
      description: '직원 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
}

/**
 * WBS 자기평가 미제출 상태로 변경 API 데코레이터 (단일)
 */
export function ResetWbsSelfEvaluation() {
  return applyDecorators(
    Patch(':id/reset'),
    HttpCode(HttpStatus.OK),
    ApiParam({
      name: 'id',
      description: '미제출 상태로 변경할 WBS 자기평가 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOperation({
      summary: 'WBS 자기평가 미제출 상태로 변경',
      description: `**중요**: 특정 WBS 자기평가를 미제출 상태로 변경합니다.

**테스트 케이스:**
- 기본 변경: 완료된 평가를 미완료 상태로 변경할 수 있어야 함
- 이미 미완료 상태: 이미 미완료 상태인 평가는 에러 반환
- 존재하지 않는 평가: 존재하지 않는 평가 ID로 요청 시 400 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'WBS 자기평가가 성공적으로 미제출 상태로 변경되었습니다. 변경된 평가 정보를 반환합니다.',
      type: WbsSelfEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터이거나 이미 미완료 상태인 자기평가입니다.',
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
  );
}

/**
 * 직원의 전체 WBS 자기평가 미제출 상태로 변경 API 데코레이터
 */
export function ResetAllWbsSelfEvaluationsByEmployeePeriod() {
  return applyDecorators(
    Patch('employee/:employeeId/period/:periodId/reset'),
    HttpCode(HttpStatus.OK),
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
    ApiOperation({
      summary: '직원의 전체 WBS 자기평가 미제출 상태로 변경',
      description: `**중요**: 특정 직원의 특정 평가기간에 대한 모든 완료된 WBS 자기평가를 미제출 상태로 변경합니다.

**테스트 케이스:**
- 기본 변경: 완료된 모든 평가를 미완료 상태로 변경할 수 있어야 함
- 일부 미완료 상태: 이미 미완료 상태인 평가는 스킵하고 완료된 평가만 변경
- 변경 실패: 일부 평가 변경 실패 시 상세 실패 정보 반환
- 모두 미완료 상태: 모든 평가가 이미 미완료 상태인 경우 빈 결과 반환
- 빈 결과: 평가가 없는 경우 400 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '직원의 전체 WBS 자기평가가 성공적으로 미제출 상태로 변경되었습니다. 변경된 평가 개수와 실패한 평가 정보를 반환합니다.',
      type: ResetAllWbsSelfEvaluationsResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터이거나 미제출 상태로 변경할 자기평가가 존재하지 않습니다.',
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
      description: '직원 또는 평가기간을 찾을 수 없습니다.',
    }),
  );
}

/**
 * 프로젝트별 WBS 자기평가 제출 API 데코레이터
 */
export function SubmitWbsSelfEvaluationsByProject() {
  return applyDecorators(
    Patch('employee/:employeeId/period/:periodId/project/:projectId/submit'),
    HttpCode(HttpStatus.OK),
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
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOperation({
      summary: '프로젝트별 WBS 자기평가 제출',
      description: `**중요**: 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 제출합니다.

**테스트 케이스:**
- 기본 제출: 프로젝트의 모든 평가를 완료 상태로 변경할 수 있어야 함
- 일부 성공: 일부 평가는 성공하고 일부는 실패할 수 있음
- 이미 완료된 평가: 이미 완료된 평가는 스킵하고 결과에 포함
- 검증 실패: 내용이나 점수가 없는 평가는 실패 정보 반환
- 빈 결과: 프로젝트에 평가가 없는 경우 400 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '프로젝트의 WBS 자기평가가 성공적으로 제출되었습니다. 제출된 평가 개수와 실패한 평가 정보를 반환합니다.',
      type: SubmitWbsSelfEvaluationsByProjectResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터이거나 제출할 자기평가가 존재하지 않습니다.',
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
      description: '직원, 평가기간 또는 프로젝트를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 프로젝트별 WBS 자기평가 미제출 상태로 변경 API 데코레이터
 */
export function ResetWbsSelfEvaluationsByProject() {
  return applyDecorators(
    Patch('employee/:employeeId/period/:periodId/project/:projectId/reset'),
    HttpCode(HttpStatus.OK),
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
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOperation({
      summary: '프로젝트별 WBS 자기평가 미제출 상태로 변경',
      description: `**중요**: 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 완료된 WBS 자기평가를 미제출 상태로 변경합니다.

**테스트 케이스:**
- 기본 변경: 프로젝트의 완료된 모든 평가를 미완료 상태로 변경할 수 있어야 함
- 일부 미완료 상태: 이미 미완료 상태인 평가는 스킵하고 완료된 평가만 변경
- 변경 실패: 일부 평가 변경 실패 시 상세 실패 정보 반환
- 모두 미완료 상태: 모든 평가가 이미 미완료 상태인 경우 빈 결과 반환
- 빈 결과: 프로젝트에 평가가 없는 경우 400 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '프로젝트의 WBS 자기평가가 성공적으로 미제출 상태로 변경되었습니다. 변경된 평가 개수와 실패한 평가 정보를 반환합니다.',
      type: ResetWbsSelfEvaluationsByProjectResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터이거나 미제출 상태로 변경할 자기평가가 존재하지 않습니다.',
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
      description: '직원, 평가기간 또는 프로젝트를 찾을 수 없습니다.',
    }),
  );
}

/**
 * WBS 자기평가 내용 초기화 API 데코레이터 (단일)
 */
export function ClearWbsSelfEvaluation() {
  return applyDecorators(
    Patch(':id/clear'),
    HttpCode(HttpStatus.OK),
    ApiParam({
      name: 'id',
      description: '자기평가 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOperation({
      summary: 'WBS 자기평가 내용 초기화',
      description:
        '특정 WBS 자기평가의 내용(selfEvaluationContent, selfEvaluationScore, performanceResult)을 초기화합니다.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'WBS 자기평가 내용이 성공적으로 초기화되었습니다.',
      type: WbsSelfEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '자기평가를 찾을 수 없습니다.',
    }),
  );
}

/**
 * 직원의 전체 WBS 자기평가 내용 초기화 API 데코레이터
 */
export function ClearAllWbsSelfEvaluationsByEmployeePeriod() {
  return applyDecorators(
    Patch('employee/:employeeId/period/:periodId/clear'),
    HttpCode(HttpStatus.OK),
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
    ApiOperation({
      summary: '직원의 전체 WBS 자기평가 내용 초기화',
      description:
        '특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가 내용을 초기화합니다.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '성공적으로 초기화되었습니다.',
      type: ClearAllWbsSelfEvaluationsResponseDto,
    }),
  );
}

/**
 * 프로젝트별 WBS 자기평가 내용 초기화 API 데코레이터
 */
export function ClearWbsSelfEvaluationsByProject() {
  return applyDecorators(
    Patch('employee/:employeeId/period/:periodId/project/:projectId/clear'),
    HttpCode(HttpStatus.OK),
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
    ApiParam({
      name: 'projectId',
      description: '프로젝트 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOperation({
      summary: '프로젝트별 WBS 자기평가 내용 초기화',
      description:
        '특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가 내용을 초기화합니다.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '성공적으로 초기화되었습니다.',
      type: ClearWbsSelfEvaluationsByProjectResponseDto,
    }),
  );
}
