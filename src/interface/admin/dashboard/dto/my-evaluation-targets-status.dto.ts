import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==================== 평가자 관점 응답 DTO ====================

/**
 * 내 평가 상태 상세 DTO
 */
export class MyEvaluationStatusDetailDto {
  @ApiProperty({
    description: '평가 대상 WBS 수',
    example: 5,
  })
  assignedWbsCount: number;

  @ApiProperty({
    description: '완료된 평가 수',
    example: 3,
  })
  completedEvaluationCount: number;

  @ApiProperty({
    description: '수정 가능 여부',
    example: true,
  })
  isEditable: boolean;

  @ApiPropertyOptional({
    description: '가중치 기반 하향평가 총점 (0-100점)',
    example: 85.5,
    nullable: true,
  })
  totalScore: number | null;

  @ApiPropertyOptional({
    description:
      '평가기간 등급 기준에 따른 하향평가 등급 (예: S, A, B, C, D, F 등)',
    example: 'B',
    nullable: true,
  })
  grade: string | null;
}

/**
 * 내가 담당하는 하향평가 상태 DTO
 */
export class MyDownwardEvaluationStatusDto {
  @ApiProperty({
    description: '1차 평가자 여부',
    example: true,
  })
  isPrimary: boolean;

  @ApiProperty({
    description: '2차 평가자 여부',
    example: false,
  })
  isSecondary: boolean;

  @ApiPropertyOptional({
    description: '1차 평가 현황 (1차 평가자인 경우에만 제공)',
    type: () => MyEvaluationStatusDetailDto,
    nullable: true,
  })
  primaryStatus: MyEvaluationStatusDetailDto | null;

  @ApiPropertyOptional({
    description: '2차 평가 현황 (2차 평가자인 경우에만 제공)',
    type: () => MyEvaluationStatusDetailDto,
    nullable: true,
  })
  secondaryStatus: MyEvaluationStatusDetailDto | null;
}

/**
 * 내가 담당하는 평가 대상자의 제외 정보 DTO
 */
export class MyTargetExclusionInfoDto {
  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded: boolean;

  @ApiPropertyOptional({
    description: '제외 사유',
    example: null,
    nullable: true,
  })
  excludeReason: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    example: null,
    nullable: true,
  })
  excludedAt: Date | null;
}

/**
 * 내가 담당하는 평가 대상자의 평가항목 정보 DTO
 */
export class MyTargetEvaluationCriteriaDto {
  @ApiProperty({
    description: '평가항목 상태',
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
 * 내가 담당하는 평가 대상자의 WBS 평가기준 정보 DTO
 */
export class MyTargetWbsCriteriaDto {
  @ApiProperty({
    description: 'WBS 평가기준 상태',
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
 * 내가 담당하는 평가 대상자의 평가라인 정보 DTO
 */
export class MyTargetEvaluationLineDto {
  @ApiProperty({
    description: '평가라인 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: 'PRIMARY 평가자 지정 여부',
    example: true,
  })
  hasPrimaryEvaluator: boolean;

  @ApiProperty({
    description: 'SECONDARY 평가자 지정 여부',
    example: true,
  })
  hasSecondaryEvaluator: boolean;
}

/**
 * 성과 입력 정보 DTO
 */
export class PerformanceInputDto {
  @ApiProperty({
    description: '성과 입력 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '전체 WBS 수',
    example: 5,
  })
  totalWbsCount: number;

  @ApiProperty({
    description: '성과가 입력된 WBS 수',
    example: 5,
  })
  inputCompletedCount: number;
}

/**
 * 내가 담당하는 평가 대상자 현황 응답 DTO
 */
export class MyEvaluationTargetStatusResponseDto {
  @ApiProperty({
    description: '피평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가 대상 여부',
    example: true,
  })
  isEvaluationTarget: boolean;

  @ApiProperty({
    description: '평가 대상 제외 정보',
    type: () => MyTargetExclusionInfoDto,
  })
  @Type(() => MyTargetExclusionInfoDto)
  exclusionInfo: MyTargetExclusionInfoDto;

  @ApiProperty({
    description: '평가항목 설정 정보',
    type: () => MyTargetEvaluationCriteriaDto,
  })
  @Type(() => MyTargetEvaluationCriteriaDto)
  evaluationCriteria: MyTargetEvaluationCriteriaDto;

  @ApiProperty({
    description: 'WBS 평가기준 설정 정보',
    type: () => MyTargetWbsCriteriaDto,
  })
  @Type(() => MyTargetWbsCriteriaDto)
  wbsCriteria: MyTargetWbsCriteriaDto;

  @ApiProperty({
    description: '평가라인 지정 정보',
    type: () => MyTargetEvaluationLineDto,
  })
  @Type(() => MyTargetEvaluationLineDto)
  evaluationLine: MyTargetEvaluationLineDto;

  @ApiProperty({
    description: '성과 입력 정보',
    type: () => PerformanceInputDto,
  })
  @Type(() => PerformanceInputDto)
  performanceInput: PerformanceInputDto;

  @ApiProperty({
    description: '내가 담당하는 평가자 유형 목록',
    example: ['PRIMARY'],
    isArray: true,
  })
  myEvaluatorTypes: string[];

  @ApiProperty({
    description: '내가 담당하는 하향평가 현황',
    type: () => MyDownwardEvaluationStatusDto,
  })
  @Type(() => MyDownwardEvaluationStatusDto)
  downwardEvaluation: MyDownwardEvaluationStatusDto;
}
