import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    checkConnection(): Promise<boolean>;
    closeConnection(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        database: string;
        connection: boolean;
        responseTime?: number;
    }>;
    getDatabaseStats(): Promise<{
        totalConnections: number;
        activeConnections: number;
        databaseSize: string;
        version: string;
    }>;
    runMigrations(): Promise<void>;
    revertMigrations(): Promise<void>;
}
