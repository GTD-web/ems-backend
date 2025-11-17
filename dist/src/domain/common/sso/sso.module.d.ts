import { OnModuleInit } from '@nestjs/common';
import { SSOServiceFactory } from './sso.service.factory';
export declare const SSOService: unique symbol;
export declare class SSOModule implements OnModuleInit {
    private readonly factory;
    constructor(factory: SSOServiceFactory);
    onModuleInit(): Promise<void>;
}
