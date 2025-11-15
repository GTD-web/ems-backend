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
exports.JsonStorageUtil = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
class JsonStorageUtil {
    static logger = new common_1.Logger(JsonStorageUtil.name);
    static MOCK_DATA_DIR = path.join(__dirname, '..', 'mock-data');
    static isServerlessEnvironment() {
        const forceEnable = process.env.SSO_ENABLE_JSON_STORAGE === 'true';
        if (forceEnable) {
            return false;
        }
        return (!!process.env.VERCEL ||
            !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
            !!process.env.GOOGLE_CLOUD_FUNCTION ||
            !!process.env.AZURE_FUNCTIONS_ENVIRONMENT);
    }
    static canWriteFiles() {
        if (this.isServerlessEnvironment()) {
            return false;
        }
        if (process.env.SSO_ENABLE_JSON_STORAGE === 'false') {
            return false;
        }
        return true;
    }
    static ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            this.logger.debug(`디렉토리 생성: ${dirPath}`);
        }
    }
    static generateFileName(methodName, params) {
        const sanitize = (str) => {
            return str.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        };
        let fileName = sanitize(methodName);
        if (params) {
            const sortedKeys = Object.keys(params).sort();
            const paramString = sortedKeys
                .map((key) => {
                const value = params[key];
                if (value === undefined || value === null) {
                    return '';
                }
                if (typeof value === 'object') {
                    return `${key}_${JSON.stringify(value)}`;
                }
                return `${key}_${value}`;
            })
                .filter((s) => s.length > 0)
                .join('_');
            if (paramString) {
                fileName += `_${sanitize(paramString)}`;
            }
        }
        if (fileName.length > 200) {
            const crypto = require('crypto');
            const hash = crypto
                .createHash('md5')
                .update(fileName)
                .digest('hex')
                .substring(0, 8);
            fileName = `${sanitize(methodName)}_${hash}`;
        }
        return `${fileName}.json`;
    }
    static saveResponse(methodName, params, data) {
        if (!this.canWriteFiles()) {
            this.logger.debug(`서버리스 환경이므로 JSON 저장을 건너뜁니다: ${methodName}`);
            return;
        }
        try {
            this.ensureDirectoryExists(this.MOCK_DATA_DIR);
            const fileName = this.generateFileName(methodName, params);
            const filePath = path.join(this.MOCK_DATA_DIR, fileName);
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, jsonData, 'utf-8');
            this.logger.debug(`SSO 응답 데이터 저장: ${methodName} -> ${filePath}`);
        }
        catch (error) {
            this.logger.warn(`SSO 응답 데이터 저장 실패: ${methodName}`, error.message);
        }
    }
    static loadResponse(methodName, params) {
        try {
            const fileName = this.generateFileName(methodName, params);
            const filePath = path.join(this.MOCK_DATA_DIR, fileName);
            if (!fs.existsSync(filePath)) {
                this.logger.debug(`저장된 응답 데이터 없음: ${methodName} -> ${filePath}`);
                return null;
            }
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            this.logger.debug(`저장된 응답 데이터 로드: ${methodName} -> ${filePath}`);
            return data;
        }
        catch (error) {
            this.logger.warn(`저장된 응답 데이터 로드 실패: ${methodName}`, error.message);
            return null;
        }
    }
    static listSavedResponses() {
        try {
            if (!fs.existsSync(this.MOCK_DATA_DIR)) {
                return [];
            }
            return fs
                .readdirSync(this.MOCK_DATA_DIR)
                .filter((file) => file.endsWith('.json'));
        }
        catch (error) {
            this.logger.warn('저장된 응답 파일 목록 조회 실패', error.message);
            return [];
        }
    }
}
exports.JsonStorageUtil = JsonStorageUtil;
//# sourceMappingURL=json-storage.util.js.map