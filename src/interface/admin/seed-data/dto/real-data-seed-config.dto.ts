import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsNumber,
  Min,
  IsIn,
  IsObject,
} from 'class-validator';
import type { StateDistributionConfig } from '@context/seed-data-context/types';

/**
 * 평가 설정 (공통 사용)
 */
export class EvaluationConfig {
  @ApiPropertyOptional({
    description: '생성할 평가기간 수',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  periodCount?: number;
}

/**
 * 실제 데이터 기반 시드 데이터 생성 설정 DTO
 *
 * **실제 부서와 직원 데이터를 사용**하여 시드 데이터를 생성합니다.
 * - departmentCount, employeeCount 옵션은 없습니다 (DB의 실제 데이터 개수 사용)
 * - 프로젝트, WBS, 평가 관련 데이터는 설정에 따라 생성됩니다
 */
export class RealDataSeedConfigDto {
  @ApiProperty({
    description: `시나리오 타입:
- minimal: 부서와 직원만 (Phase 1)
- with_period: 평가기간 추가 (Phase 1-2)
- with_assignments: 프로젝트/WBS 배정 추가 (Phase 1-3)
- with_setup: 평가기준/질문 설정 추가 (Phase 1-6)
- full: 전체 평가 사이클 (Phase 1-8)`,
    enum: ['minimal', 'with_period', 'with_assignments', 'with_setup', 'full'],
    example: 'full',
  })
  @IsString()
  @IsIn(['minimal', 'with_period', 'with_assignments', 'with_setup', 'full'])
  scenario:
    | 'minimal'
    | 'with_period'
    | 'with_assignments'
    | 'with_setup'
    | 'full';

  @ApiPropertyOptional({
    description:
      '기존 데이터 삭제 여부. true인 경우 시드 데이터 생성 전 모든 데이터를 삭제합니다. ' +
      '**실제 데이터 사용 시 false 권장** (실제 부서/직원 데이터 보존)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  clearExisting?: boolean;

  @ApiPropertyOptional({
    description:
      '생성할 프로젝트 수 (with_assignments, with_setup, full 시나리오에서 사용)',
    example: 10,
    default: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  projectCount?: number;

  @ApiPropertyOptional({
    description:
      '프로젝트당 WBS 개수 (with_assignments, with_setup, full 시나리오에서 사용)',
    example: 15,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  wbsPerProject?: number;

  @ApiPropertyOptional({
    description: '평가 관련 설정 (with_period 이상 시나리오에서 사용)',
    type: EvaluationConfig,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluationConfig)
  evaluationConfig?: EvaluationConfig;

  @ApiPropertyOptional({
    description:
      '상태 분포 설정 (선택사항, 기본값 사용 가능). ' +
      '부서 계층 구조(departmentHierarchy), 직원 상태(employeeStatus), 직원 조회 제외(excludedFromList), ' +
      '평가 대상 제외(excludedFromEvaluation), 평가 진행 상태 등을 커스터마이징할 수 있습니다.',
    example: {
      selfEvaluationProgress: {
        completed: 1.0,
        notStarted: 0.0,
        inProgress: 0.0,
      },
      primaryDownwardEvaluationProgress: {
        completed: 0.0,
        notStarted: 1.0,
        inProgress: 0.0,
      },
    },
  })
  @IsOptional()
  @IsObject()
  stateDistribution?: StateDistributionConfig;
}
