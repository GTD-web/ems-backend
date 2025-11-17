import { SeedDataService } from '@context/seed-data-context/seed-data.service';
import { SeedDataConfigDto, RealDataSeedConfigDto } from '@interface/common/dto/seed-data';
import { SeedDataResultDto } from '@interface/common/dto/seed-data/seed-data-result.dto';
import { GetSeedDataStatusDto } from '@interface/common/dto/seed-data/get-seed-data-status.dto';
export declare class SeedDataController {
    private readonly seedDataService;
    constructor(seedDataService: SeedDataService);
    generateSeedData(config: SeedDataConfigDto, req: any): Promise<SeedDataResultDto>;
    generateSeedDataWithRealData(config: RealDataSeedConfigDto, req: any): Promise<SeedDataResultDto>;
    clearSeedData(): Promise<{
        message: string;
    }>;
    getSeedDataStatus(): Promise<GetSeedDataStatusDto>;
}
