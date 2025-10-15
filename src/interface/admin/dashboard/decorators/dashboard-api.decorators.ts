import { applyDecorators, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeeEvaluationPeriodStatusResponseDto } from '../dto/dashboard.dto';

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
