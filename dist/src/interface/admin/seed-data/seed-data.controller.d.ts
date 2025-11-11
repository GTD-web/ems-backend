import { SeedDataService } from '@context/seed-data-context/seed-data.service';
import { SeedDataConfigDto, RealDataSeedConfigDto } from './dto';
import { SeedDataResultDto } from './dto/seed-data-result.dto';
import { GetSeedDataStatusDto } from './dto/get-seed-data-status.dto';
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
