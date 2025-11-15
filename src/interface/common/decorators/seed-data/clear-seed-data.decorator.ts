import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiClearSeedData = () =>
  applyDecorators(
    ApiOperation({
      summary: '시드 데이터 삭제',
      description: '생성된 시드 데이터를 삭제합니다.',
    }),
    ApiResponse({
      status: 200,
      description: '시드 데이터 삭제 성공',
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류 (삭제 중 오류 발생)',
    }),
  );
