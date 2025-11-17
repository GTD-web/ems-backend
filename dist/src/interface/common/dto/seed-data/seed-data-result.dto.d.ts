import { GeneratorResult } from '@context/seed-data-context/types';
export declare class SeedDataResultDto {
    success: boolean;
    message: string;
    results: GeneratorResult[];
    totalDuration: number;
}
