// 쿼리 클래스 export
export * from './get-test-environment-status.handler';

// 핸들러 import
import { GetTestEnvironmentStatusHandler } from './get-test-environment-status.handler';

export const QUERY_HANDLERS = [GetTestEnvironmentStatusHandler];
