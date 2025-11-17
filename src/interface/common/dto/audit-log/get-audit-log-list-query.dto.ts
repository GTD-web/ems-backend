import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAuditLogListQueryDto {
  @ApiPropertyOptional({ description: '사용자 ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '사용자 이메일' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: '직원 번호' })
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @ApiPropertyOptional({
    description: 'HTTP 메서드',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  @IsOptional()
  @IsString()
  requestMethod?: string;

  @ApiPropertyOptional({ description: '요청 URL (부분 일치)' })
  @IsOptional()
  @IsString()
  requestUrl?: string;

  @ApiPropertyOptional({ description: '응답 상태 코드' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  responseStatusCode?: number;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
