import { ISSOAuthService } from './sso-auth.interface';
import { ISSOOrganizationService } from './sso-organization.interface';
import { ISSOfcmService } from './sso-fcm.interface';
export interface ISSOClient {
    초기화한다(): Promise<void>;
    readonly auth: ISSOAuthService;
    readonly organization: ISSOOrganizationService;
    readonly fcm: ISSOfcmService;
}
export interface SSOClientConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    systemName?: string;
    timeoutMs?: number;
    retries?: number;
    retryDelay?: number;
    enableLogging?: boolean;
}
