import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '@interface/decorators';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';

/**
 * 산출물 생성 DTO
 */
export class CreateDeliverableDto {
  @ApiProperty({
    description: '산출물명',
    example: 'API 설계 문서',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '산출물 설명',
    example: 'RESTful API 설계 문서 v1.0',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '산출물 유형',
    enum: DeliverableType,
    example: DeliverableType.DOCUMENT,
  })
  @IsEnum(DeliverableType)
  type: DeliverableType;

  @ApiPropertyOptional({
    description: '파일 경로',
    example: '/uploads/documents/api-design-v1.pdf',
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  wbsItemId: string;

  // createdBy는 컨트롤러에서 인증된 사용자 정보로 채워짐
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 산출물 수정 DTO
 */
export class UpdateDeliverableDto {
  @ApiPropertyOptional({
    description: '산출물명',
    example: 'API 설계 문서 v2',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '산출물 설명',
    example: 'RESTful API 설계 문서 v2.0',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '산출물 유형',
    enum: DeliverableType,
    example: DeliverableType.DOCUMENT,
  })
  @IsOptional()
  @IsEnum(DeliverableType)
  type?: DeliverableType;

  @ApiPropertyOptional({
    description: '파일 경로',
    example: '/uploads/documents/api-design-v2.pdf',
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: '직원 ID (재할당)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'WBS 항목 ID (재할당)',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  wbsItemId?: string;

  @ApiPropertyOptional({
    description: '활성 상태',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // updatedBy는 컨트롤러에서 인증된 사용자 정보로 채워짐
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}

/**
 * 벌크 산출물 생성 DTO
 */
export class BulkCreateDeliverablesDto {
  @ApiProperty({
    description: '생성할 산출물 목록',
    type: [CreateDeliverableDto],
    example: [
      {
        name: 'API 설계 문서',
        type: DeliverableType.DOCUMENT,
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440001',
      },
      {
        name: '데이터베이스 스키마',
        type: DeliverableType.CODE,
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440002',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliverableDto)
  deliverables: CreateDeliverableDto[];
}

/**
 * 벌크 산출물 삭제 DTO
 */
export class BulkDeleteDeliverablesDto {
  @ApiProperty({
    description: '삭제할 산출물 ID 목록',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  deliverableIds: string[];
}

/**
 * 산출물 응답 DTO
 */
export class DeliverableResponseDto {
  @ApiProperty({
    description: '산출물 ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  id: string;

  @ApiProperty({
    description: '산출물명',
    example: 'API 설계 문서',
  })
  name: string;

  @ApiPropertyOptional({
    description: '산출물 설명',
    example: 'RESTful API 설계 문서 v1.0',
  })
  description?: string;

  @ApiProperty({
    description: '산출물 유형',
    enum: DeliverableType,
    example: DeliverableType.DOCUMENT,
  })
  type: DeliverableType;

  @ApiPropertyOptional({
    description: '파일 경로',
    example: '/uploads/documents/api-design-v1.pdf',
  })
  filePath?: string;

  @ApiPropertyOptional({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  wbsItemId?: string;

  @ApiPropertyOptional({
    description: '매핑일',
    example: '2024-01-15T09:00:00Z',
  })
  mappedDate?: Date;

  @ApiPropertyOptional({
    description: '매핑자 ID',
    example: '550e8400-e29b-41d4-a716-446655440020',
  })
  mappedBy?: string;

  @ApiProperty({
    description: '활성 상태',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제일시',
    example: '2024-01-20T14:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440020',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440021',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;
}

/**
 * 산출물 목록 응답 DTO
 */
export class DeliverableListResponseDto {
  @ApiProperty({
    description: '산출물 목록',
    type: [DeliverableResponseDto],
  })
  deliverables: DeliverableResponseDto[];

  @ApiProperty({
    description: '총 산출물 개수',
    example: 15,
  })
  total: number;
}

/**
 * 벌크 생성 결과 DTO
 */
export class BulkCreateResultDto {
  @ApiProperty({
    description: '성공 개수',
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: '실패 개수',
    example: 2,
  })
  failedCount: number;

  @ApiProperty({
    description: '생성된 산출물 ID 목록',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
    ],
  })
  createdIds: string[];

  @ApiProperty({
    description: '실패한 항목 목록',
    type: 'array',
    example: [
      {
        data: { name: 'Invalid Deliverable' },
        error: 'Validation failed',
      },
    ],
  })
  failedItems: Array<{
    data: Partial<CreateDeliverableDto>;
    error: string;
  }>;
}

/**
 * 벌크 삭제 결과 DTO
 */
export class BulkDeleteResultDto {
  @ApiProperty({
    description: '성공 개수',
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: '실패 개수',
    example: 2,
  })
  failedCount: number;

  @ApiProperty({
    description: '실패한 ID 목록',
    type: 'array',
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        error: 'Deliverable not found',
      },
    ],
  })
  failedIds: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * 산출물 필터 DTO
 */
export class DeliverableFilterDto {
  @ApiPropertyOptional({
    description: '산출물 유형',
    enum: DeliverableType,
    example: DeliverableType.DOCUMENT,
  })
  @IsOptional()
  @IsEnum(DeliverableType)
  type?: DeliverableType;

  @ApiPropertyOptional({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  wbsItemId?: string;

  @ApiPropertyOptional({
    description: '활성 산출물만 조회',
    example: true,
  })
  @IsOptional()
  @ToBoolean(true)
  @IsBoolean()
  activeOnly?: boolean;
}

/**
 * 산출물 조회 Query DTO
 */
export class GetDeliverablesQueryDto {
  @ApiPropertyOptional({
    description:
      '활성 산출물만 조회 (기본값: true, 가능값: "true", "false", "1", "0")',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @ToBoolean(true)
  @IsBoolean()
  activeOnly?: boolean = true;
}
