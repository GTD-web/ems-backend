export declare class JsonStorageUtil {
    private static readonly logger;
    private static readonly MOCK_DATA_DIR;
    private static isServerlessEnvironment;
    private static canWriteFiles;
    private static ensureDirectoryExists;
    private static generateFileName;
    static saveResponse(methodName: string, params: Record<string, any> | undefined, data: any): void;
    static loadResponse(methodName: string, params?: Record<string, any>): any | null;
    static listSavedResponses(): string[];
}
