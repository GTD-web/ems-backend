import { applyDecorators, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeeEvaluationPeriodStatusResponseDto } from '../dto/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from '../dto/my-evaluation-targets-status.dto';
import {
  EmployeeAssignedDataResponseDto,
  EvaluatorAssignedEmployeesDataResponseDto,
} from '../dto/employee-assigned-data.dto';

/**
 * 직원의 평가기간 현황 조회 API 데코레이터
 */
export function GetEmployeeEvaluationPeriodStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/status'),
    ApiOperation({
      summary: '직원의 평가기간 현황 조회',
      description: `**중요**: 특정 평가기간에서 특정 직원의 평가 참여 현황을 조회합니다.

**조회 정보:**
- 평가 대상 여부 (제외 여부 포함)
- 평가항목 설정 상태 (프로젝트/WBS 할당)
- WBS 평가기준 설정 상태
- 평가라인 지정 상태 (PRIMARY/SECONDARY 평가자)

**상태 값:**
- complete: 완료 (모든 항목 설정됨)
- in_progress: 설정중 (일부 항목만 설정됨)
- none: 미존재 (항목이 설정되지 않음)

**테스트 케이스:**
- 정상 조회: 평가기간에 등록된 직원의 현황을 조회할 수 있어야 함
- 미등록 직원: 평가기간에 등록되지 않은 직원 조회 시 null 반환
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '직원의 평가기간 현황 조회 성공',
      type: EmployeeEvaluationPeriodStatusResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간에 등록되지 않은 직원',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 평가기간의 모든 직원 현황 조회 API 데코레이터
 */
export function GetAllEmployeesEvaluationPeriodStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/status'),
    ApiOperation({
      summary: '평가기간의 모든 직원 현황 조회',
      description: `**중요**: 특정 평가기간에 등록된 모든 직원의 평가 참여 현황을 조회합니다.

**조회 정보:**
- 평가 대상 여부 (제외 여부 포함)
- 평가항목 설정 상태 (프로젝트/WBS 할당)
- WBS 평가기준 설정 상태
- 평가라인 지정 상태 (PRIMARY/SECONDARY 평가자)
- 자기평가, 하향평가, 동료평가, 최종평가 진행 상태 및 점수

**상태 값:**
- complete: 완료 (모든 항목 설정됨)
- in_progress: 설정중 (일부 항목만 설정됨)
- none: 미존재 (항목이 설정되지 않음)

**성능 최적화:**
- 병렬 처리로 최적화됨 (100명 기준 약 3-5초)
- 제외된 직원은 결과에서 제외됨

**테스트 케이스:**
- 정상 조회: 평가기간에 등록된 모든 직원의 현황을 조회할 수 있어야 함
- 빈 결과: 등록된 직원이 없는 경우 빈 배열 반환
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: '모든 직원의 평가기간 현황 조회 성공',
      type: [EmployeeEvaluationPeriodStatusResponseDto],
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 내가 담당하는 평가 대상자 현황 조회 API 데코레이터
 */
export function GetMyEvaluationTargetsStatus() {
  return applyDecorators(
    Get(':evaluationPeriodId/my-evaluation-targets/:evaluatorId/status'),
    ApiOperation({
      summary: '내가 담당하는 평가 대상자 현황 조회',
      description: `**중요**: 평가자가 담당하는 피평가자들의 평가 현황을 조회합니다.

**조회 정보:**
- 내가 담당하는 피평가자 목록
- 각 피평가자에 대한 내 평가자 유형 (PRIMARY/SECONDARY)
- 내가 담당하는 하향평가 현황 (평가 대상 WBS 수, 완료 수, 평균 점수)
- 수정 가능 여부

**특징:**
- 제외된 직원은 결과에서 자동 제외
- 1차/2차 평가자로 동시에 지정된 경우 모두 표시
- 내가 담당하는 평가 현황만 제공

**테스트 케이스:**
- 정상 조회: 평가자가 담당하는 피평가자 현황을 조회할 수 있어야 함
- 담당 없음: 담당하는 평가 대상자가 없는 경우 빈 배열 반환
- 복수 역할: 1차/2차 평가자 모두인 경우 두 평가 현황 모두 제공
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID (나의 직원 ID)',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    ApiOkResponse({
      description: '내가 담당하는 평가 대상자 현황 조회 성공',
      type: [MyEvaluationTargetStatusResponseDto],
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 사용자 할당 정보 조회 API 데코레이터
 */
export function GetEmployeeAssignedData() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/assigned-data'),
    ApiOperation({
      summary: '사용자 할당 정보 조회',
      description: `**중요**: 특정 직원의 평가기간 내 할당된 모든 정보를 조회합니다.

**조회 정보:**
- 평가기간 정보
  - 평가기간명, 시작/종료일, 상태, 설명
  - 설정 허용 여부 (평가 기준, 자기평가, 하향/동료평가)
  - 자기평가 달성률 최대값
- 직원 정보 (직원명, 직원번호, 이메일, 부서, 상태)
- 할당된 프로젝트 목록 (프로젝트별로 그룹화)
  - 프로젝트 정보 (프로젝트명, 코드, 배정일)
  - 해당 프로젝트의 WBS 목록
    - WBS 정보 (WBS명, 코드, 가중치, 배정일)
    - WBS 평가기준 목록 (평가기준 내용, 생성일)
    - WBS 성과 정보 (성과 내용, 완료 여부, 완료일)
    - WBS 자기평가 정보 (평가 내용, 점수, 완료 여부, 수정 가능 여부, 제출일)
    - WBS 1차 하향평가 정보 (PRIMARY 평가자가 작성, 평가자명 포함)
    - WBS 2차 하향평가 정보 (SECONDARY 평가자가 작성, 평가자명 포함)

**데이터 요약 포함:**
- 총 프로젝트 수
- 총 WBS 수
- 완료된 성과 입력 수
- 완료된 자기평가 수

**사용 시나리오:**
- 사용자 대시보드에서 자신의 평가 진행 상황 확인
- 관리자가 특정 직원의 할당 현황 조회
- 평가 진행률 및 완료도 파악

**테스트 케이스:**
- 정상 조회: 평가기간에 등록된 직원의 할당 정보를 조회할 수 있어야 함
- 할당 없음: 할당된 데이터가 없는 경우 빈 배열 반환
- 미등록 직원: 평가기간에 등록되지 않은 직원 조회 시 404 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: '사용자 할당 정보 조회 성공',
      type: EmployeeAssignedDataResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간에 등록되지 않은 직원',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}

/**
 * 담당자의 피평가자 할당 정보 조회 API 데코레이터
 */
export function GetEvaluatorAssignedEmployeesData() {
  return applyDecorators(
    Get(
      ':evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data',
    ),
    ApiOperation({
      summary: '담당자의 피평가자 할당 정보 조회',
      description: `**중요**: 평가자가 담당하는 특정 피평가자의 평가기간 내 할당된 정보를 조회합니다.

**조회 정보:**
- 평가기간 정보
  - 평가기간명, 시작/종료일, 상태, 설명
  - 설정 허용 여부 (평가 기준, 자기평가, 하향/동료평가)
  - 자기평가 달성률 최대값
- 평가자 정보 (평가자명, 직원번호, 이메일, 부서, 상태)
- 피평가자 할당 정보 (일반 사용자 조회와 동일한 구조)
  - 피평가자 정보 (피평가자명, 직원번호, 이메일, 부서, 상태)
  - 프로젝트별 할당 정보
    - 프로젝트 정보 (프로젝트명, 코드, 배정일)
    - 해당 프로젝트의 WBS 목록
      - WBS 정보 (WBS명, 코드, 가중치, 배정일)
      - WBS 평가기준 목록 (평가기준 내용, 생성일)
      - WBS 성과 정보 (성과 내용, 완료 여부, 완료일)
      - WBS 자기평가 정보 (평가 내용, 점수, 완료 여부, 수정 가능 여부, 제출일)
      - WBS 1차 하향평가 정보 (PRIMARY 평가자가 작성, 평가자명 포함)
      - WBS 2차 하향평가 정보 (SECONDARY 평가자가 작성, 평가자명 포함)
  - 데이터 요약
    - 총 프로젝트 수
    - 총 WBS 수
    - 완료된 성과 입력 수
    - 완료된 자기평가 수

**사용 시나리오:**
- 평가자가 자신이 담당하는 특정 피평가자의 평가 진행 상황 확인
- 평가자가 피평가자의 성과와 자기평가를 검토
- 평가자가 하향평가를 작성하기 위한 정보 확인

**테스트 케이스:**
- 정상 조회: 평가자가 담당하는 피평가자의 할당 정보를 조회할 수 있어야 함
- 담당 아님: 평가자가 담당하지 않는 피평가자 조회 시 404 에러
- 미등록 평가자: 평가기간에 등록되지 않은 평가자 조회 시 404 에러
- 미등록 피평가자: 평가기간에 등록되지 않은 피평가자 조회 시 404 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'evaluatorId',
      description: '평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiParam({
      name: 'employeeId',
      description: '피평가자 ID',
      type: 'string',
      format: 'uuid',
      example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    ApiOkResponse({
      description: '담당자의 피평가자 할당 정보 조회 성공',
      type: EvaluatorAssignedEmployeesDataResponseDto,
    }),
    ApiNotFoundResponse({
      description: '평가기간 또는 평가자를 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}
