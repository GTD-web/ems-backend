import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 평가 활동 내역 응답 DTO
 */
export class EvaluationActivityLogResponseDto {
  @ApiProperty({ description: '고유 식별자', example: 'uuid' })
  id: string;

  @ApiProperty({ description: '평가 기간 ID', example: 'period-123' })
  periodId: string;

  @ApiProperty({ description: '피평가자 ID', example: 'employee-456' })
  employeeId: string;

  @ApiProperty({
    description: '활동 유형',
    example: 'wbs_self_evaluation',
  })
  activityType: string;

  @ApiProperty({
    description: '활동 액션',
    example: 'created',
  })
  activityAction: string;

  @ApiPropertyOptional({
    description: '활동 제목',
    example: 'WBS 자기평가 생성',
  })
  activityTitle?: string;

  @ApiPropertyOptional({
    description: '활동 설명',
    example: '홍길동님이 WBS 자기평가를 생성했습니다.',
  })
  activityDescription?: string;

  @ApiPropertyOptional({
    description: '관련 엔티티 유형',
    example: 'wbs_self_evaluation',
  })
  relatedEntityType?: string;

  @ApiPropertyOptional({
    description: '관련 엔티티 ID',
    example: 'eval-789',
  })
  relatedEntityId?: string;

  @ApiProperty({
    description: '활동 수행자 ID',
    example: 'employee-456',
  })
  performedBy: string;

  @ApiPropertyOptional({
    description: '활동 수행자 이름',
    example: '홍길동',
  })
  performedByName?: string;

  @ApiPropertyOptional({
    description: '활동 메타데이터',
    example: { wbsItemId: 'wbs-123', evaluationId: 'eval-789' },
  })
  activityMetadata?: Record<string, any>;

  @ApiProperty({
    description: '활동 일시',
    example: '2024-01-01T10:00:00.000Z',
  })
  activityDate: Date;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-01T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: null,
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: 'user-123',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: 'user-123',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;
}

/**
 * 평가 활동 내역 목록 응답 DTO
 */
export class EvaluationActivityLogListResponseDto {
  @ApiProperty({
    description: '활동 내역 목록',
    type: [EvaluationActivityLogResponseDto],
  })
  items: EvaluationActivityLogResponseDto[];

  @ApiProperty({ description: '전체 개수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지 크기', example: 20 })
  limit: number;
}

