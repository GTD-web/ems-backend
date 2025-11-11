import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Audit 로그 ID' })
  id: string;

  @ApiProperty({ description: 'HTTP 메서드' })
  requestMethod: string;

  @ApiProperty({ description: '요청 URL' })
  requestUrl: string;

  @ApiProperty({ description: '요청 경로', required: false })
  requestPath?: string;

  @ApiProperty({ description: '요청 헤더', required: false })
  requestHeaders?: Record<string, string>;

  @ApiProperty({ description: '요청 본문', required: false })
  requestBody?: any;

  @ApiProperty({ description: '요청 Query 파라미터', required: false })
  requestQuery?: Record<string, any>;

  @ApiProperty({ description: '요청 IP 주소', required: false })
  requestIp?: string;

  @ApiProperty({ description: '응답 상태 코드' })
  responseStatusCode: number;

  @ApiProperty({ description: '응답 본문', required: false })
  responseBody?: any;

  @ApiProperty({ description: '사용자 ID', required: false })
  userId?: string;

  @ApiProperty({ description: '사용자 이메일', required: false })
  userEmail?: string;

  @ApiProperty({ description: '사용자 이름', required: false })
  userName?: string;

  @ApiProperty({ description: '직원 번호', required: false })
  employeeNumber?: string;

  @ApiProperty({ description: '요청 시작 시간' })
  requestStartTime: Date;

  @ApiProperty({ description: '요청 종료 시간' })
  requestEndTime: Date;

  @ApiProperty({ description: '처리 시간 (ms)' })
  duration: number;

  @ApiProperty({ description: '요청 ID', required: false })
  requestId?: string;

  @ApiProperty({ description: '생성 시간' })
  createdAt: Date;
}

export class AuditLogListResponseDto {
  @ApiProperty({
    description: 'Audit 로그 목록',
    type: [AuditLogResponseDto],
  })
  items: AuditLogResponseDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지 크기' })
  limit: number;
}
