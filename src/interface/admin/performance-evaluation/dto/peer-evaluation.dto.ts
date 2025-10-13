import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 동료평가 생성 Body DTO
 */
export class CreatePeerEvaluationBodyDto {
  @ApiPropertyOptional({
    description: '평가자 ID (추후 요청자 ID로 자동 입력)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '동료평가 내용',
    example: '동료로서 협업 능력이 우수합니다.',
  })
  @IsOptional()
  @IsString()
  peerEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '동료평가 점수 (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  peerEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 동료평가 수정 DTO
 */
export class UpdatePeerEvaluationDto {
  @ApiPropertyOptional({
    description: '동료평가 내용',
    example: '수정된 동료평가 내용입니다.',
  })
  @IsOptional()
  @IsString()
  peerEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '동료평가 점수 (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  peerEvaluationScore?: number;
}

/**
 * 동료평가 제출 DTO
 */
export class SubmitPeerEvaluationDto {
  @ApiPropertyOptional({
    description: '제출자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;
}

/**
 * 동료평가 필터 DTO
 */
export class PeerEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  evaluateeId?: string;

  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: '평가 상태',
    example: 'DRAFT',
    enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 동료평가 응답 DTO
 */
export class PeerEvaluationResponseDto {
  @ApiProperty({
    description: '동료평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '결과 메시지',
    example: '동료평가가 성공적으로 생성되었습니다.',
  })
  message: string;
}

/**
 * 동료평가 기본 정보 DTO
 */
export class PeerEvaluationBasicDto {
  @ApiProperty({
    description: '동료평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  evaluateeId: string;

  @ApiPropertyOptional({
    description: '동료평가 내용',
    example: '동료로서 협업 능력이 우수합니다.',
  })
  peerEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '동료평가 점수 (1-5)',
    example: 4,
  })
  peerEvaluationScore?: number;

  @ApiProperty({
    description: '평가 상태',
    example: 'DRAFT',
    enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
  })
  status: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;
}

/**
 * 동료평가 목록 응답 DTO
 */
export class PeerEvaluationListResponseDto {
  @ApiProperty({
    description: '동료평가 목록',
    type: [PeerEvaluationBasicDto],
  })
  evaluations: PeerEvaluationBasicDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 10,
  })
  limit: number;
}

/**
 * 동료평가 상세 응답 DTO
 */
export class PeerEvaluationDetailResponseDto extends PeerEvaluationBasicDto {
  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-15T11:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  updatedBy?: string;
}
