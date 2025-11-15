import { ApiProperty } from '@nestjs/swagger';
import { GeneratorResult } from '@context/seed-data-context/types';

class GeneratorResultItemDto {
  @ApiProperty({
    description: 'Phase 이름',
    example: 'Phase1',
  })
  phase: string;

  @ApiProperty({
    description: '생성된 엔티티 개수',
    example: {
      Department: 10,
      Employee: 50,
      Project: 5,
      WbsItem: 50,
    },
  })
  entityCounts: Record<string, number>;

  @ApiProperty({
    description: '생성된 ID 목록',
    example: {
      departmentIds: ['uuid1', 'uuid2'],
      employeeIds: ['uuid3', 'uuid4'],
    },
  })
  generatedIds: Record<string, string[]>;

  @ApiProperty({
    description: '소요 시간 (밀리초)',
    example: 1500,
  })
  duration: number;

  @ApiProperty({
    description: '에러 목록 (선택사항)',
    required: false,
    example: [],
  })
  errors?: string[];
}

export class SeedDataResultDto {
  @ApiProperty({
    description: '시드 데이터 생성 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '메시지',
    example: '시드 데이터가 성공적으로 생성되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: 'Phase별 생성 결과',
    type: [GeneratorResultItemDto],
  })
  results: GeneratorResult[];

  @ApiProperty({
    description: '전체 소요 시간 (밀리초)',
    example: 5000,
  })
  totalDuration: number;
}
