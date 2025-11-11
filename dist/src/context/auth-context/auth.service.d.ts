import { VerifyAndSyncUserHandler } from './handlers/verify-and-sync-user.handler';
import { GetUserWithRolesHandler } from './handlers/get-user-with-roles.handler';
import { LoginHandler } from './handlers/login.handler';
import { VerifyAndSyncUserResult, GetUserWithRolesResult, LoginResult } from './interfaces/auth-context.interface';
export declare class AuthService {
    private readonly verifyAndSyncUserHandler;
    private readonly getUserWithRolesHandler;
    private readonly loginHandler;
    constructor(verifyAndSyncUserHandler: VerifyAndSyncUserHandler, getUserWithRolesHandler: GetUserWithRolesHandler, loginHandler: LoginHandler);
    토큰검증및사용자조회(accessToken: string): Promise<VerifyAndSyncUserResult>;
    역할포함사용자조회(employeeNumber: string): Promise<GetUserWithRolesResult>;
    로그인한다(email: string, password: string): Promise<LoginResult>;
}
