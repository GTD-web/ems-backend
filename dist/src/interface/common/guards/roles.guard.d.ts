import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationManagementService } from '@context/organization-management-context';
export interface RolesGuardOptions {
    rolesRequiringAccessibilityCheck?: string[];
}
export declare const ROLES_GUARD_OPTIONS = "ROLES_GUARD_OPTIONS";
export declare class RolesGuard implements CanActivate {
    private reflector;
    private readonly organizationManagementService;
    private readonly options?;
    private readonly logger;
    private readonly rolesRequiringAccessibilityCheck;
    constructor(reflector: Reflector, organizationManagementService: OrganizationManagementService, options?: RolesGuardOptions | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
