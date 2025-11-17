import { ToBooleanStrict } from '@/interface/common/decorators';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * 평가기간 기본 정보 DTO
 */
export class EvaluationPeriodBasicInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기 평가',
  })
  name!: string;

  @ApiProperty({
    description: '평가 기간 시작일',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate!: Date;

  @ApiPropertyOptional({
    description: '평가 기간 종료일',
    example: '2024-06-30T23:59:59.999Z',
    nullable: true,
  })
  endDate?: Date | null;

  @ApiProperty({
    description: '평가 기간 상태',
    enum: EvaluationPeriodStatus,
    example: EvaluationPeriodStatus.IN_PROGRESS,
  })
  status!: EvaluationPeriodStatus;

  @ApiPropertyOptional({
    description: '현재 진행 단계',
    enum: EvaluationPeriodPhase,
    example: EvaluationPeriodPhase.SELF_EVALUATION,
    nullable: true,
  })
  currentPhase?: EvaluationPeriodPhase | null;
}

/**
 * 직원 기본 정보 DTO (평가 대상자 조회용)
 */
export class EmployeeBasicInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  id!: string;

  @ApiProperty({
    description: '직원 번호',
    example: 'EMP001',
  })
  employeeNumber!: string;

  @ApiProperty({
    description: '직원명',
    example: '홍길동',
  })
  name!: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
    nullable: true,
  })
  departmentName?: string;

  @ApiPropertyOptional({
    description: '직책명',
    example: '과장',
    nullable: true,
  })
  rankName?: string;

  @ApiProperty({
    description: '직원 상태',
    example: '재직중',
  })
  status!: string;
}

/**
 * 평가 대상자 등록 요청 DTO
 *
 * Note: 이 DTO는 현재 빈 클래스이지만, 향후 추가 필드가 필요할 경우를 대비해 유지합니다.
 * createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class RegisterEvaluationTargetDto {
  // 현재 필요한 필드 없음 - @CurrentUser()를 통해 createdBy 자동 처리
}

/**
 * 평가 대상자 대량 등록 요청 DTO
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class RegisterBulkEvaluationTargetsDto {
  @ApiProperty({
    description: '직원 ID 목록',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds!: string[];
}

/**
 * 평가 대상 제외 요청 DTO
 *
 * Note: excludedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class ExcludeEvaluationTargetDto {
  @ApiProperty({
    description: '평가 대상 제외 사유',
    example: '휴직으로 인한 평가 제외',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  excludeReason!: string;
}

/**
 * 평가 대상 포함 요청 DTO
 *
 * Note: 이 DTO는 현재 빈 클래스이지만, 향후 추가 필드가 필요할 경우를 대비해 유지합니다.
 * updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class IncludeEvaluationTargetDto {
  // 현재 필요한 필드 없음 - @CurrentUser()를 통해 updatedBy 자동 처리
}

/**
 * 평가 대상자 아이템 DTO (evaluationPeriodId 제외)
 */
export class EvaluationTargetItemDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: '직원 정보',
    type: EmployeeBasicInfoDto,
  })
  employee!: EmployeeBasicInfoDto;

  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded!: boolean;

  @ApiPropertyOptional({
    description: '평가 대상 제외 사유',
    example: null,
    nullable: true,
  })
  excludeReason?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리자 ID',
    example: null,
    nullable: true,
  })
  excludedBy?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    example: null,
    nullable: true,
  })
  excludedAt?: Date | null;

  @ApiProperty({
    description: '생성자 ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  createdBy!: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  updatedBy?: string | null;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version!: number;
}

/**
 * 평가 대상자 목록 응답 DTO
 */
export class EvaluationTargetsResponseDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  evaluationPeriodId!: string;

  @ApiProperty({
    description: '평가 대상자 목록',
    type: [EvaluationTargetItemDto],
  })
  targets!: EvaluationTargetItemDto[];
}

/**
 * 직원의 평가기간 맵핑 아이템 DTO
 */
export class EmployeeEvaluationPeriodMappingItemDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: '평가기간 정보',
    type: EvaluationPeriodBasicInfoDto,
  })
  evaluationPeriod!: EvaluationPeriodBasicInfoDto;

  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded!: boolean;

  @ApiPropertyOptional({
    description: '평가 대상 제외 사유',
    example: null,
    nullable: true,
  })
  excludeReason?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리자 ID',
    example: null,
    nullable: true,
  })
  excludedBy?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    example: null,
    nullable: true,
  })
  excludedAt?: Date | null;

  @ApiProperty({
    description: '생성자 ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  createdBy!: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  updatedBy?: string | null;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version!: number;
}

/**
 * 직원의 평가기간 맵핑 목록 응답 DTO
 */
export class EmployeeEvaluationPeriodsResponseDto {
  @ApiProperty({
    description: '직원 정보',
    type: EmployeeBasicInfoDto,
  })
  employee!: EmployeeBasicInfoDto;

  @ApiProperty({
    description: '평가기간 맵핑 목록',
    type: [EmployeeEvaluationPeriodMappingItemDto],
  })
  mappings!: EmployeeEvaluationPeriodMappingItemDto[];
}

/**
 * 평가 대상자 맵핑 응답 DTO (단건용 - 등록/수정 시 사용)
 */
export class EvaluationTargetMappingResponseDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  evaluationPeriodId!: string;

  @ApiProperty({
    description: '직원 ID',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  employeeId!: string;

  @ApiProperty({
    description: '직원 정보',
    type: EmployeeBasicInfoDto,
  })
  employee!: EmployeeBasicInfoDto;

  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded!: boolean;

  @ApiPropertyOptional({
    description: '평가 대상 제외 사유',
    example: null,
    nullable: true,
  })
  excludeReason?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리자 ID',
    example: null,
    nullable: true,
  })
  excludedBy?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    type: 'string',
    format: 'date-time',
    example: null,
    nullable: true,
  })
  excludedAt?: Date | null;

  @ApiProperty({
    description: '생성자 ID',
    example: 'admin-user-id',
  })
  createdBy!: string;

  @ApiProperty({
    description: '수정자 ID',
    example: 'admin-user-id',
  })
  updatedBy!: string;

  @ApiProperty({
    description: '생성 일시',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '수정 일시',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: '삭제 일시 (소프트 삭제)',
    type: 'string',
    format: 'date-time',
    example: null,
    nullable: true,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: '버전 (낙관적 잠금용)',
    example: 1,
  })
  version!: number;
}

/**
 * 평가 대상 여부 응답 DTO
 */
export class EvaluationTargetStatusResponseDto {
  @ApiProperty({
    description: '평가 대상 여부',
    example: true,
  })
  isEvaluationTarget!: boolean;

  @ApiProperty({
    description: '평가기간 정보',
    type: EvaluationPeriodBasicInfoDto,
  })
  evaluationPeriod!: EvaluationPeriodBasicInfoDto;

  @ApiProperty({
    description: '직원 정보',
    type: EmployeeBasicInfoDto,
  })
  employee!: EmployeeBasicInfoDto;
}

/**
 * 등록되지 않은 직원 목록 응답 DTO
 */
export class UnregisteredEmployeesResponseDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  evaluationPeriodId!: string;

  @ApiProperty({
    description: '등록되지 않은 직원 목록',
    type: [EmployeeBasicInfoDto],
  })
  employees!: EmployeeBasicInfoDto[];
}
