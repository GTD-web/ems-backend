import { INestApplication, Type } from '@nestjs/common';
export interface SwaggerConfigOptions {
    title: string;
    description: string;
    version: string;
    path: string;
    includeModules?: Type<any>[];
}
export declare function setupSwagger(app: INestApplication, options: SwaggerConfigOptions): void;
