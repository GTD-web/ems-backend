import { ApiProperty } from '@nestjs/swagger';

export class GetSeedDataStatusDto {
  @ApiProperty({
    description: '데이터 존재 여부',
    example: true,
  })
  hasData: boolean;

  @ApiProperty({
    description: '엔티티별 데이터 개수',
    example: {
      Department: 10,
      Employee: 50,
      Project: 5,
      WbsItem: 50,
      EvaluationPeriod: 1,
    },
  })
  entityCounts: Record<string, number>;
}
