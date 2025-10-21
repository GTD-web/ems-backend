import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SeedScenario } from '@context/seed-data-context/types';
import type { StateDistributionConfig } from '@context/seed-data-context/types';

class DataScaleDto {
  @ApiProperty({
    description: '생성할 부서 수',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  departmentCount: number;

  @ApiProperty({
    description: '생성할 직원 수',
    example: 50,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  employeeCount: number;

  @ApiProperty({
    description: '생성할 프로젝트 수',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  projectCount: number;

  @ApiProperty({
    description: '프로젝트당 WBS 개수',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  wbsPerProject: number;
}

export class SeedDataConfigDto {
  @ApiProperty({
    description: '시나리오 타입',
    enum: SeedScenario,
    example: SeedScenario.MINIMAL,
  })
  @IsEnum(SeedScenario)
  scenario: SeedScenario;

  @ApiProperty({
    description: '기존 데이터 삭제 여부',
    example: true,
  })
  @IsBoolean()
  clearExisting: boolean;

  @ApiProperty({
    description: '데이터 규모 설정',
    type: DataScaleDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DataScaleDto)
  dataScale: DataScaleDto;

  @ApiPropertyOptional({
    description: '평가 설정 (선택사항)',
    example: { periodCount: 1 },
  })
  @IsOptional()
  @IsObject()
  evaluationConfig?: {
    periodCount: number;
  };

  @ApiPropertyOptional({
    description:
      '상태 분포 설정 (선택사항, 기본값 사용 가능). ' +
      '부서 계층 구조(departmentHierarchy), 직원 상태(employeeStatus), 직원 조회 제외(excludedFromList), ' +
      '평가 대상 제외(excludedFromEvaluation), 평가 진행 상태 등을 커스터마이징할 수 있습니다. ' +
      '자세한 내용은 API 문서를 참고하세요.',
    example: {
      departmentHierarchy: {
        maxDepth: 3,
        childrenPerParent: { min: 1, max: 4 },
        rootDepartmentRatio: 0.15,
      },
      employeeStatus: { active: 0.85, onLeave: 0.05, resigned: 0.1 },
      excludedFromList: 0.03,
      excludedFromEvaluation: 0.05,
    },
  })
  @IsOptional()
  @IsObject()
  stateDistribution?: StateDistributionConfig;
}
