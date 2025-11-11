import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@context/auth-context';
export declare class JwtAuthGuard implements CanActivate {
    private readonly authService;
    private reflector;
    private readonly logger;
    constructor(authService: AuthService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
declare module 'express' {
    interface Request {
        user?: {
            id: string;
            email: string;
            name: string;
            employeeNumber: string;
            roles: string[];
        };
    }
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    roles: string[];
}
