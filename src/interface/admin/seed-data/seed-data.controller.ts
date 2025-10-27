import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Request,
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
} from './decorators';
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
    @Request() req: any,
  ): Promise<SeedDataResultDto> {
    const startTime = Date.now();

    // 현재 사용자 정보를 설정에 추가
    const configWithUser = {
      ...config,
      currentUserId: config.includeCurrentUserAsEvaluator ? req.user?.id : undefined,
    };

    const results = await this.seedDataService.시드_데이터를_생성한다(configWithUser);

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
    @Request() req: any,
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
      stateDistribution: config.stateDistribution, // 상태 분포 설정 전달
      useRealDepartments: true, // 항상 true
      useRealEmployees: true, // 항상 true
      currentUserId: config.includeCurrentUserAsEvaluator ? req.user?.id : undefined,
    };

    // 디버그: 설정 로깅
    if (config.stateDistribution) {
      console.log(
        '[Controller] stateDistribution.selfEvaluationProgress:',
        JSON.stringify(config.stateDistribution.selfEvaluationProgress),
      );
    }

    if (config.includeCurrentUserAsEvaluator) {
      console.log(
        '[Controller] 현재 사용자를 평가자로 등록:',
        req.user?.id,
      );
    }

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
