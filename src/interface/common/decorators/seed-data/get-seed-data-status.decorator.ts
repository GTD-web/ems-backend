import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetSeedDataStatusDto } from '../../dto/seed-data/get-seed-data-status.dto';

export const ApiGetSeedDataStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: '시드 데이터 상태 조회',
      description: '현재 시스템에 존재하는 시드 데이터의 상태를 조회합니다.',
    }),
    ApiResponse({
      status: 200,
      description: '상태 조회 성공',
      type: GetSeedDataStatusDto,
    }),
  );
