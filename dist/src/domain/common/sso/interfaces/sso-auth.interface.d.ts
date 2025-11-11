export interface ISSOAuthService {
    로그인한다(email: string, password: string): Promise<LoginResult>;
    토큰을검증한다(accessToken: string): Promise<VerifyTokenResult>;
    토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult>;
    비밀번호를확인한다(accessToken: string, password: string, email: string): Promise<CheckPasswordResult>;
    비밀번호를변경한다(accessToken: string, newPassword: string): Promise<ChangePasswordResult>;
}
export interface LoginResult {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    accessToken: string;
    refreshToken: string;
    systemRoles?: Record<string, string[]>;
}
export interface SSOUserInfo {
    id: string;
    name: string;
    email: string;
    employee_number: string;
}
export interface VerifyTokenResult {
    valid: boolean;
    user_info: SSOUserInfo;
    expires_in: number;
}
export interface RefreshTokenResult {
    accessToken: string;
    refreshToken: string;
}
export interface CheckPasswordResult {
    valid: boolean;
    message?: string;
}
export interface ChangePasswordResult {
    success: boolean;
    message?: string;
}
