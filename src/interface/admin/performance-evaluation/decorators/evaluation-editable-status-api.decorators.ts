import { applyDecorators, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  UpdateEvaluationEditableStatusBodyDto,
  UpdatePeriodAllEvaluationEditableStatusDto,
  EvaluationEditableStatusResponseDto,
  PeriodAllEvaluationEditableStatusResponseDto,
} from '../dto/evaluation-editable-status.dto';
import { EvaluationType } from '@context/performance-evaluation-context/handlers/evaluation-editable-status';

/**
 * 평가 수정 가능 상태 변경 API 데코레이터
 */
export function UpdateEvaluationEditableStatus() {
  return applyDecorators(
    Patch(':mappingId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가 수정 가능 상태 변경',
      description: `**중요**: 특정 직원의 평가 수정 가능 상태를 변경합니다. 각 평가 타입별로 독립적으로 수정 가능 여부를 제어할 수 있으며, 평가 진행 단계에 따라 순차적으로 잠금 처리할 수 있습니다.

**평가 타입 (쿼리 파라미터):**
- \`self\`: 자기평가 수정 가능 상태만 변경
- \`primary\`: 1차평가 수정 가능 상태만 변경
- \`secondary\`: 2차평가 수정 가능 상태만 변경
- \`all\`: 모든 평가 수정 가능 상태 일괄 변경

**수정 가능 여부 (쿼리 파라미터):**
- 허용값: "true", "false", "1", "0", "yes", "no", "on", "off"
- 엄격한 검증: 허용되지 않은 값 입력 시 400 에러 발생

**테스트 케이스:**
- 자기평가 상태 변경: 자기평가만 선택적으로 수정 가능/불가능 설정
- 1차평가 상태 변경: 1차평가만 선택적으로 수정 가능/불가능 설정
- 2차평가 상태 변경: 2차평가만 선택적으로 수정 가능/불가능 설정
- 일괄 변경: all 타입으로 모든 평가 수정 가능 상태 한 번에 변경
- 여러 번 변경: 동일한 맵핑의 상태를 여러 번 변경 가능
- 순차적 잠금 시나리오: 평가 진행 단계별로 순차적 잠금 처리 (자기평가 → 1차평가 → 2차평가 → 전체 종료)
- DB 저장 검증: 변경된 상태가 DB에 올바르게 반영됨
- updatedAt 갱신: 상태 변경 시 수정일시 자동 업데이트
- createdAt 유지: 생성일시는 변경되지 않음 (50ms 이내 오차)
- 독립적 변경: 각 평가 타입은 다른 타입에 영향 없이 독립적으로 변경됨
- isEditable 필드 누락: 필수 필드 누락 시 400 에러
- evaluationType 누락: 평가 타입 쿼리 파라미터 누락 시 400 에러
- 잘못된 evaluationType: 허용되지 않은 평가 타입 값 시 400 에러
- 잘못된 isEditable 값: boolean으로 변환할 수 없는 값 입력 시 400 에러
- 존재하지 않는 맵핑: 유효하지 않은 맵핑 ID로 요청 시 404 에러
- 잘못된 UUID 형식: mappingId가 UUID 형식이 아닐 때 400 에러
- 응답 필드 검증: 응답에 id, evaluationPeriodId, employeeId, 수정 가능 상태 필드들, 타임스탬프 포함
- 응답 ID 일치: 응답의 ID가 요청한 mappingId와 정확히 일치
- 동시 변경: 같은 맵핑에 대한 동시 상태 변경 요청 처리
- 트랜잭션 보장: 상태 변경 중 오류 시 롤백 처리`,
    }),
    ApiParam({
      name: 'mappingId',
      description: '평가기간-직원 맵핑 ID (UUID 형식)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiQuery({
      name: 'evaluationType',
      description:
        '평가 타입 (self: 자기평가, primary: 1차평가, secondary: 2차평가, all: 전체)',
      enum: EvaluationType,
      required: true,
      example: EvaluationType.SELF,
    }),
    ApiQuery({
      name: 'isEditable',
      description:
        '수정 가능 여부 (허용값: "true", "false", "1", "0", "yes", "no", "on", "off")',
      type: String,
      required: true,
      example: 'true',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '평가 수정 가능 상태가 성공적으로 변경되었습니다. 변경된 맵핑 정보를 반환합니다.',
      type: EvaluationEditableStatusResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터 (필수 파라미터 누락, UUID 형식 오류, 잘못된 평가 타입, 잘못된 boolean 값 등)',
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
        '평가기간-직원 맵핑을 찾을 수 없습니다. (존재하지 않거나 삭제됨)',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: '서버 내부 오류 (트랜잭션 처리 실패 등)',
    }),
  );
}

/**
 * 평가기간별 모든 평가 수정 가능 상태 변경 API 데코레이터
 */
export function UpdatePeriodAllEvaluationEditableStatus() {
  return applyDecorators(
    Patch('period/:periodId/all'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: '평가기간별 모든 평가 수정 가능 상태 일괄 변경',
      description: `**중요**: 특정 평가기간의 모든 평가 대상자에 대한 평가 수정 가능 상태를 일괄 변경합니다. 평가 진행 단계에 따라 한 번에 여러 직원의 평가 상태를 제어할 수 있어, 평가 운영 효율성을 높입니다.

**사용 시나리오:**
- 평가 시작: 자기평가만 수정 가능하도록 설정 (isSelfEvaluationEditable: true, isPrimaryEvaluationEditable: false, isSecondaryEvaluationEditable: false)
- 1차평가 시작: 자기평가 잠금, 1차평가 수정 가능하도록 설정 (isSelfEvaluationEditable: false, isPrimaryEvaluationEditable: true, isSecondaryEvaluationEditable: false)
- 2차평가 시작: 1차평가 잠금, 2차평가 수정 가능하도록 설정 (isSelfEvaluationEditable: false, isPrimaryEvaluationEditable: false, isSecondaryEvaluationEditable: true)
- 평가 종료: 모든 평가 수정 불가능하도록 설정 (모든 필드 false)
- 특별 케이스: 관리자 요청으로 일시적으로 모든 평가 수정 가능 (모든 필드 true)

**테스트 케이스:**
- 일괄 변경: 해당 평가기간의 모든 대상자(직원)의 수정 가능 상태가 동시에 변경됨
- 변경된 개수 반환: 실제 변경된 맵핑의 개수를 응답으로 반환
- 단계별 잠금: 자기평가, 1차평가, 2차평가 각각을 독립적으로 잠금/해제 가능
- 빈 평가기간: 평가 대상자가 없는 평가기간의 경우에도 정상 처리 (updatedCount: 0)
- 부분 대상자: 일부 대상자만 있는 평가기간도 정상 처리
- updatedBy 선택사항: 수정자 ID 없이도 일괄 변경 가능
- DB 일관성: 모든 대상자의 상태가 동일한 값으로 일괄 변경됨
- updatedAt 갱신: 변경된 모든 맵핑의 수정일시가 업데이트됨
- 트랜잭션 보장: 일부 실패 시 전체 롤백 처리
- 필수 필드 검증: isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable 필드 필수
- 필드 타입 검증: 각 필드가 boolean 타입이어야 함
- 존재하지 않는 평가기간: 유효하지 않은 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID 형식: periodId가 UUID 형식이 아닐 때 400 에러
- 잘못된 updatedBy: updatedBy가 UUID 형식이 아닐 때 400 에러
- 응답 구조 검증: 응답에 updatedCount, evaluationPeriodId, 수정 가능 상태 필드들 포함
- 대용량 처리: 100명 이상의 평가 대상자를 가진 평가기간도 효율적으로 처리
- 동시 변경: 동일 평가기간에 대한 동시 일괄 변경 요청 처리
- 성능 테스트: 대량 업데이트 시 적절한 응답 시간 유지 (5초 이내)`,
    }),
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID (UUID 형식)',
      example: '550e8400-e29b-41d4-a716-446655440001',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiBody({
      type: UpdatePeriodAllEvaluationEditableStatusDto,
      description: '평가 수정 가능 상태 설정 (모든 boolean 필드 필수)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '평가기간의 모든 평가 수정 가능 상태가 성공적으로 변경되었습니다. 변경된 개수와 설정 정보를 반환합니다.',
      type: PeriodAllEvaluationEditableStatusResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        '잘못된 요청 데이터 (필수 필드 누락, UUID 형식 오류, 잘못된 boolean 타입 등)',
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
      description: '평가기간을 찾을 수 없습니다. (존재하지 않거나 삭제됨)',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: '서버 내부 오류 (트랜잭션 처리 실패, 대량 업데이트 실패 등)',
    }),
  );
}
