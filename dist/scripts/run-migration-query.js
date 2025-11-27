"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigration() {
    const config = {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
    if (!config.host || !config.user || !config.database) {
        console.error('❌ 데이터베이스 환경 변수가 설정되지 않았습니다.');
        console.error('DATABASE_HOST, DATABASE_USERNAME, DATABASE_NAME을 확인하세요.');
        process.exit(1);
    }
    console.log('📊 데이터베이스 연결 정보:');
    console.log(`  호스트: ${config.host}`);
    console.log(`  포트: ${config.port}`);
    console.log(`  데이터베이스: ${config.database}`);
    console.log(`  사용자: ${config.user}`);
    const client = new pg_1.Client(config);
    try {
        await client.connect();
        console.log('✅ 데이터베이스 연결 성공');
        const sqlPath = path.join(__dirname, 'add-is-new-enrolled-column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('📝 SQL 실행 중...');
        const result = await client.query(sql);
        console.log('✅ SQL 실행 완료');
        console.log(result);
    }
    catch (error) {
        console.error('❌ 오류 발생:', error);
        throw error;
    }
    finally {
        await client.end();
        console.log('✅ 데이터베이스 연결 종료');
    }
}
runMigration();
//# sourceMappingURL=run-migration-query.js.map