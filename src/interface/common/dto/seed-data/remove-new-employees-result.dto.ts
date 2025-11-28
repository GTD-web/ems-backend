import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 신규 입사자 삭제 결과 DTO
 */
export class RemoveNewEmployeesResultDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '메시지',
    example: '신규 입사자 5명이 성공적으로 삭제되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '삭제된 직원 수',
    example: 5,
  })
  removedCount: number;

  @ApiProperty({
    description: '배치 번호',
    example: 'NEW1732512345',
  })
  batchNumber: string;

  @ApiPropertyOptional({
    description: '삭제된 직원 목록',
    type: [String],
    example: ['홍길동 (NEW1732512345001)', '김철수 (NEW1732512345002)'],
  })
  removedEmployees?: string[];
}

