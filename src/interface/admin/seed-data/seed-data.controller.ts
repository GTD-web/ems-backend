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
import { SeedDataConfigDto, RealDataSeedConfigDto } from './dto';
import { SeedDataResultDto } from './dto/seed-data-result.dto';
import { GetSeedDataStatusDto } from './dto/get-seed-data-status.dto';
import {
  ApiGenerateSeedData,
  ApiGenerateSeedDataWithRealData,
  ApiClearSeedData,
  ApiGetSeedDataStatus,
} from './decorators/seed-data.decorators';
import { SeedScenario } from '@context/seed-data-context/types';

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

  @Post('generate-with-real-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateSeedDataWithRealData()
  async generateSeedDataWithRealData(
    @Body() config: RealDataSeedConfigDto,
  ): Promise<SeedDataResultDto> {
    const startTime = Date.now();

    // RealDataSeedConfigDto를 SeedDataConfig로 변환 (useRealX를 true로 설정)
    const seedConfig = {
      scenario: config.scenario as SeedScenario,
      clearExisting: config.clearExisting ?? false,
      dataScale: {
        departmentCount: 0, // 사용하지 않음 (실제 데이터 사용)
        employeeCount: 0, // 사용하지 않음 (실제 데이터 사용)
        projectCount: config.projectCount ?? 5,
        wbsPerProject: config.wbsPerProject ?? 10,
      },
      evaluationConfig: {
        periodCount: config.evaluationConfig?.periodCount ?? 1,
      },
      useRealDepartments: true, // 항상 true
      useRealEmployees: true, // 항상 true
    };

    const results =
      await this.seedDataService.시드_데이터를_생성한다(seedConfig);

    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      message: '실제 데이터 기반 시드 데이터가 성공적으로 생성되었습니다.',
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
