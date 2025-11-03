import { applyDecorators, Patch } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateStepApprovalDto } from '../dto/update-step-approval.dto';

/**
 * 단계 승인 상태 업데이트 API 데코레이터
 */
export function UpdateStepApproval() {
  return applyDecorators(
    Patch(':evaluationPeriodId/employees/:employeeId/step'),
    ApiOperation({
      summary: '단계 승인 상태 변경',
      description: `**관리자용**: 특정 직원의 평가 단계별 승인 상태를 변경합니다.

**변경 가능한 단계:**
- \`criteria\`: 평가기준 설정
- \`self\`: 자기평가 입력
- \`primary\`: 1차 하향평가 입력
- \`secondary\`: 2차 하향평가 입력

**승인 상태:**
- \`pending\`: 대기 (미확인)
- \`approved\`: 확인 완료
- \`revision_requested\`: 재작성 요청 (코멘트 필수)

**재작성 요청 시:**
- 상태가 \`revision_requested\`인 경우 \`revisionComment\`는 필수입니다.
- 재작성 요청이 생성되며, 해당 단계의 담당자에게 전송됩니다.
- 평가기준/자기평가: 피평가자 + 1차평가자
- 1차평가: 1차평가자
- 2차평가: 2차평가자들

**사용 시나리오:**
- 관리자가 각 단계별 진행 상황을 확인
- 문제가 있는 경우 재작성 요청
- 확인 완료 처리

**테스트 케이스:**
- 정상 확인: pending → approved
- 재작성 요청: approved → revision_requested (코멘트 포함)
- 대기 상태로 변경: approved → pending
- 코멘트 누락 시 400 에러
- 존재하지 않는 직원/평가기간: 404 에러`,
    }),
    ApiParam({
      name: 'evaluationPeriodId',
      description: '평가기간 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'employeeId',
      description: '직원 ID',
      type: 'string',
      format: 'uuid',
    }),
    ApiBody({
      type: UpdateStepApprovalDto,
      description: '단계 승인 상태 업데이트 정보',
    }),
    ApiOkResponse({
      description: '단계 승인 상태 변경 성공',
    }),
    ApiNotFoundResponse({
      description: '평가기간-직원 맵핑을 찾을 수 없음',
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (예: 재작성 요청 시 코멘트 누락)',
    }),
  );
}

