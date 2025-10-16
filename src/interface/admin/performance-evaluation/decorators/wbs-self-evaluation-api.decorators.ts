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
      description: `**중요**: WBS 자기평가를 저장합니다. 동일한 직원-WBS항목-평가기간 조합으로 기존 평가가 있으면 수정하고, 없으면 새로 생성합니다. Upsert 방식으로 동작하여 중복 생성을 방지하며, 낙관적 잠금(버전 관리)을 통해 동시성을 제어합니다.

**주요 기능:**
- **Upsert 방식**: 동일 조합(직원+WBS항목+평가기간)으로 평가가 존재하면 업데이트, 없으면 신규 생성
- **버전 관리**: 매 수정마다 version 필드 자동 증가로 낙관적 잠금 적용
- **타임스탬프 관리**: createdAt은 최초 생성 시에만 기록되고 이후 변경되지 않음, updatedAt은 매 수정 시 갱신
- **점수 범위**: selfEvaluationScore는 0 ~ 평가기간의 maxSelfEvaluationRate 사이의 값 (달성률 %)
- **선택적 필드**: 모든 필드가 선택사항 (selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy)

**요청 본문 필드:**
- \`selfEvaluationContent\` (선택): 자기평가 내용 (문자열)
- \`selfEvaluationScore\` (선택): 자기평가 점수 (달성률 %, 0 ~ 평가기간의 maxSelfEvaluationRate, 기본 최대값 120)
- \`performanceResult\` (선택): 성과 실적 (문자열, 빈 문자열도 허용)
- \`createdBy\` (선택): 생성자 ID (UUID 형식)

**테스트 케이스:**
- 신규 생성: 동일 조합의 평가가 없으면 신규 생성되며 version=1, isCompleted=false로 초기화
- 기존 수정: 동일 조합으로 기존 평가가 있으면 동일한 ID로 수정되며 version 증가
- 점수 범위: 0 ~ 평가기간의 maxSelfEvaluationRate 범위 내 모든 값 저장 가능 (예: 0, 50, 100, 120)
- 여러 번 수정: 동일 평가를 여러 번 수정할 수 있으며 매번 version과 updatedAt 증가
- 선택적 필드: selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy 모두 생략 가능
- performanceResult 빈 문자열: 빈 문자열("")도 유효한 값으로 저장됨
- DB 저장 검증: 저장된 데이터가 DB에 정확히 기록됨
- updatedAt 갱신: 수정 시 updatedAt이 자동으로 업데이트됨
- createdAt 유지: 수정 시 createdAt은 변경되지 않음 (200ms 이내 오차 허용)
- version 증가: 매 수정마다 version이 1씩 증가
- isCompleted 초기값: 신규 생성 시 isCompleted=false, completedAt=null
- 점수 범위 검증: 0 미만 또는 maxSelfEvaluationRate 초과 점수 입력 시 400 에러
- 점수 타입 검증: 점수가 숫자가 아닐 때 400 에러
- 내용 타입 검증: selfEvaluationContent가 문자열이 아닐 때 400 에러
- UUID 형식 검증: employeeId, wbsItemId, periodId, createdBy가 UUID 형식이 아닐 때 400 에러
- 평가기간 존재 검증: 존재하지 않는 periodId로 요청 시 400 에러
- 응답 필드 검증: id, periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, isCompleted, evaluationDate, createdAt, updatedAt, version 포함
- 응답 ID 일치: 응답의 employeeId, wbsItemId, periodId가 요청값과 정확히 일치
- 날짜 형식 검증: evaluationDate, createdAt, updatedAt이 유효한 날짜 형식`,
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiParam({
      name: 'wbsItemId',
      description: 'WBS 항목 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    ApiBody({
      type: CreateWbsSelfEvaluationBodyDto,
      description: 'WBS 자기평가 저장 정보 (모든 필드 선택사항)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'WBS 자기평가가 성공적으로 저장되었습니다. 신규 생성 또는 기존 평가 수정 결과를 반환합니다.',
      type: WbsSelfEvaluationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터 (UUID 형식 오류, 점수 범위 초과, 잘못된 타입 등)',
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
      description:
        '직원, WBS 항목 또는 평가기간을 찾을 수 없습니다. (존재하지 않거나 삭제됨)',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: '동시성 충돌 (낙관적 잠금 실패, version 불일치)',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
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
