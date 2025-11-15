import { ChangePasswordResult, CheckPasswordResult, DepartmentHierarchy, DepartmentInfo, EmployeeInfo, FCMTokenInfo, GetDepartmentHierarchyParams, GetEmployeeParams, GetEmployeesManagersResponse, GetEmployeesParams, GetFCMTokenParams, GetMultipleFCMTokensParams, LoginResult, MultipleFCMTokensInfo, RefreshTokenResult, SubscribeFCMParams, SubscribeFCMResult, UnsubscribeFCMParams, UnsubscribeFCMResult, VerifyTokenResult, ISSOService } from './interfaces';
export declare class MockSSOService implements ISSOService {
    private readonly logger;
    초기화한다(): Promise<void>;
    private 로드한다;
    로그인한다(email: string, password: string): Promise<LoginResult>;
    토큰을검증한다(accessToken: string): Promise<VerifyTokenResult>;
    토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult>;
    비밀번호를확인한다(accessToken: string, password: string, email: string): Promise<CheckPasswordResult>;
    비밀번호를변경한다(accessToken: string, newPassword: string): Promise<ChangePasswordResult>;
    직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo>;
    여러직원정보를조회한다(params: GetEmployeesParams): Promise<EmployeeInfo[]>;
    여러직원원시정보를조회한다(params: GetEmployeesParams): Promise<any[]>;
    부서계층구조를조회한다(params?: GetDepartmentHierarchyParams): Promise<DepartmentHierarchy>;
    직원관리자정보를조회한다(): Promise<GetEmployeesManagersResponse>;
    FCM토큰을구독한다(params: SubscribeFCMParams): Promise<SubscribeFCMResult>;
    FCM토큰을구독해지한다(params: UnsubscribeFCMParams): Promise<UnsubscribeFCMResult>;
    FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo>;
    여러직원의FCM토큰을조회한다(params: GetMultipleFCMTokensParams): Promise<MultipleFCMTokensInfo>;
    사번으로직원을조회한다(employeeNumber: string): Promise<EmployeeInfo>;
    이메일로직원을조회한다(email: string): Promise<EmployeeInfo | null>;
    모든부서정보를조회한다(params?: GetDepartmentHierarchyParams): Promise<DepartmentInfo[]>;
    모든직원정보를조회한다(params?: GetDepartmentHierarchyParams): Promise<EmployeeInfo[]>;
}
