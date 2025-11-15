import { applyDecorators, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeeAssignedDataResponseDto } from '../dto/employee-assigned-data.dto';

/**
 * 사용자 할당 정보 조회 API 데코레이터
 */
export function GetEmployeeAssignedData() {
  return applyDecorators(
    Get(':evaluationPeriodId/employees/:employeeId/assigned-data'),
    ApiOperation({
      summary: '사용자 할당 정보 조회',
      description: `특정 직원의 평가기간 내 할당된 모든 정보를 조회합니다.

**동작:**
- 평가기간 정보 반환 (평가기간명, 시작/종료일, 상태, 설정 허용 여부)
  * maxSelfEvaluationRate: 자기평가 달성률 최대값 (%) - 자기평가 입력 시 사용
- 직원 기본 정보 반환 (직원명, 직원번호, 이메일, 부서, 상태)
- 할당된 프로젝트 목록을 프로젝트별로 그룹화하여 반환
- 각 프로젝트에 속한 WBS 목록 반환 (WBS 정보, 평가기준, 성과, 자기평가, 하향평가 포함)
- 데이터 요약 정보 제공 (총 프로젝트 수, 총 WBS 수, 완료된 성과 수, 완료된 자기평가 수, 평가 점수 및 등급)
- 할당이 없는 경우에도 빈 배열로 정상 응답
- 등록되지 않은 직원이나 존재하지 않는 평가기간 조회 시 404 에러 반환


**테스트 케이스:**
- 유효한 평가기간과 직원ID로 할당 정보를 조회할 수 있어야 한다
- 응답에 모든 필수 필드가 포함되어야 한다 (evaluationPeriod, employee, projects, summary)
- 프로젝트와 WBS가 할당된 경우 조회 성공해야 한다
- 평가기간 정보가 올바르게 반환되어야 한다
- 직원 정보가 올바르게 반환되어야 한다
- summary 카운트가 정확해야 한다
- 할당이 없는 직원도 조회 성공해야 한다 (빈 배열)
- WBS별 평가기준이 올바르게 반환되어야 한다
- 프로젝트별로 WBS가 올바르게 그룹화되어야 한다
- 여러 직원의 할당 정보를 조회해도 데이터가 섞이지 않아야 한다
- 등록되지 않은 직원 조회 시 404 에러가 발생해야 한다
- 존재하지 않는 평가기간 조회 시 404 에러가 발생해야 한다
- 잘못된 평가기간 UUID 형식으로 요청 시 400 에러가 발생해야 한다
- 잘못된 직원 UUID 형식으로 요청 시 400 에러가 발생해야 한다

**성능:**
- 소규모 데이터 (직원당 WBS ~11개): 평균 ~18ms, 병렬 처리 시 11ms/요청
- 대용량 데이터 (직원당 WBS ~119개): 평균 ~252ms (목표 2,000ms 대비 87% 빠름)
- 확장성: WBS당 처리 시간 2.1ms (119개 기준, 선형 확장 가능)
- 연속 조회: 평균 245ms로 안정적인 응답 속도 유지 (대용량 기준)
- 병렬 조회: 5명 동시 조회 시 42% 성능 향상 (146ms/요청, 대용량 기준)
- 메모리 효율성: 30회 반복 조회 후 메모리 감소 (-33MB, 가비지 컬렉션 효과적)
- 데이터 정합성: 프로젝트 및 WBS 정보가 올바르게 그룹화되어 반환됨
- 테스트 환경 (소규모): 직원 5명, 프로젝트 12개, WBS 11개, 평가기준 45건, 자기평가 55건
- 테스트 환경 (대용량): 직원 5명, 프로젝트 6개/명, WBS 119개/명, 평가기준 ~864개/명`,
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
      description: '평가기간에 등록되지 않은 직원 또는 평가기간을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (UUID 형식 오류 등)',
    }),
  );
}
