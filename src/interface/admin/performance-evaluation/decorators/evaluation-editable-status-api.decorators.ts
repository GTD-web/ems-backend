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
    ApiParam({
      name: 'mappingId',
      description: '평가기간-직원 맵핑 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'evaluationType',
      description: '평가 타입',
      enum: EvaluationType,
      required: true,
      example: EvaluationType.SELF,
    }),
    ApiOperation({
      summary: '평가 수정 가능 상태 변경',
      description: `**중요**: 특정 직원의 평가 수정 가능 상태를 변경합니다.

**평가 타입 (쿼리 파라미터):**
- \`self\`: 자기평가 수정 가능 상태만 변경
- \`primary\`: 1차평가 수정 가능 상태만 변경
- \`secondary\`: 2차평가 수정 가능 상태만 변경
- \`all\`: 모든 평가 수정 가능 상태 일괄 변경

**테스트 케이스:**
- 기본 변경: 특정 평가의 수정 가능 상태를 변경할 수 있어야 함
- 타입별 변경: 각 평가 타입에 따라 개별적으로 변경 가능
- 일괄 변경: all 타입으로 모든 평가 수정 가능 상태 한 번에 변경
- 존재하지 않는 맵핑: 존재하지 않는 맵핑 ID로 요청 시 404 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러
- 잘못된 평가 타입: 유효하지 않은 평가 타입으로 요청 시 400 에러`,
    }),
    ApiBody({
      type: UpdateEvaluationEditableStatusBodyDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '평가 수정 가능 상태가 성공적으로 변경되었습니다. 변경된 맵핑 정보를 반환합니다.',
      type: EvaluationEditableStatusResponseDto,
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
      description: '평가기간-직원 맵핑을 찾을 수 없습니다.',
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
    ApiParam({
      name: 'periodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiOperation({
      summary: '평가기간별 모든 평가 수정 가능 상태 변경',
      description: `**중요**: 특정 평가기간의 모든 평가 대상자에 대한 평가 수정 가능 상태를 일괄 변경합니다.

**사용 시나리오:**
- 평가 시작: 자기평가만 수정 가능하도록 설정
- 1차평가 시작: 자기평가 잠금, 1차평가 수정 가능하도록 설정
- 2차평가 시작: 1차평가 잠금, 2차평가 수정 가능하도록 설정
- 평가 종료: 모든 평가 수정 불가능하도록 설정

**테스트 케이스:**
- 일괄 변경: 해당 평가기간의 모든 대상자의 수정 가능 상태가 변경되어야 함
- 단계별 잠금: 각 평가 단계별로 선택적 잠금 가능
- 빈 평가기간: 평가 대상자가 없는 평가기간의 경우에도 정상 처리
- 존재하지 않는 평가기간: 존재하지 않는 평가기간 ID로 요청 시 404 에러
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
    }),
    ApiBody({
      type: UpdatePeriodAllEvaluationEditableStatusDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        '평가기간의 모든 평가 수정 가능 상태가 성공적으로 변경되었습니다. 변경된 개수와 설정 정보를 반환합니다.',
      type: PeriodAllEvaluationEditableStatusResponseDto,
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
      description: '평가기간을 찾을 수 없습니다.',
    }),
  );
}
