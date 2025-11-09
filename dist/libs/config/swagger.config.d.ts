import { INestApplication } from '@nestjs/common';
export interface SwaggerConfigOptions {
    title: string;
    description: string;
    version: string;
    path: string;
}
export declare function setupSwagger(app: INestApplication, options: SwaggerConfigOptions): void;
