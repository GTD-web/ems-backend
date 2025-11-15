import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
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

  // Swagger에 표시하지 않기 위해 @Api 데코레이터 제거
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
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
