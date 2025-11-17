export declare class UserInfoDto {
    id: string;
    externalId: string;
    email: string;
    name: string;
    employeeNumber: string;
    roles: string[];
    status: string;
}
export declare class LoginResponseDto {
    user: UserInfoDto;
    accessToken: string;
    refreshToken: string;
}
