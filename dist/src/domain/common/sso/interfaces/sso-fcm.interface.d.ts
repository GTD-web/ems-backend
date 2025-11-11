export interface ISSOfcmService {
    FCM토큰을구독한다(params: SubscribeFCMParams): Promise<SubscribeFCMResult>;
    FCM토큰을구독해지한다(params: UnsubscribeFCMParams): Promise<UnsubscribeFCMResult>;
    FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo>;
    여러직원의FCM토큰을조회한다(params: GetMultipleFCMTokensParams): Promise<MultipleFCMTokensInfo>;
}
export type DeviceType = 'android' | 'ios' | 'pc' | 'web';
export interface SubscribeFCMParams {
    employeeNumber: string;
    fcmToken: string;
    deviceType: DeviceType;
}
export interface SubscribeFCMResult {
    success: boolean;
    fcmToken: string;
    employeeNumber: string;
    deviceType: DeviceType;
}
export interface UnsubscribeFCMParams {
    employeeNumber: string;
}
export interface UnsubscribeFCMResult {
    success: boolean;
    deletedCount: number;
    message?: string;
}
export interface GetFCMTokenParams {
    employeeNumber: string;
}
export interface FCMTokenInfo {
    employeeNumber: string;
    tokens: FCMToken[];
}
export interface FCMToken {
    fcmToken: string;
    deviceType: DeviceType;
    createdAt: Date;
}
export interface GetMultipleFCMTokensParams {
    employeeNumbers: string[];
}
export interface MultipleFCMTokensInfo {
    totalEmployees: number;
    totalTokens: number;
    byEmployee: EmployeeFCMTokens[];
    allTokens: FCMToken[];
}
export interface EmployeeFCMTokens {
    employeeNumber: string;
    tokens: FCMToken[];
}
