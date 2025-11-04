import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({ description: '직원 ID' })
  id: string;

  @ApiProperty({ description: '직원명' })
  name: string;

  @ApiProperty({ description: '사번' })
  employeeNumber: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiPropertyOptional({ description: '부서명' })
  departmentName?: string;

  @ApiPropertyOptional({ description: '직책명' })
  rankName?: string;
}

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({ description: '평가기간 ID' })
  id: string;

  @ApiProperty({ description: '평가기간명' })
  name: string;
}

/**
 * 재작성 요청 응답 DTO
 */
export class RevisionRequestResponseDto {
  @ApiProperty({ description: '재작성 요청 ID' })
  requestId: string;

  @ApiProperty({ description: '평가기간 ID' })
  evaluationPeriodId: string;

  @ApiProperty({ description: '평가기간 정보', type: EvaluationPeriodInfoDto })
  evaluationPeriod: EvaluationPeriodInfoDto;

  @ApiProperty({ description: '피평가자 ID' })
  employeeId: string;

  @ApiProperty({ description: '피평가자 정보', type: EmployeeInfoDto })
  employee: EmployeeInfoDto;

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

  @ApiProperty({ description: '요청자 ID' })
  requestedBy: string;

  @ApiProperty({ description: '요청 일시' })
  requestedAt: Date;

  @ApiProperty({ description: '수신자 ID' })
  recipientId: string;

  @ApiProperty({
    description: '수신자 타입',
    enum: ['evaluatee', 'primary_evaluator', 'secondary_evaluator'],
    example: 'evaluatee',
  })
  recipientType: string;

  @ApiProperty({ description: '읽음 여부' })
  isRead: boolean;

  @ApiPropertyOptional({ description: '읽은 일시', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: '재작성 완료 여부' })
  isCompleted: boolean;

  @ApiPropertyOptional({ description: '재작성 완료 일시', nullable: true })
  completedAt: Date | null;

  @ApiPropertyOptional({
    description: '재작성 완료 응답 코멘트',
    nullable: true,
  })
  responseComment: string | null;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
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


