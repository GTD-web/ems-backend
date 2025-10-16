import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { EvaluationType } from '@context/performance-evaluation-context/handlers/evaluation-editable-status';

/**
 * 평가 수정 가능 상태 변경 요청 DTO (Body)
 */
export class UpdateEvaluationEditableStatusBodyDto {
  @ApiProperty({
    description: '수정 가능 여부',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isEditable: boolean;

  @ApiPropertyOptional({
    description: '수정자 ID (자동 설정되므로 선택 사항)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}

/**
 * 평가 수정 가능 상태 변경 요청 DTO (Query)
 */
export class UpdateEvaluationEditableStatusQueryDto {
  @ApiProperty({
    description: '평가 타입',
    enum: EvaluationType,
    example: EvaluationType.SELF,
  })
  @IsNotEmpty()
  @IsEnum(EvaluationType)
  evaluationType: EvaluationType;
}

/**
 * 평가기간별 모든 평가 수정 가능 상태 변경 요청 DTO
 */
export class UpdatePeriodAllEvaluationEditableStatusDto {
  @ApiProperty({
    description: '자기평가 수정 가능 여부',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isSelfEvaluationEditable: boolean;

  @ApiProperty({
    description: '1차평가 수정 가능 여부',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isPrimaryEvaluationEditable: boolean;

  @ApiProperty({
    description: '2차평가 수정 가능 여부',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isSecondaryEvaluationEditable: boolean;

  @ApiPropertyOptional({
    description: '수정자 ID (자동 설정되므로 선택 사항)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}

/**
 * 평가 수정 가능 상태 변경 응답 DTO
 */
export class EvaluationEditableStatusResponseDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluationPeriodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  employeeId: string;

  @ApiProperty({
    description: '자기평가 수정 가능 여부',
    example: true,
  })
  isSelfEvaluationEditable: boolean;

  @ApiProperty({
    description: '1차평가 수정 가능 여부',
    example: false,
  })
  isPrimaryEvaluationEditable: boolean;

  @ApiProperty({
    description: '2차평가 수정 가능 여부',
    example: false,
  })
  isSecondaryEvaluationEditable: boolean;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-15T09:30:00Z',
  })
  updatedAt: Date;
}

/**
 * 평가기간별 모든 평가 수정 가능 상태 변경 응답 DTO
 */
export class PeriodAllEvaluationEditableStatusResponseDto {
  @ApiProperty({
    description: '변경된 맵핑 개수',
    example: 25,
  })
  updatedCount: number;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluationPeriodId: string;

  @ApiProperty({
    description: '자기평가 수정 가능 여부',
    example: true,
  })
  isSelfEvaluationEditable: boolean;

  @ApiProperty({
    description: '1차평가 수정 가능 여부',
    example: false,
  })
  isPrimaryEvaluationEditable: boolean;

  @ApiProperty({
    description: '2차평가 수정 가능 여부',
    example: false,
  })
  isSecondaryEvaluationEditable: boolean;
}
