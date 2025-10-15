import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * 직원 조회 제외 요청 DTO
 */
export class ExcludeEmployeeFromListDto {
  @ApiProperty({
    description: '조회 제외 사유',
    example: '퇴사 예정',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  excludeReason!: string;

  @ApiProperty({
    description: '제외 처리자 ID',
    example: 'admin-user-id',
  })
  @IsNotEmpty()
  @IsString()
  excludedBy!: string;
}

/**
 * 직원 조회 포함 요청 DTO
 */
export class IncludeEmployeeInListDto {
  @ApiProperty({
    description: '포함 처리자 ID',
    example: 'admin-user-id',
  })
  @IsNotEmpty()
  @IsString()
  updatedBy!: string;
}

/**
 * 직원 목록 조회 쿼리 DTO
 */
export class GetEmployeesQueryDto {
  @ApiPropertyOptional({
    description: '제외된 직원 포함 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExcluded?: boolean;

  @ApiPropertyOptional({
    description: '부서 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

/**
 * 직원 응답 DTO
 */
export class EmployeeResponseDto {
  @ApiProperty({ description: '직원 ID' })
  id!: string;

  @ApiProperty({ description: '직원 번호' })
  employeeNumber!: string;

  @ApiProperty({ description: '이름' })
  name!: string;

  @ApiProperty({ description: '이메일' })
  email!: string;

  @ApiPropertyOptional({ description: '직책명' })
  rankName?: string;

  @ApiPropertyOptional({ description: '직책 코드' })
  rankCode?: string;

  @ApiPropertyOptional({ description: '직책 레벨' })
  rankLevel?: number;

  @ApiPropertyOptional({ description: '부서명' })
  departmentName?: string;

  @ApiPropertyOptional({ description: '부서 코드' })
  departmentCode?: string;

  @ApiProperty({ description: '재직 여부' })
  isActive!: boolean;

  @ApiProperty({ description: '목록 조회 제외 여부' })
  isExcludedFromList!: boolean;

  @ApiPropertyOptional({ description: '조회 제외 사유' })
  excludeReason?: string;

  @ApiPropertyOptional({ description: '조회 제외 설정자' })
  excludedBy?: string;

  @ApiPropertyOptional({ description: '조회 제외 설정 일시' })
  excludedAt?: Date;

  @ApiProperty({ description: '생성 일시' })
  createdAt!: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt!: Date;
}
