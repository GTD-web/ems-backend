import { ConfigService } from '@nestjs/config';
import { ISSOService } from './interfaces';
export declare class SSOServiceFactory {
    private readonly config;
    private readonly systemName;
    private readonly configService;
    private readonly logger;
    private serviceInstance;
    constructor(config: any, systemName: string, configService: ConfigService);
    create(): ISSOService;
    initialize(): Promise<void>;
}
