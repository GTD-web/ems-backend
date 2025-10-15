import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * 직원 평가기간 현황 조회 DTO
 */
export class GetEmployeeEvaluationPeriodStatusDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  evaluationPeriodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;
}

// ==================== 응답 DTO ====================

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기 평가',
  })
  name: string;

  @ApiProperty({
    description: '평가 기간 상태',
    example: 'IN_PROGRESS',
  })
  status: string;

  @ApiProperty({
    description: '현재 평가 단계',
    example: 'SELF_EVALUATION',
  })
  currentPhase: string;

  @ApiProperty({
    description: '평가 시작일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: '평가 종료일',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T23:59:59.999Z',
    nullable: true,
  })
  endDate?: Date;
}

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '직원명',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '직원 사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
    nullable: true,
  })
  departmentName?: string;

  @ApiPropertyOptional({
    description: '직책명',
    example: '대리',
    nullable: true,
  })
  rankName?: string;
}

/**
 * 평가항목 설정 정보 DTO
 */
export class EvaluationCriteriaInfoDto {
  @ApiProperty({
    description: '평가항목 설정 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '할당된 프로젝트 수',
    example: 2,
  })
  assignedProjectCount: number;

  @ApiProperty({
    description: '할당된 WBS 수',
    example: 5,
  })
  assignedWbsCount: number;
}

/**
 * WBS 평가기준 설정 정보 DTO
 */
export class WbsCriteriaInfoDto {
  @ApiProperty({
    description: 'WBS 평가기준 설정 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '평가기준이 설정된 WBS 수',
    example: 5,
  })
  wbsWithCriteriaCount: number;
}

/**
 * 평가라인 지정 정보 DTO
 */
export class EvaluationLineInfoDto {
  @ApiProperty({
    description: '평가라인 지정 완료 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: 'PRIMARY 라인 평가자 지정 여부',
    example: true,
  })
  hasPrimaryEvaluator: boolean;

  @ApiProperty({
    description: 'SECONDARY 라인 평가자 지정 여부',
    example: true,
  })
  hasSecondaryEvaluator: boolean;
}

/**
 * 평가 대상 제외 정보 DTO
 */
export class ExclusionInfoDto {
  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded: boolean;

  @ApiPropertyOptional({
    description: '제외 사유',
    example: '휴직',
    nullable: true,
  })
  excludeReason?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  excludedAt?: Date | null;
}

/**
 * 직원의 평가기간 현황 응답 DTO
 */
export class EmployeeEvaluationPeriodStatusResponseDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  mappingId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  evaluationPeriodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가 대상 여부 (제외되지 않고 삭제되지 않은 경우)',
    example: true,
  })
  isEvaluationTarget: boolean;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: () => EvaluationPeriodInfoDto,
    nullable: true,
  })
  evaluationPeriod: EvaluationPeriodInfoDto | null;

  @ApiPropertyOptional({
    description: '직원 정보',
    type: () => EmployeeInfoDto,
    nullable: true,
  })
  employee: EmployeeInfoDto | null;

  @ApiProperty({
    description: '평가 대상 제외 정보',
    type: () => ExclusionInfoDto,
  })
  exclusionInfo: ExclusionInfoDto;

  @ApiProperty({
    description: '평가항목 설정 정보',
    type: () => EvaluationCriteriaInfoDto,
  })
  evaluationCriteria: EvaluationCriteriaInfoDto;

  @ApiProperty({
    description: 'WBS 평가기준 설정 정보',
    type: () => WbsCriteriaInfoDto,
  })
  wbsCriteria: WbsCriteriaInfoDto;

  @ApiProperty({
    description: '평가라인 지정 정보',
    type: () => EvaluationLineInfoDto,
  })
  evaluationLine: EvaluationLineInfoDto;
}
