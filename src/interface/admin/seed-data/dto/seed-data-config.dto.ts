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
    description: '상태 분포 설정 (선택사항, 기본값 사용 가능)',
  })
  @IsOptional()
  @IsObject()
  stateDistribution?: StateDistributionConfig;
}
