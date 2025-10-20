import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SeedDataService } from '@context/seed-data-context/seed-data.service';
import { SeedDataConfigDto } from './dto/seed-data-config.dto';
import { SeedDataResultDto } from './dto/seed-data-result.dto';
import { GetSeedDataStatusDto } from './dto/get-seed-data-status.dto';
import {
  ApiGenerateSeedData,
  ApiClearSeedData,
  ApiGetSeedDataStatus,
} from './decorators/seed-data.decorators';

@ApiTags('A-0-1. Seed Data')
@ApiBearerAuth('Bearer')
@Controller('admin/seed')
export class SeedDataController {
  constructor(private readonly seedDataService: SeedDataService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateSeedData()
  async generateSeedData(
    @Body() config: SeedDataConfigDto,
  ): Promise<SeedDataResultDto> {
    const startTime = Date.now();

    const results = await this.seedDataService.시드_데이터를_생성한다(config);

    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      message: '시드 데이터가 성공적으로 생성되었습니다.',
      results,
      totalDuration,
    };
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiClearSeedData()
  async clearSeedData(): Promise<{ message: string }> {
    await this.seedDataService.시드_데이터를_삭제한다(true);

    return {
      message: '시드 데이터가 성공적으로 삭제되었습니다.',
    };
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiGetSeedDataStatus()
  async getSeedDataStatus(): Promise<GetSeedDataStatusDto> {
    const status = await this.seedDataService.시드_데이터_상태를_조회한다();

    return status;
  }
}
