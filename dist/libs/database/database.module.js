"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const transaction_manager_service_1 = require("./transaction-manager.service");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const databaseUrl = configService.get('DATABASE_URL');
                    const nodeEnv = configService.get('NODE_ENV', 'development');
                    const isTest = nodeEnv === 'test';
                    if (!databaseUrl) {
                        throw new Error('DATABASE_URL environment variable is required');
                    }
                    return {
                        type: 'postgres',
                        url: databaseUrl,
                        autoLoadEntities: true,
                        dropSchema: isTest,
                        synchronize: configService.get('DB_SYNCHRONIZE', nodeEnv === 'development' || isTest),
                        logging: configService.get('DB_LOGGING', nodeEnv === 'development' && !isTest),
                        ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
                        extra: {
                            connectionLimit: 10,
                            acquireTimeout: 60000,
                            timeout: 60000,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [transaction_manager_service_1.TransactionManagerService],
        exports: [transaction_manager_service_1.TransactionManagerService, typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map