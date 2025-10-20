export * from './generate-seed-data.command';
export * from './clear-seed-data.command';

import { GenerateSeedDataHandler } from './generate-seed-data.command';
import { ClearSeedDataHandler } from './clear-seed-data.command';

export const CommandHandlers = [GenerateSeedDataHandler, ClearSeedDataHandler];
