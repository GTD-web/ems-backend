import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepApprovalStatusEnum } from '@/interface/common/dto/step-approval/update-step-approval.dto';
import { RecipientType } from '@domain/sub/evaluation-revision-request';

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: '직원명', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '사번', example: 'EMP001' })
  employeeNumber: string;

  @ApiProperty({ description: '이메일', example: 'hong@example.com' })
  email: string;

  @ApiPropertyOptional({ description: '부서명', example: '개발팀' })
  departmentName?: string;

  @ApiPropertyOptional({ description: '직책명', example: '선임연구원' })
  rankName?: string;
}

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: '평가기간명', example: '2024년 상반기 평가' })
  name: string;
}

/**
 * 재작성 요청 응답 DTO
 */
export class RevisionRequestResponseDto {
  // ==================== 기본 정보 ====================
  @ApiProperty({
    description: '재작성 요청 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId: string;

  @ApiProperty({ description: '평가기간 정보', type: EvaluationPeriodInfoDto })
  evaluationPeriod: EvaluationPeriodInfoDto;

  @ApiProperty({ description: '피평가자 정보', type: EmployeeInfoDto })
  employee: EmployeeInfoDto;

  // ==================== 재작성 요청 정보 ====================
  @ApiProperty({
    description: '재작성 요청 단계',
    enum: ['criteria', 'self', 'primary', 'secondary'],
    example: 'criteria',
  })
  step: string;

  @ApiProperty({
    description: '재작성 요청 코멘트',
    example: '평가기준이 명확하지 않습니다. 다시 작성해 주세요.',
  })
  comment: string;

  @ApiProperty({
    description: '요청자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestedBy: string;

  @ApiProperty({
    description: '요청 일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  requestedAt: Date;

  // ==================== 수신자 정보 ====================
  @ApiProperty({
    description: '수신자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  recipientId: string;

  @ApiProperty({
    description: '수신자 타입',
    enum: RecipientType,
    example: RecipientType.EVALUATEE,
  })
  recipientType: RecipientType;

  // ==================== 읽음/완료 상태 ====================
  @ApiProperty({ description: '읽음 여부', example: false })
  isRead: boolean;

  @ApiPropertyOptional({
    description: '읽은 일시',
    nullable: true,
    example: '2024-01-01T00:00:00.000Z',
  })
  readAt: Date | null;

  @ApiProperty({ description: '재작성 완료 여부', example: false })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '재작성 완료 일시',
    nullable: true,
    example: '2024-01-01T00:00:00.000Z',
  })
  completedAt: Date | null;

  @ApiPropertyOptional({
    description: '재작성 완료 응답 코멘트',
    nullable: true,
    example: '재작성을 완료했습니다.',
  })
  responseComment: string | null;

  // ==================== 단계 승인 상태 ====================
  @ApiProperty({
    description: `단계 승인 상태

**상태 값:**
- \`pending\`: 대기 (미확인)
- \`approved\`: 확인 완료
- \`revision_requested\`: 재작성 요청 (코멘트 필수)
- \`revision_completed\`: 재작성 완료 (재작성 완료 응답 제출 시 자동 변경, 이 API로 직접 설정 불가)`,
    enum: StepApprovalStatusEnum,
    example: StepApprovalStatusEnum.PENDING,
  })
  approvalStatus: StepApprovalStatusEnum;
}

/**
 * 읽지 않은 재작성 요청 수 응답 DTO
 */
export class UnreadCountResponseDto {
  @ApiProperty({
    description: '읽지 않은 재작성 요청 수',
    example: 5,
  })
  unreadCount: number;
}
