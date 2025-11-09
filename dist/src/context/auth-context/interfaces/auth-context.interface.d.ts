export interface AuthenticatedUserInfo {
    id: string;
    externalId: string;
    email: string;
    name: string;
    employeeNumber: string;
    roles: string[];
    status: string;
}
export interface VerifyAndSyncUserCommand {
    accessToken: string;
}
export interface VerifyAndSyncUserResult {
    user: AuthenticatedUserInfo;
    isSynced: boolean;
}
export interface GetUserWithRolesQuery {
    employeeNumber: string;
}
export interface GetUserWithRolesResult {
    user: AuthenticatedUserInfo | null;
}
export interface LoginCommand {
    email: string;
    password: string;
}
export interface LoginResult {
    user: AuthenticatedUserInfo;
    accessToken: string;
    refreshToken: string;
}
